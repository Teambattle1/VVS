// ============================================
// jobsRepo - Supabase CRUD for VVS FLOW job-data.
// Bruges af JobsContext når hasSupabase = true.
// ============================================
import { supabase } from './supabase.js'

// Hjælper: map DB-row fra vvs_jobs til det shape app'en forventer
function normalizeJob(row) {
  if (!row) return null
  return {
    id: row.id,
    job_number: row.job_number,
    title: row.title,
    status: row.status,
    vat_handling: row.vat_handling,
    total_price_excl_vat: row.total_price_excl_vat || 0,
    share_token: row.share_token,
    created_at: row.created_at,
    updated_at: row.updated_at,
    signed_at: row.signed_at,
    signed_by: row.signed_by,
    signature: row.signature,
    assigned_to: row.vvs_users_assigned?.name,
    customer: row.vvs_customers
      ? {
          id: row.vvs_customers.id,
          name: row.vvs_customers.name,
          address: [row.vvs_customers.address, row.vvs_customers.zip, row.vvs_customers.city]
            .filter(Boolean)
            .join(', '),
          email: row.vvs_customers.email,
          phone: row.vvs_customers.phone,
          customer_type: row.vvs_customers.customer_type,
          lat: row.vvs_customers.lat ? Number(row.vvs_customers.lat) : null,
          lon: row.vvs_customers.lon ? Number(row.vvs_customers.lon) : null,
          zip: row.vvs_customers.zip,
          city: row.vvs_customers.city,
        }
      : null,
    rooms: (row.vvs_rooms || [])
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((r) => ({
        id: r.id,
        name: r.name,
        room_type: r.room_type,
        width_cm: r.width_cm,
        length_cm: r.length_cm,
        floorplan_mode: r.floorplan_mode,
        floorplan_data: r.floorplan_data || { lines: [] },
        floorplan_image_url: r.floorplan_image_url,
        packages: (r.vvs_room_packages || []).map((p) => ({
          id: p.id,
          template_id: p.template_id,
          name: p.name,
          lucide_icon: p.lucide_icon,
          position_x: Number(p.position_x) || 0,
          position_y: Number(p.position_y) || 0,
          pricing_model: p.pricing_model,
          fixed_price: Number(p.fixed_price) || 0,
          hours: Number(p.hours) || 0,
          hourly_rate: p.hourly_rate ? Number(p.hourly_rate) : null,
          notes: p.notes || '',
          timeline_text: p.timeline_text || '',
          status: p.status || 'draft',
          photos: p.photos || [],
          items: (p.vvs_package_items || []).map((i) => ({
            id: i.id,
            item_id: i.item_id,
            name_snapshot: i.name_snapshot,
            quantity: Number(i.quantity) || 0,
            unit_price: Number(i.unit_price) || 0,
            customer_selected: i.customer_selected !== false,
          })),
        })),
      })),
    actions: (row.vvs_customer_actions || []).map((a) => ({
      id: a.id,
      action_type: a.action_type,
      actor_name: a.customer_name,
      actor_type: 'customer',
      message: a.message,
      customer_email: a.customer_email,
      room_package_id: a.room_package_id,
      package_item_id: a.package_item_id,
      created_at: a.created_at,
    })),
  }
}

// ============================================
// Jobs
// ============================================
export async function loadJobsForOrg(orgId) {
  const { data, error } = await supabase
    .from('vvs_jobs')
    .select(`
      *,
      vvs_customers (*),
      vvs_rooms (
        *,
        vvs_room_packages (
          *,
          vvs_package_items (*)
        )
      ),
      vvs_customer_actions (*)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(normalizeJob)
}

export async function loadJobByShareToken(token) {
  const { data, error } = await supabase
    .from('vvs_jobs')
    .select(`
      *,
      vvs_customers (*),
      vvs_rooms (
        *,
        vvs_room_packages (
          *,
          vvs_package_items (*)
        )
      ),
      vvs_customer_actions (*),
      vvs_organizations (*)
    `)
    .eq('share_token', token)
    .maybeSingle()

  if (error) throw error
  return data ? { job: normalizeJob(data), org: data.vvs_organizations } : null
}

export async function createJob({ orgId, title, customerId, vatHandling, assignedTo, createdBy }) {
  // Generer næste job-nummer (simpelt: find højeste + 1 for året)
  const year = new Date().getFullYear()
  const prefix = `JOB-${year}-`
  const { data: existing } = await supabase
    .from('vvs_jobs')
    .select('job_number')
    .eq('organization_id', orgId)
    .like('job_number', `${prefix}%`)
    .order('job_number', { ascending: false })
    .limit(1)

  const lastNum = existing?.[0]?.job_number
    ? parseInt(existing[0].job_number.slice(prefix.length), 10)
    : 0
  const jobNumber = `${prefix}${String(lastNum + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('vvs_jobs')
    .insert({
      organization_id: orgId,
      job_number: jobNumber,
      title,
      customer_id: customerId,
      vat_handling: vatHandling,
      status: 'draft',
      assigned_to: assignedTo,
      created_by: createdBy,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateJob(jobId, patch) {
  const { data, error } = await supabase
    .from('vvs_jobs')
    .update(patch)
    .eq('id', jobId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ============================================
// Customers
// ============================================
export async function createCustomer({
  orgId, name, email, phone, address, zip, city, lat, lon,
  customerType, defaultVatHandling,
}) {
  const { data, error } = await supabase
    .from('vvs_customers')
    .insert({
      organization_id: orgId,
      name,
      email,
      phone,
      address,
      zip,
      city,
      lat: lat ?? null,
      lon: lon ?? null,
      customer_type: customerType,
      default_vat_handling: defaultVatHandling,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ============================================
// Rooms
// ============================================
export async function createRoom({ jobId, orgId, name, roomType, widthCm, lengthCm, floorplanMode, sortOrder }) {
  const { data, error } = await supabase
    .from('vvs_rooms')
    .insert({
      job_id: jobId,
      organization_id: orgId,
      name,
      room_type: roomType,
      width_cm: widthCm,
      length_cm: lengthCm,
      floorplan_mode: floorplanMode || 'rectangle',
      sort_order: sortOrder || 0,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRoom(roomId, patch) {
  const { data, error } = await supabase
    .from('vvs_rooms')
    .update(patch)
    .eq('id', roomId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRoom(roomId) {
  const { error } = await supabase.from('vvs_rooms').delete().eq('id', roomId)
  if (error) throw error
}

// ============================================
// Room packages (placerede pakker)
// ============================================
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function createRoomPackage({ roomId, orgId, templateId, name, lucideIcon, positionX, positionY, pricingModel, fixedPrice, hours, hourlyRate }) {
  // Mock-template-IDs (fx 't-bath-06') er ikke UUIDs — send null til DB for at undgaa 22P02
  const safeTemplateId = templateId && UUID_RE.test(String(templateId)) ? templateId : null
  const { data, error } = await supabase
    .from('vvs_room_packages')
    .insert({
      room_id: roomId,
      organization_id: orgId,
      template_id: safeTemplateId,
      name,
      lucide_icon: lucideIcon,
      position_x: positionX,
      position_y: positionY,
      pricing_model: pricingModel,
      fixed_price: fixedPrice || 0,
      hours: hours || 0,
      hourly_rate: hourlyRate,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRoomPackage(pkgId, patch) {
  const { data, error } = await supabase
    .from('vvs_room_packages')
    .update(patch)
    .eq('id', pkgId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRoomPackage(pkgId) {
  const { error } = await supabase.from('vvs_room_packages').delete().eq('id', pkgId)
  if (error) throw error
}

// ============================================
// Package items
// ============================================
export async function createPackageItem({ roomPackageId, orgId, itemId, nameSnapshot, quantity, unitPrice, addedBy }) {
  const totalPrice = (Number(quantity) || 0) * (Number(unitPrice) || 0)
  const { data, error } = await supabase
    .from('vvs_package_items')
    .insert({
      room_package_id: roomPackageId,
      organization_id: orgId,
      item_id: itemId,
      name_snapshot: nameSnapshot,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      added_by: addedBy || 'montor',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePackageItem(piId, patch) {
  const { data, error } = await supabase
    .from('vvs_package_items')
    .update(patch)
    .eq('id', piId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePackageItem(piId) {
  const { error } = await supabase.from('vvs_package_items').delete().eq('id', piId)
  if (error) throw error
}

// ============================================
// Customer actions
// ============================================
export async function logCustomerAction({ jobId, orgId, actionType, message, customerName, customerEmail, roomPackageId, packageItemId }) {
  const { data, error } = await supabase
    .from('vvs_customer_actions')
    .insert({
      job_id: jobId,
      organization_id: orgId,
      action_type: actionType,
      message,
      customer_name: customerName,
      customer_email: customerEmail,
      room_package_id: roomPackageId,
      package_item_id: packageItemId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ============================================
// Items (varedatabase)
// ============================================
export async function loadItemsForOrg(orgId) {
  const { data, error } = await supabase
    .from('vvs_items')
    .select('*')
    .eq('organization_id', orgId)
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data || []
}

export async function createItem({ orgId, name, sku, category, unit, salesPrice, costPrice, createdBy }) {
  const { data, error } = await supabase
    .from('vvs_items')
    .insert({
      organization_id: orgId,
      name,
      sku,
      category,
      unit,
      sales_price: salesPrice,
      cost_price: costPrice || 0,
      created_by: createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateItem(itemId, patch) {
  const { data, error } = await supabase
    .from('vvs_items')
    .update(patch)
    .eq('id', itemId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteItem(itemId) {
  const { error } = await supabase
    .from('vvs_items')
    .update({ active: false })
    .eq('id', itemId)
  if (error) throw error
}

// ============================================
// Room templates (bruger-definerede rum-skabeloner pr. org)
// ============================================
export async function loadRoomTemplates(orgId) {
  const { data, error } = await supabase
    .from('vvs_room_templates')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createRoomTemplate({ orgId, name, roomType, widthCm, lengthCm, packages, createdBy }) {
  const { data, error } = await supabase
    .from('vvs_room_templates')
    .insert({
      organization_id: orgId,
      name,
      room_type: roomType,
      width_cm: widthCm,
      length_cm: lengthCm,
      packages: packages || [],
      created_by: createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRoomTemplate(templateId) {
  const { error } = await supabase.from('vvs_room_templates').delete().eq('id', templateId)
  if (error) throw error
}

// ============================================
// Package templates (læs globale + org-specifikke)
// ============================================
export async function loadTemplates(orgId) {
  const { data, error } = await supabase
    .from('vvs_package_templates')
    .select('*')
    .or(`organization_id.is.null,organization_id.eq.${orgId}`)
    .eq('active', true)
    .order('category')
    .order('name')
  if (error) throw error
  return data || []
}

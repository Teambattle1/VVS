import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { MOCK_JOBS } from '../lib/mockJobs.js'
import { INITIAL_ITEMS } from '../lib/mockItems.js'
import { PACKAGE_TEMPLATES } from '../lib/mockTemplates.js'
import { jobTotal } from '../lib/pricing.js'
import { hasSupabase } from '../lib/supabase.js'
import * as repo from '../lib/jobsRepo.js'
import { useAuth } from './AuthContext.jsx'
import { useToast } from './ToastContext.jsx'
import { useOrg } from './OrgContext.jsx'

const JobsContext = createContext(null)

function nextJobNumber(existing) {
  const year = new Date().getFullYear()
  const prefix = `JOB-${year}-`
  const highest = existing
    .map((j) => j.job_number)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0)
  return `${prefix}${String(highest + 1).padStart(4, '0')}`
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function genShareToken() {
  return `share-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

// Mock-seed (bruges KUN hvis Supabase ikke er konfigureret)
function seedJobs() {
  const base = MOCK_JOBS.map((j) => ({ ...j, rooms: [], actions: [] }))
  base[0].rooms = [
    {
      id: uid('room'),
      name: 'Badeværelse 1. sal',
      room_type: 'bathroom',
      width_cm: 260,
      length_cm: 340,
      floorplan_mode: 'rectangle',
      packages: [
        {
          id: uid('pkg'),
          template_id: 't-bath-02',
          name: 'Toilet m/ skjult cisterne',
          lucide_icon: 'Toilet',
          position_x: 0.25,
          position_y: 0.25,
          pricing_model: 'fixed',
          fixed_price: 6800,
          hours: 5,
          hourly_rate: null,
          notes: '',
          timeline_text: '',
          status: 'draft',
          items: [
            { id: uid('pi'), item_id: 'i-002', name_snapshot: 'Toiletkumme Duravit', quantity: 1, unit_price: 3450, customer_selected: true },
            { id: uid('pi'), item_id: 'i-003', name_snapshot: 'Cisterne Geberit Sigma', quantity: 1, unit_price: 2150, customer_selected: true },
          ],
        },
        {
          id: uid('pkg'),
          template_id: 't-bath-03',
          name: 'Bad / brusekabine',
          lucide_icon: 'ShowerHead',
          position_x: 0.7,
          position_y: 0.3,
          pricing_model: 'package_plus',
          fixed_price: 4500,
          hours: 4,
          hourly_rate: null,
          notes: 'Unidrain gulvafløb leveres af kunde.',
          timeline_text: '2-3 dages arbejde',
          status: 'draft',
          items: [
            { id: uid('pi'), item_id: 'i-008', name_snapshot: 'Brusesæt Grohe Tempesta', quantity: 1, unit_price: 890, customer_selected: true },
          ],
        },
      ],
    },
  ]
  return base.map((j) => ({
    ...j,
    total_price_excl_vat: jobTotal(j),
    rooms_count: j.rooms.length,
  }))
}

export function JobsProvider({ children }) {
  const { user } = useAuth()
  const { org } = useOrg()
  const toast = useToast()
  const [jobs, setJobs] = useState(() => (hasSupabase ? [] : seedJobs()))
  const [items, setItems] = useState(hasSupabase ? [] : INITIAL_ITEMS)
  const [templates, setTemplates] = useState(() =>
    hasSupabase ? [] : PACKAGE_TEMPLATES.map((t) => ({ ...t, active: true }))
  )
  const [orgId, setOrgId] = useState(null)
  const [dbUserId, setDbUserId] = useState(null)
  const [roomTemplates, setRoomTemplates] = useState([])

  // Synk orgId med den aktive org fra OrgContext (saa super-admin kan skifte)
  useEffect(() => {
    if (org?.id) setOrgId(org.id)
  }, [org?.id])
  const [dbLoading, setDbLoading] = useState(false)
  const supabaseModeRef = useRef(hasSupabase)

  function reportDbError(where, err) {
    // eslint-disable-next-line no-console
    console.warn(`[JobsContext] ${where}:`, err)
    const msg = err?.message || String(err)
    toast?.error?.(`${where}: ${msg}`, { duration: 6000 })
  }

  const recomputeJob = useCallback((job) => ({
    ...job,
    total_price_excl_vat: jobTotal(job),
    rooms_count: job.rooms?.length || 0,
    updated_at: new Date().toISOString(),
  }), [])

  // ============================================
  // Supabase: load vvs_users profile for at finde org, så data kan hentes
  // ============================================
  useEffect(() => {
    if (!hasSupabase || !user) {
      setDbUserId(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { supabase } = await import('../lib/supabase.js')
        const { data } = await supabase
          .from('vvs_users')
          .select('id')
          .eq('user_id', user.id)
          .eq('active', true)
          .maybeSingle()
        if (!cancelled && data) {
          setDbUserId(data.id)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[JobsContext] Kunne ikke hente bruger-profil:', err.message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  // ============================================
  // Supabase: load jobs/items/templates når org er fundet
  // ============================================
  const refresh = useCallback(async () => {
    if (!hasSupabase || !orgId) return
    setDbLoading(true)
    try {
      const [jobsData, itemsData, templatesData, roomTemplatesData] = await Promise.all([
        repo.loadJobsForOrg(orgId),
        repo.loadItemsForOrg(orgId),
        repo.loadTemplates(orgId),
        repo.loadRoomTemplates(orgId).catch(() => []), // kan fejle hvis tabel mangler
      ])
      setJobs(jobsData.map((j) => ({
        ...j,
        total_price_excl_vat: jobTotal(j),
        rooms_count: j.rooms?.length || 0,
      })))
      setItems(itemsData)
      setTemplates(templatesData)
      setRoomTemplates(roomTemplatesData)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[JobsContext] refresh() fejlede:', err.message)
    } finally {
      setDbLoading(false)
    }
  }, [orgId])

  async function saveRoomAsTemplate(jobId, roomId, templateName) {
    const room = getRoom(jobId, roomId)
    if (!room) throw new Error('Rum findes ikke')
    const packagesData = (room.packages || []).map((p) => ({
      template_id: p.template_id,
      name: p.name,
      lucide_icon: p.lucide_icon,
      position_x: p.position_x,
      position_y: p.position_y,
      pricing_model: p.pricing_model,
      fixed_price: p.fixed_price,
      hours: p.hours,
      hourly_rate: p.hourly_rate,
      shape: p.shape,
      color: p.color,
      size: p.size,
    }))

    if (hasSupabase && orgId) {
      try {
        const tpl = await repo.createRoomTemplate({
          orgId,
          name: templateName,
          roomType: room.room_type,
          widthCm: room.width_cm,
          lengthCm: room.length_cm,
          packages: packagesData,
          createdBy: dbUserId,
        })
        setRoomTemplates((prev) => [tpl, ...prev])
        toast?.success?.(`Skabelon "${templateName}" gemt`)
        return tpl
      } catch (err) {
        reportDbError('Kunne ikke gemme skabelon', err)
        throw err
      }
    }
    // Mock-fallback (localStorage)
    const local = { id: uid('rtpl'), name: templateName, room_type: room.room_type, width_cm: room.width_cm, length_cm: room.length_cm, packages: packagesData, created_at: new Date().toISOString() }
    setRoomTemplates((prev) => [local, ...prev])
    return local
  }

  async function deleteRoomTemplate(templateId) {
    setRoomTemplates((prev) => prev.filter((t) => t.id !== templateId))
    if (hasSupabase && orgId && !templateId.startsWith('rtpl-')) {
      try {
        await repo.deleteRoomTemplate(templateId)
      } catch (err) {
        reportDbError('Kunne ikke slette skabelon', err)
      }
    }
  }

  useEffect(() => {
    if (orgId) refresh()
  }, [orgId, refresh])

  // ============================================
  // JOBS
  // ============================================
  function addJob({ title, customer, vatHandling }) {
    const id = uid('job')
    const newJob = recomputeJob({
      id,
      job_number: nextJobNumber(jobs),
      title: title.trim(),
      customer: {
        name: customer.name.trim(),
        address: customer.address.trim(),
        customer_type: customer.customer_type,
        lat: customer.lat || null,
        lon: customer.lon || null,
        zip: customer.zip || null,
        city: customer.city || null,
      },
      status: 'draft',
      vat_handling: vatHandling,
      rooms: [],
      actions: [],
      share_token: genShareToken(),
      assigned_to: 'Mikkel Montør',
    })
    // Optimistisk local update
    setJobs((prev) => [newJob, ...prev])

    // Async: skriv til DB + refresh
    if (hasSupabase && orgId) {
      ;(async () => {
        try {
          const dbCustomer = await repo.createCustomer({
            orgId,
            name: customer.name,
            address: customer.address,
            zip: customer.zip,
            city: customer.city,
            customerType: customer.customer_type,
            defaultVatHandling: vatHandling,
          })
          await repo.createJob({
            orgId,
            title,
            customerId: dbCustomer.id,
            vatHandling,
            assignedTo: dbUserId,
            createdBy: dbUserId,
          })
          await refresh()
          toast?.success?.('Sag gemt i DB')
        } catch (err) {
          reportDbError('Kunne ikke gemme sag', err)
        }
      })()
    } else if (hasSupabase && !orgId) {
      toast?.error?.('Bruger er ikke koblet til en org (vvs_users mangler)', { duration: 8000 })
    }
    return newJob
  }

  function updateJob(jobId, patch) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? recomputeJob({ ...j, ...patch }) : j))
    )
    if (hasSupabase && orgId && !jobId.startsWith('job-')) {
      // Kun rigtige DB-IDs (UUID) - ikke mock
      repo.updateJob(jobId, patch).catch((err) =>
        // eslint-disable-next-line no-console
        console.warn('[JobsContext] updateJob DB-write fejlede:', err.message)
      )
    }
  }

  // ============================================
  // ROOMS
  // ============================================
  async function addRoom(jobId, {
    name,
    room_type,
    width_cm,
    length_cm,
    floorplan_mode = 'rectangle',
    suggested_templates = [],
    preset_packages = null, // fra gemt skabelon: array af faerdige package-objekter
  }) {
    const templateMap = new Map(
      (templates.length ? templates : PACKAGE_TEMPLATES).map((t) => [t.id, t])
    )
    const packages = preset_packages
      ? preset_packages.map((p) => ({
          id: uid('pkg'),
          template_id: p.template_id,
          name: p.name,
          lucide_icon: p.lucide_icon,
          position_x: p.position_x,
          position_y: p.position_y,
          pricing_model: p.pricing_model,
          fixed_price: p.fixed_price || 0,
          hours: p.hours || 0,
          hourly_rate: p.hourly_rate,
          notes: '',
          timeline_text: '',
          status: 'draft',
          shape: p.shape || 'circle',
          color: p.color || '#E11D48',
          size: p.size || 'md',
          items: [],
        }))
      : suggested_templates
      .map((tid) => templateMap.get(tid))
      .filter(Boolean)
      .map((tpl, idx, arr) => {
        const cols = Math.max(2, Math.ceil(Math.sqrt(arr.length)))
        const row = Math.floor(idx / cols)
        const col = idx % cols
        const xStep = 1 / (cols + 1)
        const yStep = 1 / (Math.ceil(arr.length / cols) + 1)
        return {
          id: uid('pkg'),
          template_id: tpl.id,
          name: tpl.name,
          lucide_icon: tpl.lucide_icon,
          position_x: (col + 1) * xStep,
          position_y: (row + 1) * yStep,
          pricing_model: tpl.pricing_model,
          fixed_price: tpl.base_price || 0,
          hours: tpl.base_hours || 0,
          hourly_rate: tpl.hourly_rate,
          notes: '',
          timeline_text: '',
          status: 'draft',
          items: [],
        }
      })

    const room = {
      id: uid('room'),
      name: name.trim(),
      room_type,
      width_cm: Number(width_cm) || 300,
      length_cm: Number(length_cm) || 300,
      floorplan_mode,
      floorplan_data: { lines: [] },
      floorplan_image_url: null,
      packages,
    }
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? recomputeJob({ ...j, rooms: [...j.rooms, room] }) : j
      )
    )

    if (hasSupabase && orgId) {
      try {
        const dbRoom = await repo.createRoom({
          jobId,
          orgId,
          name,
          roomType: room_type,
          widthCm: width_cm,
          lengthCm: length_cm,
          floorplanMode: floorplan_mode,
        })
        for (const pkg of packages) {
          await repo.createRoomPackage({
            roomId: dbRoom.id,
            orgId,
            templateId: pkg.template_id,
            name: pkg.name,
            lucideIcon: pkg.lucide_icon,
            positionX: pkg.position_x,
            positionY: pkg.position_y,
            pricingModel: pkg.pricing_model,
            fixedPrice: pkg.fixed_price,
            hours: pkg.hours,
            hourlyRate: pkg.hourly_rate,
          })
        }
        await refresh()
        return { ...room, id: dbRoom.id } // ægte UUID så navigation virker
      } catch (err) {
        reportDbError('Kunne ikke gemme rum', err)
        return room // fallback til optimistic så UI ikke hænger
      }
    }
    return room
  }

  function updateRoom(jobId, roomId, patch) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? recomputeJob({
              ...j,
              rooms: j.rooms.map((r) => (r.id === roomId ? { ...r, ...patch } : r)),
            })
          : j
      )
    )
    if (hasSupabase && orgId && !roomId.startsWith('room-')) {
      repo.updateRoom(roomId, patch).catch((err) =>
        // eslint-disable-next-line no-console
        console.warn('[JobsContext] updateRoom DB-write fejlede:', err.message)
      )
    }
  }

  function deleteRoom(jobId, roomId) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? recomputeJob({ ...j, rooms: j.rooms.filter((r) => r.id !== roomId) })
          : j
      )
    )
    if (hasSupabase && orgId && !roomId.startsWith('room-')) {
      repo.deleteRoom(roomId).catch((err) =>
        // eslint-disable-next-line no-console
        console.warn('[JobsContext] deleteRoom DB-write fejlede:', err.message)
      )
    }
  }

  function addDrawingLine(jobId, roomId, points, opts = {}) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              rooms: j.rooms.map((r) =>
                r.id === roomId
                  ? {
                      ...r,
                      floorplan_data: {
                        ...(r.floorplan_data || {}),
                        lines: [
                          ...(r.floorplan_data?.lines || []),
                          {
                            id: uid('ln'),
                            points,
                            color: opts.color || '#0F172A',
                            width: opts.width || 3,
                          },
                        ],
                      },
                    }
                  : r
              ),
            }
          : j
      )
    )
  }

  function clearDrawing(jobId, roomId) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              rooms: j.rooms.map((r) =>
                r.id === roomId
                  ? {
                      ...r,
                      floorplan_data: { ...(r.floorplan_data || {}), lines: [] },
                    }
                  : r
              ),
            }
          : j
      )
    )
  }

  function undoDrawing(jobId, roomId) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              rooms: j.rooms.map((r) =>
                r.id === roomId
                  ? {
                      ...r,
                      floorplan_data: {
                        ...(r.floorplan_data || {}),
                        lines: (r.floorplan_data?.lines || []).slice(0, -1),
                      },
                    }
                  : r
              ),
            }
          : j
      )
    )
  }

  // ============================================
  // PACKAGES (på et rum)
  // ============================================
  async function addPackage(jobId, roomId, template, position) {
    const pkg = {
      id: uid('pkg'),
      template_id: template.id,
      name: template.name,
      lucide_icon: template.lucide_icon,
      position_x: position?.x ?? 0.5,
      position_y: position?.y ?? 0.5,
      pricing_model: template.pricing_model,
      fixed_price: template.base_price || 0,
      hours: template.base_hours || 0,
      hourly_rate: template.hourly_rate,
      notes: '',
      timeline_text: '',
      status: 'draft',
      items: [],
    }
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? recomputeJob({
              ...j,
              rooms: j.rooms.map((r) =>
                r.id === roomId ? { ...r, packages: [...r.packages, pkg] } : r
              ),
            })
          : j
      )
    )

    if (hasSupabase && orgId && !roomId.startsWith('room-')) {
      try {
        const dbPkg = await repo.createRoomPackage({
          roomId,
          orgId,
          templateId: template.id,
          name: template.name,
          lucideIcon: template.lucide_icon,
          positionX: pkg.position_x,
          positionY: pkg.position_y,
          pricingModel: template.pricing_model,
          fixedPrice: template.base_price,
          hours: template.base_hours,
          hourlyRate: template.hourly_rate,
        })
        await refresh()
        return { ...pkg, id: dbPkg.id }
      } catch (err) {
        reportDbError('Kunne ikke gemme pakke', err)
        return pkg
      }
    }
    return pkg
  }

  function updatePackage(jobId, roomId, pkgId, patch) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? recomputeJob({
              ...j,
              rooms: j.rooms.map((r) =>
                r.id === roomId
                  ? {
                      ...r,
                      packages: r.packages.map((p) =>
                        p.id === pkgId ? { ...p, ...patch } : p
                      ),
                    }
                  : r
              ),
            })
          : j
      )
    )
    if (hasSupabase && orgId && !pkgId.startsWith('pkg-')) {
      repo.updateRoomPackage(pkgId, patch).catch((err) =>
        // eslint-disable-next-line no-console
        console.warn('[JobsContext] updatePackage DB-write fejlede:', err.message)
      )
    }
  }

  function deletePackage(jobId, roomId, pkgId) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? recomputeJob({
              ...j,
              rooms: j.rooms.map((r) =>
                r.id === roomId
                  ? { ...r, packages: r.packages.filter((p) => p.id !== pkgId) }
                  : r
              ),
            })
          : j
      )
    )
    if (hasSupabase && orgId && !pkgId.startsWith('pkg-')) {
      repo.deleteRoomPackage(pkgId).catch((err) =>
        // eslint-disable-next-line no-console
        console.warn('[JobsContext] deletePackage DB-write fejlede:', err.message)
      )
    }
  }

  function addPackagePhoto(jobId, roomId, pkgId, photo) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              rooms: j.rooms.map((r) =>
                r.id === roomId
                  ? {
                      ...r,
                      packages: r.packages.map((p) =>
                        p.id === pkgId
                          ? { ...p, photos: [...(p.photos || []), photo] }
                          : p
                      ),
                    }
                  : r
              ),
            }
          : j
      )
    )
  }

  function removePackagePhoto(jobId, roomId, pkgId, photoId) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              rooms: j.rooms.map((r) =>
                r.id === roomId
                  ? {
                      ...r,
                      packages: r.packages.map((p) =>
                        p.id === pkgId
                          ? { ...p, photos: (p.photos || []).filter((ph) => ph.id !== photoId) }
                          : p
                      ),
                    }
                  : r
              ),
            }
          : j
      )
    )
  }

  // ============================================
  // PACKAGE ITEMS
  // ============================================
  function addItemToPackage(jobId, roomId, pkgId, { item, quantity = 1 }) {
    const pi = {
      id: uid('pi'),
      item_id: item.id,
      name_snapshot: item.name,
      quantity: Number(quantity) || 1,
      unit_price: Number(item.sales_price) || 0,
      customer_selected: true,
    }
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? recomputeJob({
              ...j,
              rooms: j.rooms.map((r) =>
                r.id === roomId
                  ? {
                      ...r,
                      packages: r.packages.map((p) =>
                        p.id === pkgId ? { ...p, items: [...p.items, pi] } : p
                      ),
                    }
                  : r
              ),
            })
          : j
      )
    )

    if (hasSupabase && orgId && !pkgId.startsWith('pkg-')) {
      repo
        .createPackageItem({
          roomPackageId: pkgId,
          orgId,
          itemId: item.id,
          nameSnapshot: item.name,
          quantity: pi.quantity,
          unitPrice: pi.unit_price,
          addedBy: 'montor',
        })
        .then(() => refresh())
        .catch((err) =>
          // eslint-disable-next-line no-console
          console.warn('[JobsContext] addItemToPackage DB-write fejlede:', err.message)
        )
    }
    return pi
  }

  function updatePackageItem(jobId, roomId, pkgId, itemId, patch) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? recomputeJob({
              ...j,
              rooms: j.rooms.map((r) =>
                r.id === roomId
                  ? {
                      ...r,
                      packages: r.packages.map((p) =>
                        p.id === pkgId
                          ? {
                              ...p,
                              items: p.items.map((it) =>
                                it.id === itemId ? { ...it, ...patch } : it
                              ),
                            }
                          : p
                      ),
                    }
                  : r
              ),
            })
          : j
      )
    )
    if (hasSupabase && orgId && !itemId.startsWith('pi-')) {
      repo.updatePackageItem(itemId, patch).catch((err) =>
        // eslint-disable-next-line no-console
        console.warn('[JobsContext] updatePackageItem DB-write fejlede:', err.message)
      )
    }
  }

  function removePackageItem(jobId, roomId, pkgId, itemId) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? recomputeJob({
              ...j,
              rooms: j.rooms.map((r) =>
                r.id === roomId
                  ? {
                      ...r,
                      packages: r.packages.map((p) =>
                        p.id === pkgId
                          ? { ...p, items: p.items.filter((it) => it.id !== itemId) }
                          : p
                      ),
                    }
                  : r
              ),
            })
          : j
      )
    )
    if (hasSupabase && orgId && !itemId.startsWith('pi-')) {
      repo.deletePackageItem(itemId).catch((err) =>
        // eslint-disable-next-line no-console
        console.warn('[JobsContext] removePackageItem DB-write fejlede:', err.message)
      )
    }
  }

  // ============================================
  // ITEMS (varedatabase)
  // ============================================
  function searchItems(query) {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        (it.sku || '').toLowerCase().includes(q) ||
        (it.category || '').toLowerCase().includes(q)
    )
  }

  function createItem({ name, sku, category, unit, sales_price }) {
    const localItem = {
      id: uid('i'),
      sku: sku?.trim() || null,
      name: name.trim(),
      category: category || 'andet',
      unit: unit || 'stk',
      sales_price: Number(sales_price) || 0,
      supplier: 'manual',
    }
    setItems((prev) => [localItem, ...prev])

    if (hasSupabase && orgId) {
      repo
        .createItem({
          orgId,
          name,
          sku,
          category,
          unit,
          salesPrice: Number(sales_price) || 0,
          createdBy: dbUserId,
        })
        .then((dbItem) => {
          // Replace optimistic item with DB-version
          setItems((prev) => [dbItem, ...prev.filter((i) => i.id !== localItem.id)])
        })
        .catch((err) =>
          // eslint-disable-next-line no-console
          console.warn('[JobsContext] createItem DB-write fejlede:', err.message)
        )
    }
    return localItem
  }

  function updateItem(itemId, patch) {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...patch } : it)))
    if (hasSupabase && orgId && !itemId.startsWith('i-')) {
      repo.updateItem(itemId, patch).catch((err) =>
        // eslint-disable-next-line no-console
        console.warn('[JobsContext] updateItem DB-write fejlede:', err.message)
      )
    }
  }

  function deleteItem(itemId) {
    setItems((prev) => prev.filter((it) => it.id !== itemId))
    if (hasSupabase && orgId && !itemId.startsWith('i-')) {
      repo.deleteItem(itemId).catch((err) =>
        // eslint-disable-next-line no-console
        console.warn('[JobsContext] deleteItem DB-write fejlede:', err.message)
      )
    }
  }

  function importItemsCSV(rows) {
    const created = rows
      .filter((r) => r.name?.trim())
      .map((r) => ({
        id: uid('i'),
        sku: r.sku?.trim() || null,
        name: r.name.trim(),
        category: (r.category || 'andet').trim(),
        unit: (r.unit || 'stk').trim(),
        sales_price: Number(r.sales_price) || 0,
        supplier: 'manual',
      }))
    setItems((prev) => [...created, ...prev])

    if (hasSupabase && orgId) {
      Promise.all(
        created.map((it) =>
          repo.createItem({
            orgId,
            name: it.name,
            sku: it.sku,
            category: it.category,
            unit: it.unit,
            salesPrice: it.sales_price,
            createdBy: dbUserId,
          })
        )
      )
        .then(() => refresh())
        .catch((err) =>
          // eslint-disable-next-line no-console
          console.warn('[JobsContext] importItemsCSV fejlede:', err.message)
        )
    }
    return created
  }

  // ============================================
  // TEMPLATES
  // ============================================
  function createTemplate(data) {
    const tpl = {
      id: uid('t'),
      name: data.name.trim(),
      category: data.category || 'misc',
      lucide_icon: data.lucide_icon || 'Package',
      pricing_model: data.pricing_model || 'fixed',
      base_price: Number(data.base_price) || 0,
      base_hours: Number(data.base_hours) || 0,
      hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : null,
      active: true,
    }
    setTemplates((prev) => [tpl, ...prev])
    return tpl
  }

  function updateTemplate(templateId, patch) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, ...patch } : t))
    )
  }

  function deleteTemplate(templateId) {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId))
  }

  function toggleTemplateActive(templateId) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, active: !t.active } : t))
    )
  }

  // ============================================
  // CUSTOMER ACTIONS
  // ============================================
  function logAction(jobId, action) {
    const entry = {
      id: uid('act'),
      created_at: new Date().toISOString(),
      ...action,
    }
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, actions: [...(j.actions || []), entry] } : j
      )
    )
    return entry
  }

  function persistAction(jobId, action) {
    if (!hasSupabase || !orgId || jobId.startsWith('job-')) return
    repo
      .logCustomerAction({
        jobId,
        orgId,
        actionType: action.action_type,
        message: action.message,
        customerName: action.actor_name,
        customerEmail: action.customer_email,
        roomPackageId: action.room_package_id,
        packageItemId: action.package_item_id,
      })
      .catch((err) =>
        // eslint-disable-next-line no-console
        console.warn('[JobsContext] persistAction fejlede:', err.message)
      )
  }

  function getJobByShareToken(token) {
    return jobs.find((j) => j.share_token === token)
  }

  function toggleItemSelected(jobId, roomId, pkgId, itemId, selected, customerMeta = {}) {
    updatePackageItem(jobId, roomId, pkgId, itemId, { customer_selected: selected })
    const pkg = getPackage(jobId, roomId, pkgId)
    const it = pkg?.items.find((i) => i.id === itemId)
    const action = {
      action_type: 'toggle_item',
      actor_type: 'customer',
      actor_name: customerMeta.name || 'Kunde',
      room_package_id: pkgId,
      package_item_id: itemId,
      message: `${selected ? 'Tilvalgte' : 'Fravalgte'} ${it?.name_snapshot || 'vare'}`,
    }
    logAction(jobId, action)
    persistAction(jobId, action)
  }

  function addComment(jobId, { roomPackageId = null, message, customerName, customerEmail }) {
    const action = {
      action_type: 'comment',
      actor_type: 'customer',
      actor_name: customerName || 'Kunde',
      customer_email: customerEmail,
      room_package_id: roomPackageId,
      message,
    }
    logAction(jobId, action)
    persistAction(jobId, action)
  }

  function approvePackage(jobId, roomId, pkgId, customerName = 'Kunde') {
    updatePackage(jobId, roomId, pkgId, { status: 'approved_by_customer' })
    const pkg = getPackage(jobId, roomId, pkgId)
    const action = {
      action_type: 'approve',
      actor_type: 'customer',
      actor_name: customerName,
      room_package_id: pkgId,
      message: `Godkendte ${pkg?.name || 'pakke'}`,
    }
    logAction(jobId, action)
    persistAction(jobId, action)
  }

  function rejectPackage(jobId, roomId, pkgId, { customerName = 'Kunde', reason = '' } = {}) {
    updatePackage(jobId, roomId, pkgId, { status: 'rejected_by_customer' })
    const pkg = getPackage(jobId, roomId, pkgId)
    const action = {
      action_type: 'reject',
      actor_type: 'customer',
      actor_name: customerName,
      room_package_id: pkgId,
      message: `Afviste ${pkg?.name || 'pakke'}${reason ? `: ${reason}` : ''}`,
    }
    logAction(jobId, action)
    persistAction(jobId, action)
  }

  function signOffer(jobId, { customerName, customerEmail, signature = null }) {
    updateJob(jobId, {
      status: 'approved',
      signed_at: new Date().toISOString(),
      signed_by: customerName,
      signature,
    })
    const action = {
      action_type: 'sign_offer',
      actor_type: 'customer',
      actor_name: customerName,
      customer_email: customerEmail,
      message: 'Underskrev og godkendte samlet tilbud',
    }
    logAction(jobId, action)
    persistAction(jobId, action)
  }

  function rejectOffer(jobId, { customerName, customerEmail, reason = '' }) {
    updateJob(jobId, { status: 'rejected' })
    const action = {
      action_type: 'reject',
      actor_type: 'customer',
      actor_name: customerName,
      customer_email: customerEmail,
      message: `Afviste samlet tilbud${reason ? `: ${reason}` : ''}`,
    }
    logAction(jobId, action)
    persistAction(jobId, action)
  }

  function getJob(jobId) {
    return jobs.find((j) => j.id === jobId)
  }

  function getRoom(jobId, roomId) {
    return getJob(jobId)?.rooms.find((r) => r.id === roomId)
  }

  function getPackage(jobId, roomId, pkgId) {
    return getRoom(jobId, roomId)?.packages.find((p) => p.id === pkgId)
  }

  const value = useMemo(
    () => ({
      jobs,
      items,
      templates,
      dbLoading,
      supabaseMode: supabaseModeRef.current,
      refresh,
      addJob,
      updateJob,
      addRoom,
      updateRoom,
      deleteRoom,
      addDrawingLine,
      clearDrawing,
      undoDrawing,
      addPackage,
      updatePackage,
      deletePackage,
      addPackagePhoto,
      removePackagePhoto,
      addItemToPackage,
      updatePackageItem,
      removePackageItem,
      searchItems,
      createItem,
      updateItem,
      deleteItem,
      importItemsCSV,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      toggleTemplateActive,
      getJob,
      getRoom,
      getPackage,
      getJobByShareToken,
      toggleItemSelected,
      addComment,
      approvePackage,
      rejectPackage,
      signOffer,
      rejectOffer,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jobs, items, templates, roomTemplates, dbLoading, orgId, dbUserId]
  )

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>
}

export function useJobs() {
  const ctx = useContext(JobsContext)
  if (!ctx) throw new Error('useJobs skal bruges indenfor <JobsProvider>')
  return ctx
}

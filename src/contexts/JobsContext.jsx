import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { MOCK_JOBS } from '../lib/mockJobs.js'
import { INITIAL_ITEMS } from '../lib/mockItems.js'
import { PACKAGE_TEMPLATES } from '../lib/mockTemplates.js'
import { jobTotal } from '../lib/pricing.js'

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

// Seed jobs med et par eksempler der allerede har rum/pakker, så Dashboard
// viser realistiske priser.
function seedJobs() {
  const base = MOCK_JOBS.map((j) => ({ ...j, rooms: [], actions: [] }))

  // JOB-2026-0001: badeværelse med 3 pakker
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
        {
          id: uid('pkg'),
          template_id: 't-bath-05',
          name: 'Håndvask enkelt',
          lucide_icon: 'Droplet',
          position_x: 0.5,
          position_y: 0.75,
          pricing_model: 'fixed',
          fixed_price: 1800,
          hours: 1.5,
          hourly_rate: null,
          notes: '',
          timeline_text: '',
          status: 'draft',
          items: [
            { id: uid('pi'), item_id: 'i-004', name_snapshot: 'Håndvask Ifö Caruso 55cm', quantity: 1, unit_price: 1690, customer_selected: true },
            { id: uid('pi'), item_id: 'i-006', name_snapshot: 'Blandingsbatteri Grohe Eurosmart', quantity: 1, unit_price: 1290, customer_selected: true },
          ],
        },
      ],
    },
  ]

  // JOB-2026-0003: varmtvandsbeholder
  base[2].rooms = [
    {
      id: uid('room'),
      name: 'Teknikrum kælder',
      room_type: 'technical',
      width_cm: 200,
      length_cm: 180,
      floorplan_mode: 'rectangle',
      packages: [
        {
          id: uid('pkg'),
          template_id: 't-tech-01',
          name: 'Varmtvandsbeholder',
          lucide_icon: 'Container',
          position_x: 0.5,
          position_y: 0.5,
          pricing_model: 'package_plus',
          fixed_price: 8800,
          hours: 6,
          hourly_rate: null,
          notes: 'Aftalt tid til 160L beholder.',
          timeline_text: '1 dags arbejde',
          status: 'draft',
          items: [
            { id: uid('pi'), item_id: 'i-015', name_snapshot: 'Varmtvandsbeholder 160L Metro', quantity: 1, unit_price: 5890, customer_selected: true },
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
  const [jobs, setJobs] = useState(() => seedJobs())
  const [items, setItems] = useState(INITIAL_ITEMS)

  const recomputeJob = useCallback((job) => ({
    ...job,
    total_price_excl_vat: jobTotal(job),
    rooms_count: job.rooms?.length || 0,
    updated_at: new Date().toISOString(),
  }), [])

  function addJob({ title, customer, vatHandling }) {
    let created
    setJobs((prev) => {
      const id = uid('job')
      const newJob = recomputeJob({
        id,
        job_number: nextJobNumber(prev),
        title: title.trim(),
        customer: {
          name: customer.name.trim(),
          address: customer.address.trim(),
          customer_type: customer.customer_type,
        },
        status: 'draft',
        vat_handling: vatHandling,
        rooms: [],
        actions: [],
        share_token: genShareToken(),
        assigned_to: 'Mikkel Montør',
      })
      created = newJob
      return [newJob, ...prev]
    })
    return created
  }

  // ============================================
  // Kunde-aktioner: kommentarer, godkend/afvis,
  // toggle items. Logger ind i job.actions.
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

  function getJobByShareToken(token) {
    return jobs.find((j) => j.share_token === token)
  }

  function toggleItemSelected(jobId, roomId, pkgId, itemId, selected, customerMeta = {}) {
    updatePackageItem(jobId, roomId, pkgId, itemId, { customer_selected: selected })
    const pkg = getPackage(jobId, roomId, pkgId)
    const it = pkg?.items.find((i) => i.id === itemId)
    logAction(jobId, {
      action_type: 'toggle_item',
      actor_type: 'customer',
      actor_name: customerMeta.name || 'Kunde',
      room_package_id: pkgId,
      package_item_id: itemId,
      message: `${selected ? 'Tilvalgte' : 'Fravalgte'} ${it?.name_snapshot || 'vare'}`,
    })
  }

  function addComment(jobId, { roomPackageId = null, message, customerName, customerEmail }) {
    logAction(jobId, {
      action_type: 'comment',
      actor_type: 'customer',
      actor_name: customerName || 'Kunde',
      customer_email: customerEmail,
      room_package_id: roomPackageId,
      message,
    })
  }

  function approvePackage(jobId, roomId, pkgId, customerName = 'Kunde') {
    updatePackage(jobId, roomId, pkgId, { status: 'approved_by_customer' })
    const pkg = getPackage(jobId, roomId, pkgId)
    logAction(jobId, {
      action_type: 'approve',
      actor_type: 'customer',
      actor_name: customerName,
      room_package_id: pkgId,
      message: `Godkendte ${pkg?.name || 'pakke'}`,
    })
  }

  function rejectPackage(jobId, roomId, pkgId, { customerName = 'Kunde', reason = '' } = {}) {
    updatePackage(jobId, roomId, pkgId, { status: 'rejected_by_customer' })
    const pkg = getPackage(jobId, roomId, pkgId)
    logAction(jobId, {
      action_type: 'reject',
      actor_type: 'customer',
      actor_name: customerName,
      room_package_id: pkgId,
      message: `Afviste ${pkg?.name || 'pakke'}${reason ? `: ${reason}` : ''}`,
    })
  }

  function signOffer(jobId, { customerName, customerEmail }) {
    updateJob(jobId, { status: 'approved', signed_at: new Date().toISOString(), signed_by: customerName })
    logAction(jobId, {
      action_type: 'sign_offer',
      actor_type: 'customer',
      actor_name: customerName,
      customer_email: customerEmail,
      message: 'Underskrev og godkendte samlet tilbud',
    })
  }

  function rejectOffer(jobId, { customerName, customerEmail, reason = '' }) {
    updateJob(jobId, { status: 'rejected' })
    logAction(jobId, {
      action_type: 'reject',
      actor_type: 'customer',
      actor_name: customerName,
      customer_email: customerEmail,
      message: `Afviste samlet tilbud${reason ? `: ${reason}` : ''}`,
    })
  }

  function updateJob(jobId, patch) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? recomputeJob({ ...j, ...patch }) : j))
    )
  }

  function addRoom(jobId, {
    name,
    room_type,
    width_cm,
    length_cm,
    floorplan_mode = 'rectangle',
    suggested_templates = [],
  }) {
    // Opret foreslåede pakker spredt ud over canvas-arealet
    const packages = suggested_templates
      .map((tid) => PACKAGE_TEMPLATES.find((t) => t.id === tid))
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
    return room
  }

  function addDrawingLine(jobId, roomId, points) {
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
                        lines: [...(r.floorplan_data?.lines || []), { id: uid('ln'), points }],
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
  }

  function deleteRoom(jobId, roomId) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? recomputeJob({ ...j, rooms: j.rooms.filter((r) => r.id !== roomId) })
          : j
      )
    )
  }

  function addPackage(jobId, roomId, template, position) {
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
  }

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
  }

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
    const newItem = {
      id: uid('i'),
      sku: sku?.trim() || null,
      name: name.trim(),
      category: category || 'andet',
      unit: unit || 'stk',
      sales_price: Number(sales_price) || 0,
      supplier: 'manual',
    }
    setItems((prev) => [newItem, ...prev])
    return newItem
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
      addItemToPackage,
      updatePackageItem,
      removePackageItem,
      searchItems,
      createItem,
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
    [jobs, items]
  )

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>
}

export function useJobs() {
  const ctx = useContext(JobsContext)
  if (!ctx) throw new Error('useJobs skal bruges indenfor <JobsProvider>')
  return ctx
}

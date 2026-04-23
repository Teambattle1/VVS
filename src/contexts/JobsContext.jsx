import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { MOCK_JOBS } from '../lib/mockJobs.js'
import { INITIAL_ITEMS } from '../lib/mockItems.js'
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

// Seed jobs med et par eksempler der allerede har rum/pakker, så Dashboard
// viser realistiske priser.
function seedJobs() {
  const base = MOCK_JOBS.map((j) => ({ ...j, rooms: [] }))

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
        assigned_to: 'Mikkel Montør',
      })
      created = newJob
      return [newJob, ...prev]
    })
    return created
  }

  function updateJob(jobId, patch) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? recomputeJob({ ...j, ...patch }) : j))
    )
  }

  function addRoom(jobId, { name, room_type, width_cm, length_cm }) {
    const room = {
      id: uid('room'),
      name: name.trim(),
      room_type,
      width_cm: Number(width_cm) || 300,
      length_cm: Number(length_cm) || 300,
      floorplan_mode: 'rectangle',
      packages: [],
    }
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? recomputeJob({ ...j, rooms: [...j.rooms, room] }) : j
      )
    )
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

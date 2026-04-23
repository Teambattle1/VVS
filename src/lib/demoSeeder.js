// Bulk demo-data generator: opret 4 komplette sager med kunder,
// rum og pakker i den nuvaerende org. Alle markeret '[DEMO]' saa
// de kan fjernes bulk via sletning af jobs + kunder.

import { supabase } from './supabase.js'
import * as repo from './jobsRepo.js'

const DEMO_PREFIX = '[DEMO] '

const DEMO_JOBS = [
  {
    title: DEMO_PREFIX + 'Renovering af badeværelse',
    customer: {
      name: 'Familien Hansen',
      email: 'hansen@example.dk',
      phone: '+45 20 11 22 33',
      address: 'Vestergade 12',
      zip: '2100',
      city: 'København Ø',
      customer_type: 'private',
    },
    vatHandling: 'incl',
    rooms: [
      {
        name: 'Badeværelse 1. sal',
        room_type: 'bathroom',
        width_cm: 260,
        length_cm: 340,
        packages: [
          { name: 'Toilet m/ skjult cisterne', lucide_icon: 'Toilet', pricing_model: 'fixed', fixed_price: 6800, hours: 5, position_x: 0.25, position_y: 0.25, color: '#0EA5E9', shape: 'rounded', size: 'md' },
          { name: 'Bad / brusekabine',          lucide_icon: 'ShowerHead', pricing_model: 'package_plus', fixed_price: 4500, hours: 4, position_x: 0.7, position_y: 0.3, color: '#059669', shape: 'circle', size: 'md' },
          { name: 'Håndvask enkelt',            lucide_icon: 'Sink', pricing_model: 'fixed', fixed_price: 1800, hours: 1.5, position_x: 0.5, position_y: 0.75, color: '#7C3AED', shape: 'circle', size: 'md' },
        ],
      },
    ],
  },
  {
    title: DEMO_PREFIX + 'Nyt køkken + bryggers',
    customer: {
      name: 'Café Linde ApS',
      email: 'info@cafelinde.dk',
      phone: '+45 70 80 90 00',
      address: 'Havnegade 3',
      zip: '1058',
      city: 'København K',
      customer_type: 'business',
    },
    vatHandling: 'excl',
    rooms: [
      {
        name: 'Køkken',
        room_type: 'kitchen',
        width_cm: 320,
        length_cm: 400,
        packages: [
          { name: 'Køkkenvask dobbelt',           lucide_icon: 'Utensils', pricing_model: 'fixed', fixed_price: 2600, hours: 2.5, position_x: 0.3, position_y: 0.5, color: '#E11D48', shape: 'rounded', size: 'md' },
          { name: 'Opvaskemaskine tilslutning',    lucide_icon: 'Refrigerator', pricing_model: 'fixed', fixed_price: 1200, hours: 1, position_x: 0.6, position_y: 0.3, color: '#F59E0B', shape: 'square', size: 'md' },
        ],
      },
      {
        name: 'Bryggers',
        room_type: 'utility',
        width_cm: 200,
        length_cm: 240,
        packages: [
          { name: 'Vaskemaskine tilslutning', lucide_icon: 'WashingMachine', pricing_model: 'fixed', fixed_price: 1100, hours: 1, position_x: 0.4, position_y: 0.5, color: '#0EA5E9', shape: 'circle', size: 'md' },
        ],
      },
    ],
  },
  {
    title: DEMO_PREFIX + 'Varmtvandsbeholder 200L',
    customer: {
      name: 'Jens Petersen',
      email: 'jens@example.dk',
      phone: '+45 22 33 44 55',
      address: 'Skovvej 48',
      zip: '2860',
      city: 'Søborg',
      customer_type: 'private',
    },
    vatHandling: 'incl',
    rooms: [
      {
        name: 'Teknikrum kælder',
        room_type: 'technical',
        width_cm: 200,
        length_cm: 180,
        packages: [
          { name: 'Varmtvandsbeholder 200L', lucide_icon: 'WaterHeater', pricing_model: 'package_plus', fixed_price: 11500, hours: 7, position_x: 0.5, position_y: 0.5, color: '#E11D48', shape: 'rounded', size: 'lg' },
        ],
      },
    ],
  },
  {
    title: DEMO_PREFIX + 'Udendørs vandhane + afløb',
    customer: {
      name: 'Haveforeningen Solgården',
      email: 'info@solgaarden.dk',
      phone: '+45 40 50 60 70',
      address: 'Strandvejen 100',
      zip: '8240',
      city: 'Risskov',
      customer_type: 'business',
    },
    vatHandling: 'excl',
    rooms: [
      {
        name: 'Udendørsområde',
        room_type: 'outdoor',
        width_cm: 500,
        length_cm: 400,
        packages: [
          { name: 'Udendørs vandhane',     lucide_icon: 'Faucet', pricing_model: 'fixed', fixed_price: 2200, hours: 2, position_x: 0.25, position_y: 0.4, color: '#0EA5E9', shape: 'circle', size: 'md' },
          { name: 'Nedløbsrør tilkobling', lucide_icon: 'CloudRain', pricing_model: 'hourly', fixed_price: 0, hours: 2, hourly_rate: 695, position_x: 0.75, position_y: 0.6, color: '#059669', shape: 'diamond', size: 'md' },
        ],
      },
    ],
  },
]

export async function seedDemoData({ orgId, dbUserId }) {
  if (!orgId) throw new Error('Ingen organisation valgt')
  const created = { customers: 0, jobs: 0, rooms: 0, packages: 0 }

  for (const j of DEMO_JOBS) {
    const customer = await repo.createCustomer({
      orgId,
      name: DEMO_PREFIX + j.customer.name,
      email: j.customer.email,
      phone: j.customer.phone,
      address: j.customer.address,
      zip: j.customer.zip,
      city: j.customer.city,
      customerType: j.customer.customer_type,
      defaultVatHandling: j.vatHandling,
    })
    created.customers++

    const job = await repo.createJob({
      orgId,
      title: j.title,
      customerId: customer.id,
      vatHandling: j.vatHandling,
      assignedTo: dbUserId,
      createdBy: dbUserId,
    })
    created.jobs++

    for (const r of j.rooms) {
      const room = await repo.createRoom({
        jobId: job.id,
        orgId,
        name: r.name,
        roomType: r.room_type,
        widthCm: r.width_cm,
        lengthCm: r.length_cm,
        floorplanMode: 'rectangle',
      })
      created.rooms++

      for (const p of r.packages) {
        await repo.createRoomPackage({
          roomId: room.id,
          orgId,
          templateId: null,
          name: p.name,
          lucideIcon: p.lucide_icon,
          positionX: p.position_x,
          positionY: p.position_y,
          pricingModel: p.pricing_model,
          fixedPrice: p.fixed_price || 0,
          hours: p.hours || 0,
          hourlyRate: p.hourly_rate,
        })
        // Extra fields (color/shape/size) via direkte update
        const { data: pkgs } = await supabase
          .from('vvs_room_packages')
          .select('id')
          .eq('room_id', room.id)
          .eq('name', p.name)
          .limit(1)
        if (pkgs?.[0]?.id) {
          await supabase
            .from('vvs_room_packages')
            .update({ color: p.color, shape: p.shape, size: p.size })
            .eq('id', pkgs[0].id)
        }
        created.packages++
      }
    }
  }
  return created
}

export async function removeDemoData({ orgId }) {
  if (!orgId) throw new Error('Ingen organisation valgt')
  const { data: demoJobs } = await supabase
    .from('vvs_jobs')
    .select('id')
    .eq('organization_id', orgId)
    .like('title', DEMO_PREFIX + '%')
  const jobIds = (demoJobs || []).map((j) => j.id)

  const { data: demoCustomers } = await supabase
    .from('vvs_customers')
    .select('id')
    .eq('organization_id', orgId)
    .like('name', DEMO_PREFIX + '%')
  const customerIds = (demoCustomers || []).map((c) => c.id)

  if (jobIds.length > 0) {
    await supabase.from('vvs_jobs').delete().in('id', jobIds)
  }
  if (customerIds.length > 0) {
    await supabase.from('vvs_customers').delete().in('id', customerIds)
  }
  return { jobs: jobIds.length, customers: customerIds.length }
}

export { DEMO_PREFIX }

import { createContext, useContext, useMemo, useState } from 'react'
import { MOCK_JOBS } from '../lib/mockJobs.js'

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

export function JobsProvider({ children }) {
  const [jobs, setJobs] = useState(MOCK_JOBS)

  function addJob({ title, customer, vatHandling }) {
    const id = `job-${Date.now()}`
    const newJob = {
      id,
      job_number: nextJobNumber(jobs),
      title: title.trim(),
      customer: {
        name: customer.name.trim(),
        address: customer.address.trim(),
        customer_type: customer.customer_type,
      },
      status: 'draft',
      vat_handling: vatHandling,
      total_price_excl_vat: 0,
      rooms_count: 0,
      assigned_to: 'Mikkel Montør',
      updated_at: new Date().toISOString(),
    }
    setJobs((prev) => [newJob, ...prev])
    return newJob
  }

  const value = useMemo(() => ({ jobs, addJob }), [jobs])
  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>
}

export function useJobs() {
  const ctx = useContext(JobsContext)
  if (!ctx) throw new Error('useJobs skal bruges indenfor <JobsProvider>')
  return ctx
}

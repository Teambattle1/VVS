import { useEffect } from 'react'
import { hasSupabase, supabase } from '../lib/supabase.js'

// ============================================
// useRealtime - subscriber til Supabase Realtime.
// Graceful fallback: ingen effekt når Supabase ikke er konfigureret.
//
// Brug:
//   useRealtime('vvs_room_packages', { filter: `room_id=eq.${roomId}` }, (payload) => { ... })
// ============================================
export function useRealtime(tableName, options, handler) {
  useEffect(() => {
    if (!hasSupabase || !tableName || !handler) return

    const channel = supabase
      .channel(`rt-${tableName}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        {
          event: options?.event || '*',
          schema: 'public',
          table: tableName,
          filter: options?.filter,
        },
        (payload) => handler(payload)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableName, options?.event, options?.filter, handler])
}

// ============================================
// useJobRealtime - abonnerer på alle tabeller relevante for ét job
// ============================================
export function useJobRealtime(jobId, handler) {
  useRealtime('vvs_room_packages', { filter: `job_id=eq.${jobId}` }, handler)
  useRealtime('vvs_package_items', { filter: `job_id=eq.${jobId}` }, handler)
  useRealtime('vvs_customer_actions', { filter: `job_id=eq.${jobId}` }, handler)
  useRealtime('vvs_activity_log', { filter: `job_id=eq.${jobId}` }, handler)
}

import { supabase, hasSupabase } from './supabase.js'

export async function signInWithPassword({ email, password }) {
  if (!hasSupabase) throw new Error('Supabase er ikke konfigureret endnu.')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!hasSupabase) return
  await supabase.auth.signOut()
}

export async function getSession() {
  if (!hasSupabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

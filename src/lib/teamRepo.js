// Team-persistence mod vvs_users i Supabase
// Demo-brugere (uden auth.users-account) gemmes med user_id=NULL + demo_password.

import { supabase } from './supabase.js'

export async function loadTeam(orgId) {
  const { data, error } = await supabase
    .from('vvs_users')
    .select('id, user_id, name, email, phone, role, active, demo_password')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(mapRow)
}

export async function createTeamMember({ orgId, name, email, phone, role, password, active = true }) {
  const { data, error } = await supabase
    .from('vvs_users')
    .insert({
      organization_id: orgId,
      user_id: null,
      name: name?.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      role: role || 'montor',
      active,
      demo_password: (password && password.trim()) || '1234',
    })
    .select('id, user_id, name, email, phone, role, active, demo_password')
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function updateTeamMemberDb(userId, patch) {
  const dbPatch = {}
  if ('name' in patch) dbPatch.name = patch.name?.trim()
  if ('email' in patch) dbPatch.email = patch.email?.trim() || null
  if ('phone' in patch) dbPatch.phone = patch.phone?.trim() || null
  if ('role' in patch) dbPatch.role = patch.role
  if ('active' in patch) dbPatch.active = patch.active
  if ('password' in patch) dbPatch.demo_password = patch.password?.trim() || '1234'

  const { data, error } = await supabase
    .from('vvs_users')
    .update(dbPatch)
    .eq('id', userId)
    .select('id, user_id, name, email, phone, role, active, demo_password')
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function deleteTeamMember(userId) {
  const { error } = await supabase.from('vvs_users').delete().eq('id', userId)
  if (error) throw error
}

// Slaa email/password op i den offentlige login-view (til fallback-login)
export async function findLoginCandidate(email) {
  const { data, error } = await supabase
    .from('vvs_login_candidates')
    .select('id, organization_id, name, role, email, demo_password')
    .ilike('email', email.trim())
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data || null
}

function mapRow(row) {
  return {
    id: row.id,
    user_id: row.user_id || null,
    name: row.name,
    email: row.email || '',
    phone: row.phone || '',
    role: row.role,
    active: row.active !== false,
    password: row.demo_password || '1234',
  }
}

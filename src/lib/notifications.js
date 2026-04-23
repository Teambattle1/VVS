// ============================================
// Notifications service-lag
//
// Scaffold der forventer Supabase edge functions:
//   - ef-send-email (Resend)      - live i EVENTDAY Supabase-projekt
//   - ef-send-sms   (CPSMS)       - planlagt
//
// Når VITE_SUPABASE_URL er sat, kaldes edge function.
// Uden Supabase logges events til console så flowet kan ses i dev.
// ============================================

import { hasSupabase, supabase } from './supabase.js'

const ENABLED = hasSupabase

// Husk hvilke edge functions der er utilgaengelige, saa vi ikke spammer
// brugerens netvaerk/console med samme 404/CORS-preflight-fejl hver gang.
const unavailable = new Set()

async function callEdgeFunction(name, payload) {
  if (!ENABLED) {
    // Mock-mode: log hvad der ville blive sendt
    // eslint-disable-next-line no-console
    console.info(`[notifications] MOCK ${name}`, payload)
    return { ok: true, mocked: true }
  }
  if (unavailable.has(name)) {
    return { ok: false, skipped: true, reason: 'edge-function-unavailable' }
  }
  try {
    const { data, error } = await supabase.functions.invoke(name, { body: payload })
    if (error) throw error
    return { ok: true, data }
  } catch (err) {
    const msg = String(err?.message || err)
    const isNetworkOrMissing =
      /Failed to send a request/i.test(msg) ||
      /Failed to fetch/i.test(msg) ||
      /CORS/i.test(msg) ||
      /NetworkError/i.test(msg) ||
      err?.status === 404 ||
      err?.status === 405
    if (isNetworkOrMissing) {
      unavailable.add(name)
      // eslint-disable-next-line no-console
      console.info(
        `[notifications] ${name} er ikke deployet endnu — marker-stille-igen. Handling lykkedes, email/SMS blev sprunget over.`
      )
    } else {
      // eslint-disable-next-line no-console
      console.warn(`[notifications] ${name} failed`, msg)
    }
    return { ok: false, error: msg }
  }
}

// ============================================
// Email (Resend via ef-send-email)
// ============================================
export function sendEmail({ to, subject, html, text, from = 'VVS FLOW <tilbud@vvs.eventday.dk>' }) {
  return callEdgeFunction('ef-send-email', { to, subject, html, text, from })
}

// ============================================
// SMS (CPSMS via ef-send-sms)
// ============================================
export function sendSMS({ to, message, from = 'VVS FLOW' }) {
  return callEdgeFunction('ef-send-sms', { to, message, from })
}

// ============================================
// Højniveau-events. Kaldes fra UI når montør/kunde foretager
// en handling der skal notificere andre.
// ============================================

export function notifyCustomerOfferSent({ job, customer, org, shareUrl }) {
  const subject = `Tilbud ${job.job_number} fra ${org?.name || 'VVS FLOW'}`
  const html = `
    <h2>Dit VVS-tilbud er klar</h2>
    <p>Hej ${customer.name},</p>
    <p>Du har modtaget et tilbud fra ${org?.name || 'VVS FLOW'} vedrørende <strong>${job.title}</strong>.</p>
    <p><a href="${shareUrl}" style="display:inline-block;background:#0EA5E9;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:700">Se tilbuddet</a></p>
    <p>Link: ${shareUrl}</p>
    <p>Venlig hilsen<br>${org?.name || 'VVS FLOW'}</p>
  `
  const promises = []
  if (customer.email) {
    promises.push(sendEmail({ to: customer.email, subject, html }))
  }
  if (customer.phone) {
    promises.push(sendSMS({
      to: customer.phone,
      message: `Du har modtaget et tilbud fra ${org?.name || 'VVS FLOW'}: ${shareUrl}`,
    }))
  }
  return Promise.all(promises)
}

export function notifyMontorCustomerAction({ job, org, assignedEmail, actorName, action, message }) {
  const subject = `${actorName} har ${actionToDanish(action)} på ${job.job_number}`
  const html = `
    <h3>${subject}</h3>
    <p><strong>Sag:</strong> ${job.title}</p>
    <p><strong>Fra:</strong> ${actorName}</p>
    ${message ? `<p><strong>Besked:</strong> ${message}</p>` : ''}
    <p><a href="${window?.location?.origin || ''}/jobs/${job.id}">Se sag i VVS FLOW</a></p>
  `
  return assignedEmail ? sendEmail({ to: assignedEmail, subject, html }) : null
}

export function notifyInviteTeamMember({ email, name, orgName, acceptUrl }) {
  const subject = `Du er inviteret til ${orgName} på VVS FLOW`
  const html = `
    <h2>Velkommen til VVS FLOW</h2>
    <p>Hej ${name},</p>
    <p>${orgName} har inviteret dig til at oprette dine sager og tilbud i VVS FLOW.</p>
    <p><a href="${acceptUrl}" style="display:inline-block;background:#0EA5E9;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:700">Accepter invitation</a></p>
    <p>Link: ${acceptUrl}</p>
  `
  return sendEmail({ to: email, subject, html })
}

export function notifyNewOrgWelcome({ org, adminEmail, onboardingUrl }) {
  const subject = `Velkommen til VVS FLOW — ${org.name}`
  const html = `
    <h2>Tak fordi du valgte VVS FLOW</h2>
    <p>Din organisation <strong>${org.name}</strong> er oprettet.</p>
    <p>Log ind og færdiggør opsætningen:</p>
    <p><a href="${onboardingUrl}" style="display:inline-block;background:#0EA5E9;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:700">Kom i gang</a></p>
  `
  return sendEmail({ to: adminEmail, subject, html })
}

function actionToDanish(action) {
  switch (action) {
    case 'approve':     return 'godkendt'
    case 'reject':      return 'afvist'
    case 'comment':     return 'skrevet en kommentar'
    case 'toggle_item': return 'ændret sine valg'
    case 'sign_offer':  return 'underskrevet tilbuddet'
    default: return 'handlet'
  }
}

export const notificationsEnabled = ENABLED

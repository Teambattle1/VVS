import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { VERSION, compareVersions } from '../lib/version.js'
import { getFeaturesSince } from '../lib/changelog.js'
import ChangelogDialog from './ChangelogDialog.jsx'

const STORAGE_KEY = 'vvs.lastSeenVersion'

// Vises engang pr. bruger naar de logger ind paa en nyere version.
export default function WhatsNewGate() {
  const { user } = useAuth()
  const [newFeatures, setNewFeatures] = useState(null)

  useEffect(() => {
    if (!user) return
    const lastSeen = getLastSeenFor(user.id)
    if (lastSeen && compareVersions(VERSION, lastSeen) <= 0) return

    const features = getFeaturesSince(lastSeen)
    if (features.length === 0) {
      // Allerede set alt - bare opdatér
      setLastSeenFor(user.id, VERSION)
      return
    }
    // Vent lidt saa splash o.l. lukker foerst
    const t = setTimeout(() => setNewFeatures(features), 1500)
    return () => clearTimeout(t)
  }, [user])

  function handleClose() {
    if (user) setLastSeenFor(user.id, VERSION)
    setNewFeatures(null)
  }

  if (!newFeatures) return null
  return (
    <ChangelogDialog
      changelog={newFeatures}
      onlyNew
      onClose={handleClose}
    />
  )
}

function getLastSeenFor(userId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const map = JSON.parse(raw)
    return map[userId] || null
  } catch {
    return null
  }
}

function setLastSeenFor(userId, version) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[userId] = version
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

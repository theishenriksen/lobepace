export function computeThirdValue({ distanceKm, timeSec, paceSecPerKm }) {
  const hasDistance = Number.isFinite(distanceKm) && distanceKm > 0
  const hasTime = Number.isFinite(timeSec) && timeSec > 0
  const hasPace = Number.isFinite(paceSecPerKm) && paceSecPerKm > 0

  const count = [hasDistance, hasTime, hasPace].filter(Boolean).length
  if (count < 2) return { distanceKm, timeSec, paceSecPerKm, computed: null }
  if (count === 3) return { distanceKm, timeSec, paceSecPerKm, computed: null }

  if (!hasPace) {
    const pace = timeSec / distanceKm
    return { distanceKm, timeSec, paceSecPerKm: pace, computed: 'pace' }
  }
  if (!hasTime) {
    const time = distanceKm * paceSecPerKm
    return { distanceKm, timeSec: time, paceSecPerKm, computed: 'time' }
  }
  if (!hasDistance) {
    const distance = timeSec / paceSecPerKm
    return { distanceKm: distance, timeSec, paceSecPerKm, computed: 'distance' }
  }
  return { distanceKm, timeSec, paceSecPerKm, computed: null }
}

export function computeSpeedKmH({ distanceKm, timeSec, paceSecPerKm }) {
  if (Number.isFinite(distanceKm) && distanceKm > 0 && Number.isFinite(timeSec) && timeSec > 0) {
    return (distanceKm / (timeSec / 3600))
  }
  if (Number.isFinite(paceSecPerKm) && paceSecPerKm > 0) {
    return 3600 / paceSecPerKm
  }
  return null
}

export function buildKmSplits(distanceKm, paceSecPerKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0 || !Number.isFinite(paceSecPerKm) || paceSecPerKm <= 0) return []
  const fullKm = Math.floor(distanceKm)
  const splits = []
  for (let k = 1; k <= fullKm; k++) {
    splits.push({ km: k, timeSec: k * paceSecPerKm })
  }
  // Sidste del-km
  const remainder = distanceKm - fullKm
  if (remainder > 0) {
    splits.push({ km: distanceKm, timeSec: distanceKm * paceSecPerKm, isPartial: true })
  }
  return splits
}

export function buildFiveKmSplits(distanceKm, paceSecPerKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0 || !Number.isFinite(paceSecPerKm) || paceSecPerKm <= 0) return []
  const full5 = Math.floor(distanceKm / 5)
  const splits = []
  for (let i = 1; i <= full5; i++) {
    const d = i * 5
    splits.push({ km: d, timeSec: d * paceSecPerKm })
  }
  return splits
}
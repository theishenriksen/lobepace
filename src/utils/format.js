const daNumber = new Intl.NumberFormat('da-DK')
const daNumber2 = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 2 })

export function parseLocaleNumber(str) {
  if (str == null) return null
  const s = String(str).trim()
  if (!s) return null
  // Tillad dansk komma som decimal
  const normalized = s.replace(/\s+/g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

export function formatNumberDa(value, decimals = 2) {
  if (value == null || !Number.isFinite(value)) return ''
  const fmt = new Intl.NumberFormat('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: decimals })
  return fmt.format(value)
}

export function parseTimeToSeconds(str) {
  if (str == null) return null
  const s = String(str).trim()
  if (!s) return null

  // Accepter: hh:mm:ss, mm:ss, m:ss, eller decimal minutter (med , eller .)
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
    const parts = s.split(':').map((p) => Number(p))
    if (parts.length === 2) {
      const [mm, ss] = parts
      if (ss >= 60) return null
      return mm * 60 + ss
    }
    if (parts.length === 3) {
      const [hh, mm, ss] = parts
      if (mm >= 60 || ss >= 60) return null
      return hh * 3600 + mm * 60 + ss
    }
  }
  // Decimal minutter
  const minutes = parseLocaleNumber(s)
  if (minutes != null) return Math.round(minutes * 60)
  return null
}

export function formatSecondsToHMS(totalSeconds) {
  if (totalSeconds == null || !Number.isFinite(totalSeconds)) return ''
  const sec = Math.max(0, Math.round(totalSeconds))
  const hh = Math.floor(sec / 3600)
  const mm = Math.floor((sec % 3600) / 60)
  const ss = sec % 60
  if (hh > 0) return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export function parsePaceToSecondsPerKm(str) {
  if (str == null) return null
  const s = String(str).trim()
  if (!s) return null
  // mm:ss
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const [mm, ss] = s.split(':').map((p) => Number(p))
    if (ss >= 60) return null
    return mm * 60 + ss
  }
  // Decimal minutter pr. km (4,5 => 4:30)
  const minutes = parseLocaleNumber(s)
  if (minutes != null) return Math.round(minutes * 60)
  return null
}

export function formatSecondsPerKmToPace(secPerKm) {
  if (secPerKm == null || !Number.isFinite(secPerKm)) return ''
  const sec = Math.max(0, Math.round(secPerKm))
  const mm = Math.floor(sec / 60)
  const ss = sec % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}
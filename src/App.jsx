import React, { useEffect, useMemo, useState } from 'react'
import InputField from './components/InputField'
import { parseLocaleNumber, parseTimeToSeconds, parsePaceToSecondsPerKm, formatSecondsToHMS, formatSecondsPerKmToPace, formatNumberDa } from './utils/format'
import { computeThirdValue, computeSpeedKmH, buildKmSplits, buildFiveKmSplits } from './utils/calculations'

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch {}
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme])
  return [theme, setTheme]
}

export default function App() {
  const [theme, setTheme] = useTheme()

  const [distanceStr, setDistanceStr] = useState('')
  const [timeStr, setTimeStr] = useState('')
  const [paceStr, setPaceStr] = useState('')

  const distanceKm = useMemo(() => parseLocaleNumber(distanceStr), [distanceStr])
  const timeSec = useMemo(() => parseTimeToSeconds(timeStr), [timeStr])
  const paceSecPerKm = useMemo(() => parsePaceToSecondsPerKm(paceStr), [paceStr])

  const [computedField, setComputedField] = useState(null)

  const values = useMemo(() => computeThirdValue({ distanceKm, timeSec, paceSecPerKm }), [distanceKm, timeSec, paceSecPerKm])

  // Hold inputfelter i sync når et tredje felt kan beregnes
  useEffect(() => {
    if (!values.computed) {
      setComputedField(null)
      return
    }
    setComputedField(values.computed)
    if (values.computed === 'pace') {
      setPaceStr(formatSecondsPerKmToPace(values.paceSecPerKm))
    } else if (values.computed === 'time') {
      setTimeStr(formatSecondsToHMS(values.timeSec))
    } else if (values.computed === 'distance') {
      setDistanceStr(formatNumberDa(values.distanceKm, 2))
    }
  }, [values.computed, values.distanceKm, values.timeSec, values.paceSecPerKm])

  const speedKmH = useMemo(() => computeSpeedKmH(values), [values])
  const kmSplits = useMemo(() => buildKmSplits(values.distanceKm, values.paceSecPerKm), [values.distanceKm, values.paceSecPerKm])
  const fiveKmSplits = useMemo(() => buildFiveKmSplits(values.distanceKm, values.paceSecPerKm), [values.distanceKm, values.paceSecPerKm])

  function resetAll() {
    setDistanceStr('')
    setTimeStr('')
    setPaceStr('')
    setComputedField(null)
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-white to-slate-50 px-4 pb-20 pt-6 dark:from-slate-950 dark:to-slate-950/80 sm:px-6">
      <div className="mx-auto max-w-md">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LøbePace</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Beregn tempo, distance eller tid – indtast to felter, så finder vi det tredje.</p>
          </div>
          <button
            className="btn-secondary h-10 w-10 rounded-full p-0"
            aria-label="Skift tema"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Skift mellem lyst og mørkt tema"
          >
            {theme === 'dark' ? (
              <span>🌙</span>
            ) : (
              <span>☀️</span>
            )}
          </button>
        </header>

        <main className="space-y-6">
          <section className="card p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4">
              <InputField
                id="distance"
                label="Distance"
                placeholder="fx 5, 10 eller 21,1"
                value={distanceStr}
                onChange={setDistanceStr}
                type="text"
                inputMode="decimal"
                suffix="km"
                hint="Angiv distance i kilometer. Brug komma til decimaler (dansk)."
                isComputed={computedField === 'distance'}
              />

              <InputField
                id="time"
                label="Tid"
                placeholder="hh:mm:ss eller mm:ss"
                value={timeStr}
                onChange={setTimeStr}
                type="text"
                inputMode="numeric"
                pattern="^\\d{1,2}:\\d{2}(:\\d{2})?$"
                hint="Indtast tid som hh:mm:ss eller mm:ss. Alternativt tal = minutter."
                isComputed={computedField === 'time'}
              />

              <InputField
                id="pace"
                label="Pace"
                placeholder="mm:ss"
                value={paceStr}
                onChange={setPaceStr}
                type="text"
                inputMode="numeric"
                pattern="^\\d{1,2}:\\d{2}$"
                suffix="min/km"
                hint="Minutter pr. km (fx 4:30). Alternativt tal = minutter (fx 4,5)."
                isComputed={computedField === 'pace'}
              />

              <div className="mt-2 flex gap-3">
                <button className="btn-secondary" onClick={resetAll}>Nulstil</button>
                <a
                  href="#"
                  className="btn-primary"
                  onClick={(e) => e.preventDefault()}
                  title="Del på Strava (kommende funktion)"
                >
                  Del på Strava
                </a>
                <a
                  href="#"
                  className="btn-secondary"
                  onClick={(e) => e.preventDefault()}
                  title="Gem som billede (kommende funktion)"
                >
                  Gem som billede
                </a>
              </div>
            </div>
          </section>

          <section className="card p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Dine resultater</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Metric label="Distance" value={values.distanceKm ? `${formatNumberDa(values.distanceKm, 2)} km` : '—'} />
              <Metric label="Tid" value={values.timeSec ? formatSecondsToHMS(values.timeSec) : '—'} />
              <Metric label="Pace" value={values.paceSecPerKm ? `${formatSecondsPerKmToPace(values.paceSecPerKm)} min/km` : '—'} />
              <Metric label="Hastighed" value={speedKmH ? `${formatNumberDa(speedKmH, 2)} km/t` : '—'} />
            </div>
          </section>

          <section className="card p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Split-tider</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <SplitList title="Hver 1 km" splits={kmSplits} />
              <SplitList title="Hver 5 km" splits={fiveKmSplits} />
            </div>
          </section>
        </main>

        <footer className="mt-8 pb-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Bygget til danske løbere • Lyst/mørkt tema • Ingen tracking
        </footer>
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 text-center dark:border-slate-800">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  )
}

function SplitList({ title, splits }) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">{title}</div>
      {splits && splits.length > 0 ? (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {splits.map((s, idx) => (
            <li key={idx} className="flex items-center justify-between bg-white/60 px-3 py-2 dark:bg-slate-900/40">
              <span className="text-sm text-slate-700 dark:text-slate-200">
                {s.isPartial ? `${formatNumberDa(s.km, 2)} km` : `${s.km} km`}
              </span>
              <span className="text-sm font-semibold">{formatSecondsToHMS(s.timeSec)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Indtast mindst to værdier for at se split-tider.
        </div>
      )}
    </div>
  )
}
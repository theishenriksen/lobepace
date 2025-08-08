import React from 'react'

export default function InputField({ id, label, placeholder, value, onChange, type = 'text', disabled = false, suffix, hint, isComputed = false, inputMode, pattern }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="label">
        {label}
        {isComputed && (
          <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">beregnet</span>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          className={`input pr-16 ${disabled ? 'opacity-75' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          inputMode={inputMode}
          pattern={pattern}
        />
        {suffix && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 dark:text-slate-400">
            <span className="text-sm">{suffix}</span>
          </div>
        )}
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}
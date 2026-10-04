import Icon from './Icon'
import { initials } from '../../utils/format'

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back}
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Field({ label, error, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs text-blush-600">{error}</span> : hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Avatar({ name, className = 'size-9 text-xs' }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-linear-to-br from-blush-300 to-brand-500 font-bold text-white ${className}`}>
      {initials(name)}
    </span>
  )
}

const TONES = {
  brand: 'from-brand-500 to-brand-600 shadow-brand-500/30',
  blush: 'from-blush-400 to-blush-500 shadow-blush-400/30',
  mix: 'from-blush-400 to-brand-500 shadow-brand-500/30',
  soft: 'from-brand-300 to-brand-400 shadow-brand-300/30',
}

export function StatCard({ label, value, hint, icon, tone = 'brand' }) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-linear-to-br from-blush-50 to-brand-50" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
          <p className="mt-2 truncate text-2xl font-extrabold tracking-tight text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br text-white shadow-lg ${TONES[tone]}`}>
          <Icon name={icon} className="size-5" />
        </span>
      </div>
    </div>
  )
}

export function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition disabled:opacity-50 ${
        checked ? 'bg-brand-500' : 'bg-blush-200'
      }`}
    >
      <span className={`inline-block size-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <input className="input pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

export function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{children}</span>
    </div>
  )
}

const numberFmt = new Intl.NumberFormat('en-IN')

export const money = (n) => `৳${numberFmt.format(Math.round(Number(n) || 0))}`
export const num = (n) => numberFmt.format(Number(n) || 0)

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' })
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Dhaka',
})

export const date = (d) => (d ? dateFmt.format(new Date(d)) : '—')
export const dateTime = (d) => (d ? dateTimeFmt.format(new Date(d)) : '—')

export function timeAgo(d) {
  if (!d) return '—'
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.round(h / 24)
  if (days < 30) return `${days}d ago`
  return date(d)
}

export const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

// A date in Bangladesh (UTC+6) as YYYY-MM-DD.
export function bdDate(offsetDays = 0) {
  return new Date(Date.now() + 6 * 3600 * 1000 + offsetDays * 86400000).toISOString().slice(0, 10)
}

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'

// Mirrors server/models + server/config/shop.js

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']
export const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded']
export const SIZES = ['M', 'L', 'XL', 'XXL']
export const ROLES = ['admin', 'superadmin']
export const MAX_ITEMS_PER_ORDER = 12
export const COMBO_SIZE = 3
export const COMBO_PRICE = 990

export const AREAS = {
  inside: { label: 'Inside Dhaka', fee: 70 },
  outside: { label: 'Outside Dhaka', fee: 130 },
}

// Tailwind classes per status — purple for progress, light red for problems.
export const STATUS_STYLES = {
  pending: { badge: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-400', color: '#f59e0b' },
  confirmed: { badge: 'bg-brand-50 text-brand-700 ring-brand-200', dot: 'bg-brand-400', color: '#8b5cf6' },
  processing: { badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200', dot: 'bg-indigo-400', color: '#6366f1' },
  shipped: { badge: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-400', color: '#0ea5e9' },
  delivered: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500', color: '#10b981' },
  cancelled: { badge: 'bg-blush-50 text-blush-700 ring-blush-200', dot: 'bg-blush-400', color: '#fb7185' },
  returned: { badge: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400', color: '#94a3b8' },
}

export const PAYMENT_STYLES = {
  unpaid: 'bg-blush-50 text-blush-700 ring-blush-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  refunded: 'bg-slate-100 text-slate-600 ring-slate-200',
}

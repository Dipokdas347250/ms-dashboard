import { NavLink } from 'react-router-dom'
import Icon from '../ui/Icon'

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/orders', label: 'Orders', icon: 'orders' },
  { to: '/products', label: 'Products', icon: 'products' },
  // { to: '/videos', label: 'Videos', icon: 'video' },
  { to: '/customers', label: 'Customers', icon: 'customers' },
  { to: '/track', label: 'Track order', icon: 'truck' },
  { to: '/storefront', label: 'Storefront', icon: 'store' },
]

const ADMIN_NAV = [{ to: '/settings', label: 'Settings', icon: 'settings' }]

function Item({ to, label, icon, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
          isActive
            ? 'bg-linear-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/30'
            : 'text-muted hover:bg-blush-50 hover:text-blush-600'
        }`
      }
    >
      <Icon name={icon} className="size-[18px]" />
      {label}
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="animate-fade fixed inset-0 z-30 bg-brand-900/30 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 px-5">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-blush-400 to-brand-600 text-sm font-extrabold text-white shadow-lg shadow-brand-500/30">
            MS
          </span>
          <div className="leading-tight">
            <p className="font-extrabold text-ink">MS Admin</p>
            <p className="text-xs text-muted">T-shirt shop</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-muted hover:bg-blush-50 lg:hidden" aria-label="Close menu">
            <Icon name="x" className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-bold tracking-widest text-muted/70 uppercase">Manage</p>
          {NAV.map((item) => (
            <Item key={item.to} {...item} onNavigate={onClose} />
          ))}
          <p className="px-3 pt-5 pb-2 text-[11px] font-bold tracking-widest text-muted/70 uppercase">Account</p>
          {ADMIN_NAV.map((item) => (
            <Item key={item.to} {...item} onNavigate={onClose} />
          ))}
        </nav>

        <div className="m-3 rounded-2xl bg-linear-to-br from-blush-50 via-white to-brand-50 p-4 ring-1 ring-line">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Icon name="sparkles" className="size-4 text-blush-500" /> Combo offer
          </p>
          <p className="mt-1 text-xs text-muted">Any 3 shirts for ৳990. Delivery ৳70 in Dhaka, ৳130 outside.</p>
        </div>
      </aside>
    </>
  )
}

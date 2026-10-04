import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { Avatar } from '../ui/Common'
import { useAuth } from '../../context/AuthContext'
import { systemApi } from '../../api/endpoints'
import { capitalize } from '../../utils/format'

// Polls GET /api/health so admins notice when the API goes down.
function useHealth() {
  const [status, setStatus] = useState('checking')
  useEffect(() => {
    let alive = true
    const check = () =>
      systemApi
        .health()
        .then(() => alive && setStatus('online'))
        .catch(() => alive && setStatus('offline'))
    check()
    const t = setInterval(check, 30000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])
  return status
}

export default function Topbar({ onMenu }) {
  const { admin, logout } = useAuth()
  const health = useHealth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (e) => !menuRef.current?.contains(e.target) && setMenuOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const search = (e) => {
    e.preventDefault()
    const term = q.trim()
    if (term) navigate(`/orders?q=${encodeURIComponent(term)}`)
  }

  const healthStyle = {
    online: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    offline: 'bg-blush-50 text-blush-700 ring-blush-200',
    checking: 'bg-brand-50 text-brand-700 ring-brand-200',
  }[health]

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/80 px-4 backdrop-blur-md sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-muted hover:bg-brand-50 lg:hidden" aria-label="Open menu">
        <Icon name="menu" className="size-5" />
      </button>

      <form onSubmit={search} className="relative hidden max-w-md flex-1 sm:block">
        <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search orders by ID, phone, name…"
          className="input border-transparent bg-canvas pl-9"
        />
      </form>

      <div className="ml-auto flex items-center gap-3">
        <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 sm:inline-flex ${healthStyle}`}>
          <span className={`size-1.5 rounded-full ${health === 'online' ? 'bg-emerald-500' : health === 'offline' ? 'bg-blush-500' : 'bg-brand-400'}`} />
          API {health}
        </span>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-brand-50">
            <Avatar name={admin?.name} />
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-sm font-semibold text-ink">{admin?.name}</span>
              <span className="block text-xs text-muted">{capitalize(admin?.role)}</span>
            </span>
            <Icon name="chevronDown" className="size-4 text-muted" />
          </button>
          {menuOpen && (
            <div className="animate-toast absolute right-0 mt-2 w-56 rounded-xl border border-line bg-white p-1.5 shadow-xl shadow-brand-900/10">
              <div className="border-b border-line px-3 py-2">
                <p className="truncate text-sm font-semibold text-ink">{admin?.name}</p>
                <p className="truncate text-xs text-muted">{admin?.email}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-brand-50"
              >
                <Icon name="settings" className="size-4" /> Settings
              </Link>
              <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-blush-600 hover:bg-blush-50">
                <Icon name="logout" className="size-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

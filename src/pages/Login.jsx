import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/ui/Icon'
import { Spinner } from '../components/ui/Feedback'
import { useRegistrationOpen } from './Register'

export default function Login() {
  const { admin, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const registrationOpen = useRegistrationOpen()

  if (admin) return <Navigate to={location.state?.from?.pathname || '/'} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(form.email.trim(), form.password)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-linear-to-br from-blush-400 via-brand-500 to-brand-700 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-32 -bottom-32 size-[28rem] rounded-full bg-blush-300/30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/20 font-extrabold ring-1 ring-white/30 backdrop-blur">MS</span>
          <span className="text-lg font-bold">MS Admin</span>
        </div>
        <div className="relative mt-auto max-w-md">
          <h1 className="text-4xl leading-tight font-extrabold">Run the whole shop from one place.</h1>
          <p className="mt-4 text-white/80">Orders, stock, customers and courier dispatch, all live from your server.</p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ['orders', 'Orders'],
              ['products', 'Products'],
              ['truck', 'Courier'],
            ].map(([icon, label]) => (
              <div key={label} className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20 backdrop-blur">
                <Icon name={icon} className="size-5" />
                <p className="mt-2 text-sm font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-linear-to-b from-white to-blush-50/50 p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <span className="mb-8 grid size-12 place-items-center rounded-2xl bg-linear-to-br from-blush-400 to-brand-600 font-extrabold text-white shadow-lg shadow-brand-500/30 lg:hidden">
            MS
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">Welcome back</h2>
          <p className="mt-1 text-sm text-muted">Sign in with your admin account.</p>

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-xl bg-blush-50 p-3 text-sm text-blush-700 ring-1 ring-blush-200">
              <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <label className="mt-6 block">
            <span className="label">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@example.com"
            />
          </label>
          <label className="mt-4 block">
            <span className="label">Password</span>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="input pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:text-brand-600"
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                <Icon name={show ? 'eyeOff' : 'eye'} className="size-4" />
              </button>
            </div>
          </label>

          <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full py-3">
            {busy ? <Spinner className="size-4 border-white/40 border-t-white" /> : <Icon name="key" className="size-4" />}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          {registrationOpen && (
            <p className="mt-6 text-center text-sm text-muted">
              No admin yet?{' '}
              <Link to="/register" className="font-semibold text-brand-600 hover:text-blush-500">
                Register
              </Link>
            </p>
          )}
          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
            <Icon name="shield" className="size-3.5 text-brand-500" />
            Admin access only. One device can be signed in at a time.
          </p>
        </form>
      </div>
    </div>
  )
}

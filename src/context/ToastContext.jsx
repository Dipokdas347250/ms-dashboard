import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import Icon from '../components/ui/Icon'

const ToastContext = createContext(null)

const STYLES = {
  success: { ring: 'border-emerald-200', icon: 'check', iconCls: 'bg-emerald-50 text-emerald-600' },
  error: { ring: 'border-blush-200', icon: 'alert', iconCls: 'bg-blush-50 text-blush-600' },
  info: { ring: 'border-brand-200', icon: 'info', iconCls: 'bg-brand-50 text-brand-600' },
}

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (type, message) => {
      const id = nextId++
      setToasts((list) => [...list.slice(-3), { id, type, message }])
      setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3500)
    },
    [dismiss],
  )

  const toast = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', typeof m === 'string' ? m : m?.message || 'Something went wrong'),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const s = STYLES[t.type]
          return (
            <div
              key={t.id}
              className={`animate-toast pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3 pr-2 shadow-lg shadow-brand-900/10 ${s.ring}`}
              role="status"
            >
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${s.iconCls}`}>
                <Icon name={s.icon} className="size-4" />
              </span>
              <p className="flex-1 pt-1.5 text-sm text-ink">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="rounded-md p-1 text-muted hover:bg-canvas" aria-label="Dismiss">
                <Icon name="x" className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)

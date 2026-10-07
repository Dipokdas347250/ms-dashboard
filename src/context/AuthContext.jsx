import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { tokenStore, UNAUTHORIZED_EVENT } from '../api/client'
import { authApi } from '../api/endpoints'

const AuthContext = createContext(null)
const HEARTBEAT_MS = 5 * 60 * 1000

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  // Only "loading" when there is a saved token to verify.
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()))

  // Local only — used when the server already refused the token.
  const clearSession = useCallback(() => {
    tokenStore.clear()
    setAdmin(null)
  }, [])

  // Ends the session on the server too, so the admin can sign in from another device.
  const logout = useCallback(() => {
    authApi.logout().catch(() => {})
    clearSession()
  }, [clearSession])

  // Restore the session from a saved token.
  useEffect(() => {
    if (!tokenStore.get()) return
    authApi
      .me()
      .then(({ data }) => setAdmin(data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  // Any 401 (expired token, session ended, password changed) logs out.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, clearSession)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearSession)
  }, [clearSession])

  // The server ends a session after a while without requests; keep it alive while the dashboard is open.
  useEffect(() => {
    if (!admin) return
    const t = setInterval(() => authApi.me().catch(() => {}), HEARTBEAT_MS)
    return () => clearInterval(t)
  }, [admin])

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password)
    tokenStore.set(data.token)
    setAdmin(data.admin)
    return data.admin
  }, [])

  // Changing the password invalidates old tokens, so store the fresh one.
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const res = await authApi.changePassword(currentPassword, newPassword)
    tokenStore.set(res.data.token)
    return res
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const res = await authApi.updateProfile(payload)
    setAdmin(res.data)
    return res
  }, [])

  const value = useMemo(
    () => ({ admin, loading, login, logout, changePassword, updateProfile, isSuperadmin: admin?.role === 'superadmin' }),
    [admin, loading, login, logout, changePassword, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

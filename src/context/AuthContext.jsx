import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { tokenStore, UNAUTHORIZED_EVENT } from '../api/client'
import { authApi } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  // Only "loading" when there is a saved token to verify.
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()))

  const logout = useCallback(() => {
    tokenStore.clear()
    setAdmin(null)
  }, [])

  // Restore the session from a saved token.
  useEffect(() => {
    if (!tokenStore.get()) return
    authApi
      .me()
      .then(({ data }) => setAdmin(data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  // Any 401 (expired token, password changed elsewhere, account disabled) logs out.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout)
  }, [logout])

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

  const value = useMemo(
    () => ({ admin, loading, login, logout, changePassword, isSuperadmin: admin?.role === 'superadmin' }),
    [admin, loading, login, logout, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

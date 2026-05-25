import useAuthStore from '../store/authStore'

export function useAuth() {
  const user = useAuthStore(s => s.user)
  const token = useAuthStore(s => s.token)
  const isAdmin = useAuthStore(s => s.isAdmin)
  const login = useAuthStore(s => s.login)
  const logout = useAuthStore(s => s.logout)
  return { user, token, isAdmin, isAuthenticated: !!token, login, logout }
}

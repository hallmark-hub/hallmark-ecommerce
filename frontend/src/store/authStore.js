import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loginCustomer, registerCustomer } from '../api/auth'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      profile: null,
      token: null,
      isAdmin: false,

      async login(email, password) {
        const res = await loginCustomer({ email, password })
        if (!res.success) throw new Error(res.message)
        setAuthState(set, res.data)
        return res.data
      },

      async register(payload) {
        const res = await registerCustomer(payload)
        if (!res.success) throw new Error(res.message)
        setAuthState(set, res.data)
        return res.data
      },

      logout() {
        set({ user: null, profile: null, token: null, isAdmin: false })
      },
    }),
    { name: 'chefware-auth' }
  )
)

function setAuthState(set, auth) {
  set({
    user: auth.user,
    profile: auth.profile,
    token: auth.access_token,
    isAdmin: auth.profile?.role === 'admin',
  })
}

export default useAuthStore

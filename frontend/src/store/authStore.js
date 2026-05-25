import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MOCK_USER = { id: 'u1', name: 'Kwame Asante', email: 'kwame@example.com', phone: '+233244123456' }

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAdmin: false,

      login(email) {
        // Mock auth — real auth contract TBD with backend
        if (email === 'admin@chefware.com') {
          set({ user: { ...MOCK_USER, name: 'Admin', email }, token: 'mock-admin-token', isAdmin: true })
        } else {
          set({ user: { ...MOCK_USER, email }, token: 'mock-user-token', isAdmin: false })
        }
      },

      logout() {
        set({ user: null, token: null, isAdmin: false })
      },
    }),
    { name: 'chefware-auth' }
  )
)

export default useAuthStore

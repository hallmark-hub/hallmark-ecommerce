import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { validatePhone, formatPhone } from '../utils/format'
import Button from '../components/Button'

export default function AuthPage() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  function update(f, v) { setForm(p => ({ ...p, [f]: v })) }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) { setError('Valid email required.'); return }
    if (!form.password.trim()) { setError('Password required.'); return }
    if (mode === 'register') {
      if (!form.name.trim()) { setError('Name required.'); return }
      if (!validatePhone(formatPhone(form.phone))) { setError('Phone must be +233XXXXXXXXX.'); return }
    }
    setLoading(true)
    setTimeout(() => {
      login(form.email, form.password)
      navigate('/account')
      setLoading(false)
    }, 600)
  }

  return (
    <main className="pt-20 min-h-screen bg-surface flex items-center justify-center">
      <div className="w-full max-w-md px-gutter py-xl">
        <div className="text-center mb-xl">
          <h1 className="text-h1 font-medium text-on-surface">{mode === 'login' ? 'Sign In' : 'Create Account'}</h1>
          <p className="text-body text-secondary mt-2">ChefWare Enterprise — Accra</p>
          <p className="text-label text-xs text-tertiary mt-1 font-semibold uppercase tracking-wide">Mock UI — auth pending backend</p>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant p-xl">
          {error && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md">
              <AlertTriangle size={16} className="shrink-0" />
              <p className="text-body-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-md">
            {mode === 'register' && (
              <div>
                <label className="block text-label text-xs font-semibold text-secondary uppercase tracking-wide mb-xs" htmlFor="name">Full Name *</label>
                <input id="name" type="text" value={form.name} onChange={e => update('name', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Kwame Asante" />
              </div>
            )}
            <div>
              <label className="block text-label text-xs font-semibold text-secondary uppercase tracking-wide mb-xs" htmlFor="email">Email *</label>
              <input id="email" type="email" value={form.email} onChange={e => update('email', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="kwame@example.com" />
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-label text-xs font-semibold text-secondary uppercase tracking-wide mb-xs" htmlFor="phone">Phone *</label>
                <input id="phone" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="+233244123456" />
              </div>
            )}
            <div>
              <label className="block text-label text-xs font-semibold text-secondary uppercase tracking-wide mb-xs" htmlFor="password">Password *</label>
              <input id="password" type="password" value={form.password} onChange={e => update('password', e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" />
            </div>
            <Button type="submit" loading={loading} variant="primary" size="lg" className="w-full">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-body-sm text-secondary mt-md">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }} className="text-primary font-medium hover:underline cursor-pointer">
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>

        <p className="text-center text-body-sm text-secondary mt-md">
          Hint: use <code className="bg-surface-container px-1 rounded text-xs">admin@chefware.com</code> to log in as admin
        </p>
      </div>
    </main>
  )
}

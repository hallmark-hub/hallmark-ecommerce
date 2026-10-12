import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { resetPassword } from '../api/auth'
import Button from '../components/Button'
import { usePageTitle } from '../hooks/usePageTitle'

// Supabase's reset email lands here with the recovery session in the URL hash
// (#access_token=...&type=recovery), or with #error_description=... when the link has expired.
function readRecoveryHash() {
  const params = new URLSearchParams(window.location.hash.slice(1))
  const token = params.get('type') === 'recovery' ? params.get('access_token') : null
  return { token, linkError: params.get('error_description') }
}

export default function ResetPasswordPage() {
  usePageTitle('Choose a New Password')
  const [{ token, linkError }] = useState(readRecoveryHash)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Keep the token out of browser history and any shared screenshot of the URL
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <main className="pt-20 min-h-screen bg-surface flex items-center justify-center">
      <div className="w-full max-w-md px-gutter py-xl">
        <div className="text-center mb-xl">
          <h1 className="text-h1 text-on-surface">Choose a New Password</h1>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant p-5 sm:p-xl">
          {done ? (
            <div className="text-center" role="status">
              <CheckCircle size={40} className="text-primary mx-auto mb-sm" />
              <p className="text-body text-on-surface mb-md">Your password has been updated.</p>
              <Button as={Link} to="/login" variant="primary" size="lg" fullWidth>Sign In</Button>
            </div>
          ) : !token ? (
            <div className="text-center" role="alert">
              <AlertTriangle size={40} className="text-tertiary mx-auto mb-sm" />
              <p className="text-body text-on-surface mb-xs">This reset link is invalid or has expired.</p>
              {linkError && <p className="text-body-sm text-secondary mb-xs">{linkError}</p>}
              <p className="text-body-sm text-secondary mb-md">Request a new link and use it straight away.</p>
              <Button as={Link} to="/forgot-password" variant="primary" size="lg" fullWidth>Request a New Link</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-md" noValidate>
              {error && (
                <div role="alert" className="flex items-center gap-2 bg-error-container text-on-error-container px-md py-sm rounded-lg">
                  <AlertTriangle size={16} className="shrink-0" />
                  <p className="text-body-sm">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-label uppercase text-secondary mb-xs" htmlFor="new-password">New Password *</label>
                <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="At least 8 characters" />
              </div>
              <div>
                <label className="block text-label uppercase text-secondary mb-xs" htmlFor="confirm-password">Confirm Password *</label>
                <input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} className={inputCls} />
              </div>
              <Button type="submit" loading={loading} variant="primary" size="lg" fullWidth>Update Password</Button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

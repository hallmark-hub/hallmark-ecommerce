import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, MailCheck } from 'lucide-react'
import { requestPasswordReset } from '../api/auth'
import Button from '../components/Button'
import { usePageTitle } from '../hooks/usePageTitle'

export default function ForgotPasswordPage() {
  usePageTitle('Reset Password')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Valid email required.'); return }
    setLoading(true)
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="pt-20 min-h-screen bg-surface flex items-center justify-center">
      <div className="w-full max-w-md px-gutter py-xl">
        <div className="text-center mb-xl">
          <h1 className="text-h1 text-on-surface">Reset Password</h1>
          <p className="text-body text-secondary mt-2">We'll email you a link to choose a new password.</p>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant p-5 sm:p-xl">
          {sent ? (
            <div className="text-center" role="status">
              <MailCheck size={40} className="text-primary mx-auto mb-sm" />
              <p className="text-body text-on-surface mb-xs">If an account exists for <strong>{email}</strong>, a reset link is on its way.</p>
              <p className="text-body-sm text-secondary">Check your inbox and spam folder. The link expires after a short time.</p>
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
                <label className="block text-label uppercase text-secondary mb-xs" htmlFor="reset-email">Email *</label>
                <input id="reset-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-md py-sm border border-outline-variant rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-primary" placeholder="kwame@example.com" />
              </div>
              <Button type="submit" loading={loading} variant="primary" size="lg" fullWidth>Send Reset Link</Button>
            </form>
          )}

          <p className="text-center text-body-sm text-secondary mt-md">
            <Link to="/login" className="text-primary font-semibold hover:underline">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

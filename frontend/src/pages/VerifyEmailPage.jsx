import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import client from '../api/client'
import { Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState({ loading: true, error: '', message: '' })
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setStatus({ loading: false, error: 'This verification link is missing its token.', message: '' })
      return
    }
    client.post('/auth/verify-email', { token })
      .then(({ data }) => setStatus({ loading: false, error: '', message: data.message }))
      .catch((err) => setStatus({ loading: false, message: '', error: err.response?.data?.error || 'This verification link is invalid or expired' }))
  }, [params])

  const handleResend = async (event) => {
    event.preventDefault()
    setResending(true)
    setResendMessage('')
    try {
      const { data } = await client.post('/auth/resend-verification', { email })
      setResendMessage(data.message)
    } catch (err) {
      setResendMessage(err.response?.data?.error || 'Unable to send a new verification link right now.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-2 py-8">
      <div className="card w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-primary mb-4">Email verification</h1>
        {status.loading && <p className="text-grey-400">Verifying your email…</p>}
        {status.message && <p className="p-3 rounded-lg bg-green-50 text-green-700">{status.message}</p>}
        {status.error && <p className="p-3 rounded-lg bg-red-50 text-red-700">{status.error}</p>}
        {status.error && (
          <form onSubmit={handleResend} className="mt-5 space-y-3 text-left">
            <label htmlFor="verification-email" className="block text-sm font-medium text-primary">Send a fresh link</label>
            <input id="verification-email" type="email" required className="input" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            <button type="submit" disabled={resending} className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50">
              <Mail size={17} /> {resending ? 'Sending…' : 'Resend verification email'}
            </button>
            {resendMessage && <p role="status" className="text-sm text-grey-400">{resendMessage}</p>}
          </form>
        )}
        {!status.loading && <Link className="btn-primary inline-block mt-5" to="/login">Continue to sign in</Link>}
      </div>
    </div>
  )
}

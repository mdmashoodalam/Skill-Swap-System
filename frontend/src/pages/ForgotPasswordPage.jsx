import { useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await client.post('/auth/forgot-password', { email })
      setMessage(data.message)
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to process the request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-2 py-8">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-primary mb-2">Reset your password</h1>
        <p className="text-grey-400 mb-6">Enter your account email and we’ll send a secure reset link.</p>
        {message && <div className="p-3 mb-4 rounded-lg bg-green-50 text-green-700">{message}</div>}
        {error && <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-700">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
        </form>
        <Link className="block text-center text-primary mt-5 hover:underline" to="/login">Back to sign in</Link>
      </div>
    </div>
  )
}

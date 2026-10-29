import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import client from '../api/client'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (password.length < 8 || password !== confirm) {
      setError(password.length < 8 ? 'Password must be at least 8 characters' : 'Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await client.post('/auth/reset-password', { token: params.get('token'), password })
      setMessage(data.message)
    } catch (err) {
      setError(err.response?.data?.error || 'This reset link is invalid or expired')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-2 py-8">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-primary mb-6">Choose a new password</h1>
        {message ? (
          <div className="space-y-4"><div className="p-3 rounded-lg bg-green-50 text-green-700">{message}</div><Link className="btn-primary block text-center" to="/login">Sign in</Link></div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-50 text-red-700">{error}</div>}
            <input className="input" type="password" required maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
            <input className="input" type="password" required maxLength={72} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" />
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</button>
          </form>
        )}
      </div>
    </div>
  )
}

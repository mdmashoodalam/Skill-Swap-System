import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import { Users, MessageSquare, Clock, Star, Award, Sparkles, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { getApiErrorMessage } from '../utils/apiError'

export default function DashboardPage() {
  const { setUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUserData] = useState(null)
  const [matches, setMatches] = useState([])
  const [requests, setRequests] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [verificationMessage, setVerificationMessage] = useState('')
  const [dashboardError, setDashboardError] = useState('')
  const [resending, setResending] = useState(false)
  const [actionMessage, setActionMessage] = useState(location.state?.message || '')

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setDashboardError('')
      const userRes = await client.get('/auth/me')
      setUserData(userRes.data)
      setUser(userRes.data)
      if (!userRes.data.emailVerified) {
        setMatches([])
        setRequests([])
        setSessions([])
        return
      }

      const [matchesRes, requestsRes, sessionsRes] = await Promise.all([
        client.get('/matches/me'),
        client.get('/swap-requests/incoming/me'),
        client.get('/sessions/me/sessions'),
      ])

      setMatches(Array.isArray(matchesRes.data) ? matchesRes.data : [])
      setRequests(Array.isArray(requestsRes.data)
        ? requestsRes.data.filter((request) => request.status === 'PENDING')
        : [])
      setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : [])
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setDashboardError(getApiErrorMessage(err, 'Could not load your dashboard.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (location.state?.message) {
      setActionMessage(location.state.message)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  if (loading) return <LoadingSpinner />

  const upcomingSessions = sessions.filter((session) =>
    session.status === 'SCHEDULED' && new Date(session.scheduledAt) > new Date())
  const completedSessions = sessions.filter((session) => session.status === 'COMPLETED')
  const achievements = [
    { name: 'First Connection', detail: 'Accepted your first skill match', earned: matches.length >= 1 },
    { name: 'Learning Momentum', detail: 'Completed three learning sessions', earned: completedSessions.length >= 3 },
    { name: 'Community Mentor', detail: 'Completed ten skill sessions', earned: completedSessions.length >= 10 },
    { name: 'Highly Trusted', detail: 'Maintained a 4.5+ rating across five reviews', earned: (user?.totalReviews || 0) >= 5 && (user?.ratingAvg || 0) >= 4.5 },
  ]

  const resendVerification = async () => {
    setResending(true)
    setVerificationMessage('')
    try {
      const { data } = await client.post('/auth/resend-verification', { email: user.email })
      setVerificationMessage(data.message)
    } catch (err) {
      setVerificationMessage(getApiErrorMessage(err, 'Unable to send a link right now. Please try again later.'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-8">
      {actionMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800" role="status">
          <CheckCircle size={20} /> {actionMessage}
        </div>
      )}
      {dashboardError && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
          <span className="flex items-center gap-2"><AlertCircle size={20} /> {dashboardError}</span>
          <button type="button" className="btn-secondary shrink-0" onClick={loadDashboard}>Retry</button>
        </div>
      )}
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-[#21877a] rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div aria-hidden="true" className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[30px] border-white/5" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/70 mb-2">Your learning space</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Welcome back, {user?.fullName}</h1>
          <p className="text-white/80">Ready to share your skills and learn something new?</p>
        </div>
      </div>

      {user && !user.emailVerified && (
        <div className="card border border-amber-200 bg-amber-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-amber-900">Verify your email to strengthen your profile</p>
            <p className="text-sm text-amber-700" aria-live="polite">{verificationMessage || `Verify ${user.email} to unlock requests, matches, and chat.`}</p>
          </div>
          <button type="button" className="btn-secondary whitespace-nowrap flex items-center gap-2" disabled={resending} onClick={resendVerification}>
            {resending && <Loader size={16} className="animate-spin" />}{resending ? 'Sending…' : 'Resend link'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Star size={24} />}
          label="Rating"
          value={user?.ratingAvg?.toFixed(1) || '0.0'}
          subtitle={`${user?.totalReviews || 0} reviews`}
        />
        <StatCard
          icon={<Users size={24} />}
          label="Matches"
          value={matches.length}
          subtitle="Accepted connections"
        />
        <StatCard
          icon={<MessageSquare size={24} />}
          label="Requests"
          value={requests.length}
          subtitle="Pending swaps"
        />
        <StatCard
          icon={<Clock size={24} />}
          label="Sessions"
          value={upcomingSessions.length}
          subtitle="Upcoming"
        />
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-5"><Award className="text-primary" /><h2 className="text-xl font-bold text-primary">Achievements</h2></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {achievements.map((achievement) => (
            <div key={achievement.name} className={`p-4 rounded-xl border ${achievement.earned ? 'bg-green-50 border-green-200' : 'bg-surface-100 border-surface-300 opacity-60'}`}>
              <Sparkles size={20} className={achievement.earned ? 'text-green-600 mb-2' : 'text-grey-400 mb-2'} />
              <p className="font-semibold text-primary">{achievement.name}</p>
              <p className="text-xs text-grey-500 mt-1">{achievement.earned ? 'Earned · ' : 'Locked · '}{achievement.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary">Active Matches</h2>
            <Link to="/chat" className="text-primary hover:text-primary-dark text-sm font-semibold">
              Open chat →
            </Link>
          </div>
          <div className="space-y-3">
            {matches.length > 0 ? (
              matches.slice(0, 5).map((match) => <MatchCard key={match.id} match={match} userId={user?.id} />)
            ) : (
              <p className="text-grey-400 text-center py-8">No matches yet</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary">Swap Requests</h2>
            <Link to="/requests" className="text-primary hover:text-primary-dark text-sm font-semibold">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {requests.length > 0 ? (
              requests.slice(0, 3).map((req) => <RequestCard key={req.id} request={req} />)
            ) : (
              <p className="text-grey-400 text-center py-8">No pending requests</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, subtitle }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-grey-400 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-primary">{value}</p>
          <p className="text-grey-400 text-xs mt-2">{subtitle}</p>
        </div>
        <div className="text-primary/20">{icon}</div>
      </div>
    </div>
  )
}

function MatchCard({ match, userId }) {
  const otherUser = match.user1?.id === userId ? match.user2 : match.user1

  return (
    <div className="flex items-center justify-between p-4 border border-surface-300 rounded-lg hover:bg-cream-100 transition-colors">
      <div className="flex-1">
        <p className="font-semibold text-primary">{otherUser?.fullName}</p>
        <p className="text-sm text-grey-400">{otherUser?.city || 'City not added'}</p>
      </div>
      <div className="text-right">
        <span className="badge badge-success">{match.matchScore || 0}% Match</span>
      </div>
    </div>
  )
}

function RequestCard({ request }) {
  return (
    <div className="flex items-center justify-between p-4 border border-surface-300 rounded-lg">
      <div className="flex-1">
        <p className="font-semibold text-primary">{request.sender?.fullName}</p>
        <p className="text-sm text-grey-400">wants to swap skills</p>
      </div>
      <span className="badge badge-warning">{request.status}</span>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}





import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { CheckCircle, XCircle, Loader, Calendar, Monitor, MapPin } from 'lucide-react'

export default function RequestsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('incoming')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [tab])

  useEffect(() => {
    const interval = setInterval(() => loadRequests({ silent: true }), 10000)
    return () => clearInterval(interval)
  }, [tab])

  const loadRequests = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const endpoint = tab === 'incoming' ? '/swap-requests/incoming/me' : '/swap-requests/outgoing/me'
      const res = await client.get(endpoint)
      setRequests(res.data || [])
    } catch (err) {
      console.error('Error loading requests:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleAccept = async (id) => {
    try {
      const response = await client.put(`/swap-requests/${id}`, { status: 'ACCEPTED' })

      setRequests((prev) => prev.filter((r) => r.id !== id))

      if (response.data?.matchId) {
        navigate(`/chat/${response.data.matchId}`)
        return
      }

      alert('Swap request accepted!')
      navigate('/chat')
    } catch (err) {
      console.error(err)
      alert('Failed to accept request')
    }
  }

  const handleReject = async (id) => {
    try {
      await client.put(`/swap-requests/${id}`, { status: 'REJECTED' })
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Loader className="animate-spin" size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-primary mb-2">Swap Requests</h1>
        <p className="text-grey-400">Manage your skill exchange requests</p>
      </div>

      <div className="flex gap-2 border-b border-surface-300">
        {['incoming', 'outgoing'].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              setLoading(true)
            }}
            className={`px-4 py-2 font-semibold border-b-2 transition-all ${
              tab === t
                ? 'text-primary border-primary'
                : 'text-grey-400 border-transparent hover:text-primary'
            }`}
          >
            {t === 'incoming' ? 'Incoming' : 'Outgoing'}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-grey-400">
            {tab === 'incoming' ? 'No incoming requests' : 'No outgoing requests'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              isIncoming={tab === 'incoming'}
              onAccept={() => handleAccept(req.id)}
              onReject={() => handleReject(req.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RequestCard({ request, isIncoming, onAccept, onReject }) {
  const otherUser = isIncoming ? request.sender : request.receiver

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
              {otherUser?.fullName?.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-bold text-primary">{otherUser?.fullName}</p>
              <p className="text-sm text-grey-400">{otherUser?.email}</p>
            </div>
          </div>

          <p className="text-sm text-grey-600 mt-2 p-3 bg-cream-200 rounded-lg">
            {request.message || 'No message'}
          </p>

          <div className="grid sm:grid-cols-2 gap-2 mt-3 text-xs text-grey-600">
            {request.senderOfferedSkill?.skill?.name && <span><strong>Offers:</strong> {request.senderOfferedSkill.skill.name}</span>}
            {request.senderWantedSkill?.skill?.name && <span><strong>Wants:</strong> {request.senderWantedSkill.skill.name}</span>}
            {request.preferredMode && <span className="flex items-center gap-1">{request.preferredMode === 'ONLINE' ? <Monitor size={14} /> : <MapPin size={14} />}{request.preferredMode === 'ONLINE' ? 'Online' : 'In person'}</span>}
            {request.proposedAt && <span className="flex items-center gap-1"><Calendar size={14} />{new Date(request.proposedAt).toLocaleString()}</span>}
          </div>

          <p className="text-xs text-grey-400 mt-2">
            Status: <span className="badge badge-warning">{request.status}</span>
          </p>
        </div>

        {isIncoming && request.status === 'PENDING' && (
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              className="p-2 bg-success/10 text-success rounded-lg hover:bg-success/20 transition"
              title="Accept"
            >
              <CheckCircle size={20} />
            </button>
            <button
              onClick={onReject}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
              title="Reject"
            >
              <XCircle size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

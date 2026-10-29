import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import {
  Calendar, MapPin, User, Clock, CheckCircle, XCircle, Loader,
  Plus, Pencil, Star, X, Video, Download,
} from 'lucide-react'

const emptySchedule = () => {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  date.setMinutes(0, 0, 0)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return {
    matchId: '', topic: '', sessionMode: 'ONLINE',
    scheduledAt: local.toISOString().slice(0, 16), durationMinutes: 60,
    meetingLink: '', location: '', notes: '',
  }
}

export default function SessionsPage() {
  const { auth } = useAuth()
  const currentUserId = Number(auth.userId)
  const [tab, setTab] = useState('upcoming')
  const [allSessions, setAllSessions] = useState([])
  const [matches, setMatches] = useState([])
  const [givenReviews, setGivenReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [sessionsRes, matchesRes, reviewsRes] = await Promise.all([
        client.get('/sessions/me/sessions'), client.get('/matches/me'), client.get('/reviews/me/given'),
      ])
      setAllSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : [])
      setMatches(Array.isArray(matchesRes.data) ? matchesRes.data : [])
      setGivenReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : [])
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load sessions.')
    } finally { setLoading(false) }
  }

  const reviewedSessionIds = useMemo(
    () => new Set(givenReviews.map((review) => review.session?.id)), [givenReviews]
  )

  const sessions = useMemo(() => {
    const now = new Date()
    return allSessions.filter((session) => {
      const scheduled = new Date(session.scheduledAt)
      return tab === 'upcoming'
        ? session.status === 'SCHEDULED' && scheduled > now
        : session.status !== 'SCHEDULED' || scheduled <= now
    })
  }, [allSessions, tab])

  const updateSessionStatus = async (session, status) => {
    setError('')
    try {
      const endpoint = status === 'COMPLETED' ? 'complete' : 'cancel'
      const response = await client.patch(`/sessions/${session.id}/${endpoint}`)
      setAllSessions((current) => current.map((item) => item.id === session.id ? response.data : item))
      if (status === 'COMPLETED') setTab('history')
    } catch (err) {
      setError(err.response?.data?.error || `Unable to ${status.toLowerCase()} the session.`)
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-96"><Loader className="animate-spin" size={40} /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-4xl font-bold text-primary mb-2">Learning Sessions</h1><p className="text-grey-400">Schedule, manage, and review your skill exchanges</p></div>
        <button type="button" onClick={() => setModal({ type: 'schedule' })} disabled={!matches.length} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50" title={!matches.length ? 'Accept a swap request before scheduling' : 'Schedule a session'}><Plus size={18} /> Schedule session</button>
      </div>

      <div className="flex gap-2 border-b border-surface-300">
        {[['upcoming', 'Upcoming'], ['history', 'History']].map(([value, label]) => <button key={value} onClick={() => setTab(value)} className={`px-4 py-2 font-semibold border-b-2 ${tab === value ? 'text-primary border-primary' : 'text-grey-400 border-transparent hover:text-primary'}`}>{label}</button>)}
      </div>
      {error && <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">{error}</div>}

      {!sessions.length ? (
        <div className="card text-center py-12"><Calendar className="mx-auto text-grey-400 mb-3" size={34} /><p className="font-semibold text-primary">No {tab === 'upcoming' ? 'upcoming' : 'past'} sessions</p><p className="text-sm text-grey-400 mt-1">{matches.length ? 'Schedule time with one of your matches.' : 'Accept a swap request to create your first match.'}</p></div>
      ) : (
        <div className="space-y-4">{sessions.map((session) => <SessionCard key={session.id} session={session} currentUserId={currentUserId} reviewed={reviewedSessionIds.has(session.id)} onComplete={() => updateSessionStatus(session, 'COMPLETED')} onCancel={() => updateSessionStatus(session, 'CANCELLED')} onReschedule={() => setModal({ type: 'reschedule', session })} onReview={() => setModal({ type: 'review', session })} />)}</div>
      )}

      {(modal?.type === 'schedule' || modal?.type === 'reschedule') && <ScheduleModal matches={matches} currentUserId={currentUserId} session={modal.session} onClose={() => setModal(null)} onSaved={(saved, isNew) => { setAllSessions((current) => isNew ? [...current, saved] : current.map((item) => item.id === saved.id ? saved : item)); setModal(null); setTab('upcoming') }} />}
      {modal?.type === 'review' && <ReviewModal session={modal.session} currentUserId={currentUserId} onClose={() => setModal(null)} onSaved={(review) => { setGivenReviews((current) => [...current, review]); setModal(null) }} />}
    </div>
  )
}

function downloadCalendarEvent(session, other) {
  const start = new Date(session.scheduledAt)
  const end = new Date(start.getTime() + (session.durationMinutes || 60) * 60000)
  const stamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const clean = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,')
  const location = session.sessionMode === 'ONLINE' ? session.meetingLink : session.location
  const content = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SkillSwap//Sessions//EN', 'BEGIN:VEVENT',
    `UID:skillswap-session-${session.id}@skillswap`, `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${clean(session.topic)}`,
    `DESCRIPTION:${clean(`Skill swap session with ${other?.fullName || 'your match'}. ${session.notes || ''}`)}`,
    `LOCATION:${clean(location)}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }))
  link.download = `skillswap-session-${session.id}.ics`
  link.click()
  URL.revokeObjectURL(link.href)
}

function SessionCard({ session, currentUserId, reviewed, onComplete, onCancel, onReschedule, onReview }) {
  const date = new Date(session.scheduledAt)
  const other = session.hostUser?.id === currentUserId ? session.learnerUser : session.hostUser
  const scheduled = session.status === 'SCHEDULED'
  return <article className="card"><div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4"><div className="flex-1"><div className="flex flex-wrap items-center gap-2 mb-3"><h3 className="text-lg font-bold text-primary">{session.topic}</h3><StatusBadge status={session.status} /></div><div className="grid sm:grid-cols-2 gap-2 text-sm text-grey-600"><span className="flex items-center gap-2"><Calendar size={16} />{date.toLocaleDateString()}</span><span className="flex items-center gap-2"><Clock size={16} />{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {session.durationMinutes} min</span><span className="flex items-center gap-2"><User size={16} />With {other?.fullName || 'Unknown user'}</span><span className="flex items-center gap-2">{session.sessionMode === 'ONLINE' ? <Video size={16} /> : <MapPin size={16} />}{session.sessionMode === 'ONLINE' ? 'Online' : session.location || 'Location not set'}</span></div>{session.meetingLink && scheduled && <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-semibold mt-3 underline">Join meeting</a>}{session.notes && <p className="text-sm text-grey-600 mt-3 p-3 bg-cream-100 rounded-lg">{session.notes}</p>}</div><div className="flex flex-wrap gap-2">{scheduled && <button onClick={() => downloadCalendarEvent(session, other)} className="btn-secondary flex items-center gap-2 text-sm"><Download size={16} /> Calendar</button>}{scheduled && <><button onClick={onReschedule} className="btn-secondary flex items-center gap-2 text-sm"><Pencil size={16} /> Reschedule</button><button onClick={onComplete} className="btn-success flex items-center gap-2 text-sm"><CheckCircle size={16} /> Complete</button><button onClick={onCancel} className="px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100" title="Cancel session"><XCircle size={18} /></button></>}{session.status === 'COMPLETED' && !reviewed && <button onClick={onReview} className="btn-primary flex items-center gap-2 text-sm"><Star size={16} /> Leave review</button>}{session.status === 'COMPLETED' && reviewed && <span className="badge badge-success">Reviewed</span>}</div></div></article>
}

function ScheduleModal({ matches, currentUserId, session, onClose, onSaved }) {
  const isReschedule = Boolean(session)
  const [form, setForm] = useState(() => session ? { matchId: String(session.match?.id || ''), topic: session.topic || '', sessionMode: session.sessionMode || 'ONLINE', scheduledAt: String(session.scheduledAt || '').slice(0, 16), durationMinutes: session.durationMinutes || 60, meetingLink: session.meetingLink || '', location: session.location || '', notes: session.notes || '' } : { ...emptySchedule(), matchId: String(matches[0]?.id || '') })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const selectedMatch = matches.find((match) => String(match.id) === String(form.matchId))
  const other = selectedMatch ? (selectedMatch.user1?.id === currentUserId ? selectedMatch.user2 : selectedMatch.user1) : null

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const response = isReschedule
        ? await client.patch(`/sessions/${session.id}/reschedule`, { scheduledAt: form.scheduledAt, durationMinutes: Number(form.durationMinutes), meetingLink: form.sessionMode === 'ONLINE' ? form.meetingLink || null : null, location: form.sessionMode === 'OFFLINE' ? form.location || null : null, notes: form.notes || null })
        : await client.post('/sessions', { matchId: Number(form.matchId), hostUserId: currentUserId, learnerUserId: other?.id, topic: form.topic, sessionMode: form.sessionMode, scheduledAt: form.scheduledAt, durationMinutes: Number(form.durationMinutes), meetingLink: form.sessionMode === 'ONLINE' ? form.meetingLink || null : null, location: form.sessionMode === 'OFFLINE' ? form.location || null : null, notes: form.notes || null })
      onSaved(response.data, !isReschedule)
    } catch (err) { setError(err.response?.data?.error || 'Unable to save this session.') } finally { setSaving(false) }
  }

  return <Modal title={isReschedule ? 'Reschedule session' : 'Schedule a session'} onClose={onClose}><form onSubmit={submit} className="space-y-4">{error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}{!isReschedule && <><Field label="Match"><select className="input" value={form.matchId} onChange={(e) => setForm({ ...form, matchId: e.target.value })} required>{matches.map((match) => { const person = match.user1?.id === currentUserId ? match.user2 : match.user1; return <option key={match.id} value={match.id}>{person?.fullName}</option> })}</select></Field><Field label="Topic"><input className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} maxLength={200} required /></Field><Field label="Mode"><select className="input" value={form.sessionMode} onChange={(e) => setForm({ ...form, sessionMode: e.target.value })}><option value="ONLINE">Online</option><option value="OFFLINE">In person</option></select></Field></>}<div className="grid sm:grid-cols-2 gap-4"><Field label="Date and time"><input type="datetime-local" className="input" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required /></Field><Field label="Duration"><select className="input" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">1 hour</option><option value="90">90 minutes</option><option value="120">2 hours</option></select></Field></div>{form.sessionMode === 'ONLINE' ? <Field label="Meeting link (optional)"><input type="url" className="input" placeholder="https://…" value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} /></Field> : <Field label="Location"><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required /></Field>}<Field label="Notes (optional)"><textarea className="input min-h-24" maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button disabled={saving || (!isReschedule && !other)} className="btn-primary disabled:opacity-50">{saving ? 'Saving…' : isReschedule ? 'Save changes' : 'Schedule'}</button></div></form></Modal>
}

function ReviewModal({ session, currentUserId, onClose, onSaved }) {
  const reviewee = session.hostUser?.id === currentUserId ? session.learnerUser : session.hostUser
  const [rating, setRating] = useState(5), [comment, setComment] = useState(''), [saving, setSaving] = useState(false), [error, setError] = useState('')
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(''); try { const response = await client.post('/reviews/me', { sessionId: session.id, revieweeId: reviewee.id, rating, comment: comment || null }); onSaved(response.data) } catch (err) { setError(err.response?.data?.error || 'Unable to submit your review.') } finally { setSaving(false) } }
  return <Modal title={`Review ${reviewee?.fullName || 'your partner'}`} onClose={onClose}><form onSubmit={submit} className="space-y-5">{error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}<div><p className="text-sm font-medium mb-2">Your rating</p><div className="flex gap-2">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} stars`}><Star className={value <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} size={30} /></button>)}</div></div><Field label="Comment (optional)"><textarea className="input min-h-28" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What went well?" /></Field><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Submitting…' : 'Submit review'}</button></div></form></Modal>
}

function Modal({ title, onClose, children }) { return <div className="fixed inset-0 z-[80] bg-black/50 p-4 flex items-center justify-center" role="dialog" aria-modal="true"><div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"><div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between"><h2 className="text-xl font-bold text-primary">{title}</h2><button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close"><X size={20} /></button></div><div className="p-5">{children}</div></div></div> }
function Field({ label, children }) { return <label className="block"><span className="block text-sm font-medium text-primary mb-1">{label}</span>{children}</label> }
function StatusBadge({ status }) { const classes = status === 'COMPLETED' ? 'badge-success' : status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'badge-warning'; return <span className={`badge ${classes}`}>{status}</span> }

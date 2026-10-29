import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client, { BASE_URL } from '../api/client'
import { Star, MessageSquare, MapPin, Loader, User, Search, X, Lightbulb, Heart } from 'lucide-react'

const getPhotoUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${BASE_URL}${url}`
}

export default function MatchesPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('score')
  const [mySkills, setMySkills] = useState({ offered: [], wanted: [] })
  const [search, setSearch] = useState('')
  const [minimumScore, setMinimumScore] = useState(0)
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const { auth } = useAuth()
  const currentUserId = parseInt(auth.userId)

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    try {
      setError('')
      const [res, offeredRes, wantedRes, favoritesRes] = await Promise.all([
        client.get('/matches/recommended/me'),
        client.get('/users/me/offered-skills'),
        client.get('/users/me/wanted-skills'),
        client.get('/community/favorites'),
      ])
      let data = Array.isArray(res.data) ? [...res.data] : []
      setMySkills({
        offered: Array.isArray(offeredRes.data) ? offeredRes.data : [],
        wanted: Array.isArray(wantedRes.data) ? wantedRes.data : [],
      })
      setFavoriteIds(new Set((favoritesRes.data || []).map((item) => item.favoriteUser?.id)))

      setMatches(data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Unable to load recommendations right now.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />

  const sortedMatches = [...matches].sort((a, b) => {
    if (sortBy === 'rating') {
      const bOther = b.user1.id === currentUserId ? b.user2 : b.user1
      const aOther = a.user1.id === currentUserId ? a.user2 : a.user1
      return (bOther?.ratingAvg || 0) - (aOther?.ratingAvg || 0)
    }
    return (b.matchScore || 0) - (a.matchScore || 0)
  }).filter((match) => {
    const other = match.user1.id === currentUserId ? match.user2 : match.user1
    const query = search.trim().toLowerCase()
    return (match.matchScore || 0) >= minimumScore
      && (!favoritesOnly || favoriteIds.has(other.id))
      && (!query || other.fullName?.toLowerCase().includes(query) || other.city?.toLowerCase().includes(query))
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-primary mb-2">Find Matches</h1>
        <p className="text-grey-400">Discover people with complementary skills</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <label className="relative flex-1 min-w-64">
          <Search size={18} className="absolute left-3 top-3 text-grey-400" />
          <input className="input pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or city" />
        </label>
        <select
          className="input w-auto"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="score">Sort by Match Score</option>
          <option value="rating">Sort by Rating</option>
        </select>
        <select className="input w-auto" value={minimumScore} onChange={(e) => setMinimumScore(Number(e.target.value))}>
          <option value="0">Any score</option><option value="50">50%+</option><option value="70">70%+</option><option value="85">85%+</option>
        </select>
        <button type="button" onClick={() => setFavoritesOnly((value) => !value)} className={`btn-secondary flex items-center gap-2 ${favoritesOnly ? 'bg-red-50 text-red-700 border-red-200' : ''}`}><Heart size={17} className={favoritesOnly ? 'fill-red-500 text-red-500' : ''} /> Favorites</button>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
          <button type="button" onClick={loadMatches} className="ml-3 font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {!error && matches.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-grey-400 text-lg">No matches found. Complete your skills profile!</p>
          <Link to="/profile" className="btn-primary mt-4 inline-block">
            Update Profile
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              currentUserId={currentUserId}
              mySkills={mySkills}
              favorite={favoriteIds.has((match.user1.id === currentUserId ? match.user2 : match.user1).id)}
              onToggleFavorite={async (userId, favorite) => {
                if (favorite) await client.delete(`/community/favorites/${userId}`)
                else await client.post(`/community/favorites/${userId}`)
                setFavoriteIds((current) => { const next = new Set(current); favorite ? next.delete(userId) : next.add(userId); return next })
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MatchCard({ match, currentUserId, mySkills, favorite, onToggleFavorite }) {
  const otherUser = match.user1.id === currentUserId ? match.user2 : match.user1
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)
  const [theirSkills, setTheirSkills] = useState({ offered: [], wanted: [] })
  const [skillsLoaded, setSkillsLoaded] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const [theirOffered, theirWanted] = await Promise.all([
          client.get(`/users/${otherUser.id}/offered-skills`),
          client.get(`/users/${otherUser.id}/wanted-skills`),
        ])
        setTheirSkills({ offered: theirOffered.data || [], wanted: theirWanted.data || [] })
      } catch (err) {
        // skills fetch failed — swap request will still work with first fallback
        console.warn('Could not load skills for match card:', err)
      } finally {
        setSkillsLoaded(true)
      }
    }
    fetchSkills()
  }, [otherUser.id])

  const canRequest = skillsLoaded && mySkills.offered.length > 0 && theirSkills.offered.length > 0

  const handleRequest = async (proposal) => {
    if (!canRequest) return
    setRequesting(true)
    try {
      const findCompatible = (items, counterparts) => {
        const counterpartSkillIds = new Set(counterparts.map((item) => item.skill?.id))
        return items.find((item) => counterpartSkillIds.has(item.skill?.id)) || items[0] || null
      }

      const senderOfferedSkillId = proposal?.senderOfferedSkillId || findCompatible(mySkills.offered, theirSkills.wanted)?.id || null
      const senderWantedSkillId = proposal?.senderWantedSkillId || findCompatible(mySkills.wanted, theirSkills.offered)?.id || null
      const receiverOfferedSkillId = proposal?.receiverOfferedSkillId || findCompatible(theirSkills.offered, mySkills.wanted)?.id || null
      const receiverWantedSkillId = proposal?.receiverWantedSkillId || findCompatible(theirSkills.wanted, mySkills.offered)?.id || null

      await client.post('/swap-requests', {
        receiverId: otherUser.id,
        senderOfferedSkillId,
        senderWantedSkillId,
        receiverOfferedSkillId,
        receiverWantedSkillId,
        message: proposal?.message || 'I would like to exchange skills with you!',
        preferredMode: proposal?.preferredMode || null,
        proposedAt: proposal?.proposedAt || null,
      })
      setRequested(true)
      setRequestOpen(false)
    } catch (err) {
      console.error('Error sending swap request:', err)
      const errMsg =
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.error || err.message || 'Unknown error'
      alert('Failed to send swap request: ' + errMsg)
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        {otherUser.profilePhotoUrl && !photoFailed ? (
          <img
            src={getPhotoUrl(otherUser.profilePhotoUrl)}
            alt={otherUser.fullName}
            className="w-12 h-12 rounded-full object-cover border border-surface-300"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xl font-bold">
            {otherUser.fullName?.charAt(0) || <User size={20} />}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-bold text-primary">{otherUser.fullName}</h3>
          <p className="text-sm text-grey-400 flex items-center gap-1">
            <MapPin size={14} /> {otherUser.city || 'Location not set'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite(otherUser.id, favorite)}
          className="p-2 rounded-full hover:bg-red-50"
          aria-label={favorite ? 'Remove favorite' : 'Add favorite'}
        >
          <Heart size={20} className={favorite ? 'fill-red-500 text-red-500' : 'text-grey-400'} />
        </button>
      </div>

      <div className="mb-4 pb-4 border-b border-surface-300">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-primary">Match Score</span>
          <span className="badge badge-success">{match.matchScore}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Star size={16} className="text-yellow-400 fill-yellow-400" />
          <span className="font-semibold text-primary">{otherUser.ratingAvg?.toFixed(1) || '—'}</span>
          <span className="text-xs text-grey-400">({otherUser.totalReviews || 0} reviews)</span>
        </div>
      </div>

      {match.matchReasons?.length > 0 && (
        <div className="mb-4 p-3 bg-cream-100 rounded-lg">
          <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-2"><Lightbulb size={14} /> Why this match</p>
          <ul className="space-y-1">{match.matchReasons.slice(0, 3).map((reason) => <li key={reason} className="text-xs text-grey-600">• {reason}</li>)}</ul>
        </div>
      )}

      <div className="space-y-2 mb-4">
        <div>
          <p className="text-xs font-semibold text-grey-400 mb-1">They offer</p>
          <div className="flex flex-wrap gap-1">
            {theirSkills.offered.length > 0 ? (
              theirSkills.offered.slice(0, 3).map((s) => (
                <span key={s.id} className="badge badge-primary text-xs">{s.skill?.name || s.skillName}</span>
              ))
            ) : (
              <span className="text-xs text-grey-400">{skillsLoaded ? 'No skills listed' : 'Loading...'}</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-grey-400 mb-1">They want</p>
          <div className="flex flex-wrap gap-1">
            {theirSkills.wanted.length > 0 ? (
              theirSkills.wanted.slice(0, 3).map((s) => (
                <span key={s.id} className="badge badge-secondary text-xs">{s.skill?.name || s.skillName}</span>
              ))
            ) : (
              <span className="text-xs text-grey-400">{skillsLoaded ? 'No skills listed' : 'Loading...'}</span>
            )}
          </div>
        </div>
      </div>

      {!canRequest && skillsLoaded && (
        <p className="text-xs text-grey-400 text-center mb-2">
          {mySkills.offered.length === 0
            ? 'Add skills to your profile to send requests'
            : 'This user has no skills listed yet'}
        </p>
      )}
      <button
        onClick={() => setRequestOpen(true)}
        disabled={requesting || requested || !canRequest}
        className={`w-full py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
          requested
            ? 'bg-success/10 text-success border border-success'
            : !canRequest
            ? 'bg-surface-200 text-grey-400 cursor-not-allowed'
            : 'btn-primary'
        }`}
      >
        <MessageSquare size={18} />
        {requesting ? 'Sending...' : requested ? 'Request Sent' : !canRequest ? 'Skills Required' : 'Request Swap'}
      </button>
      {requestOpen && <RequestModal otherUser={otherUser} mySkills={mySkills} theirSkills={theirSkills} requesting={requesting} onClose={() => setRequestOpen(false)} onSubmit={handleRequest} />}
    </div>
  )
}

function RequestModal({ otherUser, mySkills, theirSkills, requesting, onClose, onSubmit }) {
  const compatible = (items, counterparts) => {
    const ids = new Set(counterparts.map((item) => item.skill?.id))
    return items.find((item) => ids.has(item.skill?.id)) || items[0]
  }
  const [form, setForm] = useState({
    senderOfferedSkillId: String(compatible(mySkills.offered, theirSkills.wanted)?.id || ''),
    senderWantedSkillId: String(compatible(mySkills.wanted, theirSkills.offered)?.id || ''),
    receiverOfferedSkillId: String(compatible(theirSkills.offered, mySkills.wanted)?.id || ''),
    receiverWantedSkillId: String(compatible(theirSkills.wanted, mySkills.offered)?.id || ''),
    preferredMode: 'ONLINE', proposedAt: '',
    message: `Hi ${otherUser.fullName}, I would like to exchange skills with you!`,
  })
  const selectOptions = (items) => items.map((item) => <option key={item.id} value={item.id}>{item.skill?.name || 'Skill'}</option>)
  const submit = (event) => { event.preventDefault(); onSubmit({ ...form, senderOfferedSkillId: Number(form.senderOfferedSkillId) || null, senderWantedSkillId: Number(form.senderWantedSkillId) || null, receiverOfferedSkillId: Number(form.receiverOfferedSkillId) || null, receiverWantedSkillId: Number(form.receiverWantedSkillId) || null, proposedAt: form.proposedAt || null }) }
  return <div className="fixed inset-0 z-[80] bg-black/50 p-4 flex items-center justify-center" role="dialog" aria-modal="true"><div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"><div className="p-5 border-b flex justify-between items-center"><div><h2 className="text-xl font-bold">Request a swap</h2><p className="text-sm text-grey-400">Create a proposal for {otherUser.fullName}</p></div><button type="button" onClick={onClose} className="p-2" aria-label="Close"><X size={20} /></button></div><form onSubmit={submit} className="p-5 space-y-4"><div className="grid sm:grid-cols-2 gap-4"><label className="text-sm font-medium">You will teach<select className="input mt-1" value={form.senderOfferedSkillId} onChange={(e) => setForm({ ...form, senderOfferedSkillId: e.target.value })}>{selectOptions(mySkills.offered)}</select></label><label className="text-sm font-medium">You want to learn<select className="input mt-1" value={form.senderWantedSkillId} onChange={(e) => setForm({ ...form, senderWantedSkillId: e.target.value })}><option value="">No preference</option>{selectOptions(mySkills.wanted)}</select></label><label className="text-sm font-medium">They will teach<select className="input mt-1" value={form.receiverOfferedSkillId} onChange={(e) => setForm({ ...form, receiverOfferedSkillId: e.target.value })}>{selectOptions(theirSkills.offered)}</select></label><label className="text-sm font-medium">They may learn<select className="input mt-1" value={form.receiverWantedSkillId} onChange={(e) => setForm({ ...form, receiverWantedSkillId: e.target.value })}><option value="">No preference</option>{selectOptions(theirSkills.wanted)}</select></label></div><div className="grid sm:grid-cols-2 gap-4"><label className="text-sm font-medium">Preferred mode<select className="input mt-1" value={form.preferredMode} onChange={(e) => setForm({ ...form, preferredMode: e.target.value })}><option value="ONLINE">Online</option><option value="OFFLINE">In person</option></select></label><label className="text-sm font-medium">Proposed time (optional)<input type="datetime-local" className="input mt-1" value={form.proposedAt} onChange={(e) => setForm({ ...form, proposedAt: e.target.value })} /></label></div><label className="text-sm font-medium block">Message<textarea className="input min-h-28 mt-1" maxLength={1000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></label><div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button disabled={requesting} className="btn-primary disabled:opacity-50">{requesting ? 'Sending…' : 'Send proposal'}</button></div></form></div></div>
}

function Spinner() {
  return (
    <div className="flex justify-center items-center min-h-96">
      <Loader className="animate-spin" size={40} />
    </div>
  )
}

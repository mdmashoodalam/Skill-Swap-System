import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client, { BASEURL } from '../api/client'
import { Loader, MessageCircle, Users, ArrowRight } from 'lucide-react'

const getPhotoUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${BASEURL}${url}`
}

export default function ChatPage() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  const currentUserId = auth?.userId ? parseInt(auth.userId) : null

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    try {
      const res = await client.get('/matches/me')
      setMatches(res.data || [])
    } catch (err) {
      console.error('Error loading matches:', err)
    } finally {
      setLoading(false)
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
        <h1 className="text-4xl font-bold text-primary mb-2">Messages</h1>
        <p className="text-grey-400">Chat with your skill swap matches</p>
      </div>

      {matches.length === 0 ? (
        <div className="card text-center py-16 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-dashed border-primary/20">
          <div className="mb-4 flex justify-center">
            <div className="bg-primary/10 p-6 rounded-full">
              <MessageCircle size={48} className="text-primary" />
            </div>
          </div>
          <p className="text-grey-600 text-lg font-semibold mb-2">No matches yet</p>
          <p className="text-grey-400 text-sm mb-6">
            Find matches to start chatting and swap skills together!
          </p>
          <button
            onClick={() => navigate('/matches')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Users size={18} />
            Find Matches Now
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const otherUser = match.user1?.id === currentUserId ? match.user2 : match.user1

            return (
              <div
                key={match.id}
                onClick={() => navigate(`/chat/${match.id}`)}
                className="card p-4 hover:shadow-lg cursor-pointer transition-all duration-200 flex items-center gap-4 bg-white border-l-4 border-l-primary/0 hover:border-l-primary"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center overflow-hidden">
                    {getPhotoUrl(otherUser?.profilePhotoUrl) ? (
                      <img
                        src={getPhotoUrl(otherUser.profilePhotoUrl)}
                        alt={otherUser?.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {otherUser?.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{otherUser?.fullName}</h3>
                  <p className="text-sm text-grey-400 flex items-center gap-2">
                    <Users size={14} className="flex-shrink-0" />
                    <span className="truncate">Match Score: {Math.round(match.matchScore || 0)}%</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {otherUser?.ratingAvg ? (
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">
                        {otherUser.ratingAvg.toFixed(1)}
                      </div>
                      <div className="text-xs text-grey-400">
                        {otherUser.reviewCount || 0} reviews
                      </div>
                    </div>
                  ) : null}
                  <MessageCircle size={22} className="text-primary opacity-50 hover:opacity-100 transition-opacity" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
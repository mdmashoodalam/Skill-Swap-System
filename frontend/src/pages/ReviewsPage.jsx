import { useState, useEffect } from 'react'
import client from '../api/client'
import { Star, Calendar, Loader } from 'lucide-react'

export default function ReviewsPage() {
  const [tab, setTab] = useState('received')
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReviews()
  }, [tab])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const endpoint = tab === 'received' ? '/reviews/me/reviews' : '/reviews/me/given'
      const [reviewsRes, meRes] = await Promise.all([
        client.get(endpoint),
        client.get('/auth/me'),
      ])
      setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : [])
      setStats({
        avgRating: meRes.data?.ratingAvg || 0,
        totalReviews: meRes.data?.totalReviews || 0,
      })
    } catch (err) {
      console.error(err)
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
        <h1 className="text-4xl font-bold text-primary mb-2">Reviews & Ratings</h1>
        <p className="text-grey-400">See what the community says about you</p>
      </div>

      {/* Rating Summary */}
      <div className="card bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-5xl font-bold text-primary">{stats?.avgRating?.toFixed(1) || '—'}</p>
            <p className="text-grey-400">out of 5.0</p>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={i < Math.round(stats?.avgRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-grey-300'}
                />
              ))}
            </div>
            <p className="text-grey-400 text-sm">{stats?.totalReviews || 0} reviews</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-300">
        {['received', 'given'].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setLoading(true); }}
            className={`px-4 py-2 font-semibold border-b-2 transition-all ${
              tab === t
                ? 'text-primary border-primary'
                : 'text-grey-400 border-transparent hover:text-primary'
            }`}
          >
            Reviews {t === 'received' ? 'Received' : 'Given'}
          </button>
        ))}
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-grey-400">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} isReceived={tab === 'received'} />
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewCard({ review, isReceived }) {
  const person = isReceived ? review.reviewer : review.reviewee
  const reviewDate = new Date(review.createdAt)

  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
          {person?.fullName?.charAt(0)}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-primary">{person?.fullName}</p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-grey-300'}
                />
              ))}
            </div>
          </div>

          <p className="text-grey-600 mb-2">{review.comment}</p>

          <div className="flex items-center gap-4 text-xs text-grey-400">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {reviewDate.toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

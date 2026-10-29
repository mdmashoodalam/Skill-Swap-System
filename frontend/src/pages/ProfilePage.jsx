import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client, { BASE_URL } from '../api/client'
import { User, MapPin, Languages, SaveIcon, AlertCircle, CheckCircle } from 'lucide-react'
import ImageCropModal from '../components/ImageCropModal'
import { getApiErrorMessage } from '../utils/apiError'

const getPhotoUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${BASE_URL}${url}`
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [user, setUserData] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    city: '',
    country: '',
    languages: '',
    availabilityText: '',
    profilePhotoUrl: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await client.get('/auth/me')
      const d = res.data
      setUserData(d)
      setFormData({
        fullName: d.fullName || '',
        bio: d.bio || '',
        city: d.city || '',
        country: d.country || '',
        languages: d.languages || '',
        availabilityText: d.availabilityText || '',
        profilePhotoUrl: d.profilePhotoUrl || '',
      })
    } catch (err) {
      console.error('Failed to load profile:', err)
      setLoadError(getApiErrorMessage(err, 'Could not load your profile.'))
    } finally {
      setLoading(false)
    }
  }

  // Step 1 — user picks file → open crop modal
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!supportedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Choose a JPEG, PNG, or WebP image.' })
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Choose an image smaller than 5 MB.' })
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result)
      setShowCropModal(true)
    }
    reader.onerror = () => setMessage({ type: 'error', text: 'Could not read that image. Please try another file.' })
    reader.readAsDataURL(file)
    e.target.value = '' // reset so same file can be re-selected
  }

  // Step 2 — user clicks Apply → upload cropped blob
  const handleCropDone = async (croppedBlob) => {
    setShowCropModal(false)
    setCropImageSrc(null)
    setPhotoUploading(true)
    setMessage('')
    try {
      const form = new FormData()
      form.append('file', croppedBlob, 'profile.jpg')
      // ✅ Do NOT manually set Content-Type for FormData - let Axios handle it
      // Manually setting it prevents the boundary parameter from being included
      const res = await client.post('/users/me/profile-photo', form)
      const photoUrl = res.data
      setFormData((prev) => ({ ...prev, profilePhotoUrl: photoUrl }))
      setUserData((prev) => ({ ...prev, profilePhotoUrl: photoUrl }))
      setUser((prev) => ({ ...prev, profilePhotoUrl: photoUrl }))
      setMessage({ type: 'success', text: 'Profile photo updated!' })
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err, 'Failed to upload photo.') })
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleCropCancel = () => {
    setShowCropModal(false)
    setCropImageSrc(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await client.put('/users/me/profile', formData)
      const d = res.data
      setUser(d)
      setUserData(d)
      setFormData({
        fullName: d.fullName || '',
        bio: d.bio || '',
        city: d.city || '',
        country: d.country || '',
        languages: d.languages || '',
        availabilityText: d.availabilityText || '',
        profilePhotoUrl: d.profilePhotoUrl || '',
      })
      navigate('/dashboard', { replace: true, state: { message: 'Profile updated successfully!' } })
    } catch (err) {
      setMessage({ type: 'error', text: getApiErrorMessage(err, 'Failed to update your profile.') })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="card max-w-2xl mx-auto text-center" role="alert">
        <AlertCircle className="mx-auto text-red-600 mb-3" size={28} />
        <p className="text-red-700 mb-4">{loadError}</p>
        <button type="button" className="btn-primary" onClick={loadProfile}>Try again</button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Crop Modal */}
      {showCropModal && cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          onCancel={handleCropCancel}
          onCropDone={handleCropDone}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-primary mb-2">Your Profile</h1>
        <p className="text-grey-400">Keep your profile up to date for better matches</p>
      </div>

      {/* Alert Message */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="text-success" size={20} />
          ) : (
            <AlertCircle className="text-red-600" size={20} />
          )}
          <span className={message.type === 'success' ? 'text-success' : 'text-red-700'}>
            {message.text}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">

        {/* Profile Photo Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-28 h-28">
            {formData.profilePhotoUrl ? (
              <img
                src={getPhotoUrl(formData.profilePhotoUrl)}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border border-surface-300"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextElementSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div
              className="w-28 h-28 rounded-full bg-surface-200 items-center justify-center text-grey-400 border border-surface-300"
              style={{ display: formData.profilePhotoUrl ? 'none' : 'flex' }}
            >
              <User size={48} />
            </div>
            {photoUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              </div>
            )}
          </div>
          <label className="btn-secondary cursor-pointer px-4 py-2 rounded text-sm mt-2">
            {photoUploading ? 'Uploading...' : 'Change Photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={photoUploading}
            />
          </label>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="profile-full-name" className="block text-sm font-medium text-primary mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-grey-400" size={20} />
              <input id="profile-full-name" type="text" className="input pl-10" value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
            </div>
          </div>
          <div>
            <label htmlFor="profile-city" className="block text-sm font-medium text-primary mb-2">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-grey-400" size={20} />
              <input id="profile-city" type="text" className="input pl-10" placeholder="Mumbai" value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            </div>
          </div>
          <div>
            <label htmlFor="profile-country" className="block text-sm font-medium text-primary mb-2">Country</label>
            <input id="profile-country" type="text" className="input" placeholder="India" value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
          </div>
          <div>
            <label htmlFor="profile-languages" className="block text-sm font-medium text-primary mb-2">Languages</label>
            <div className="relative">
              <Languages className="absolute left-3 top-3 text-grey-400" size={20} />
              <input id="profile-languages" type="text" className="input pl-10" placeholder="English, Hindi" value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: e.target.value })} />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="profile-bio" className="block text-sm font-medium text-primary mb-2">Bio</label>
          <textarea id="profile-bio" className="input resize-none" rows="4" placeholder="Tell others about yourself..."
            value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
        </div>

        <div>
          <label htmlFor="profile-availability" className="block text-sm font-medium text-primary mb-2">Availability</label>
          <input id="profile-availability" type="text" className="input" placeholder="e.g., Weekends 3-6 PM"
            value={formData.availabilityText}
            onChange={(e) => setFormData({ ...formData, availabilityText: e.target.value })} />
          <p className="text-xs text-grey-400 mt-2">Let others know when you're available</p>
        </div>

        {/* Rating Display */}
        <div className="bg-cream-200 rounded-lg p-4 border border-surface-300">
          <p className="font-semibold text-primary mb-2">Your Rating</p>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-3xl font-bold text-primary">{user?.ratingAvg?.toFixed(1) || '—'}</p>
              <p className="text-grey-400 text-sm">out of 5.0</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{user?.totalReviews || 0}</p>
              <p className="text-grey-400 text-sm">reviews</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={saving}
          className="w-full btn-primary py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
          <SaveIcon size={20} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}


import { useState } from 'react'
import { useNotifications } from '../context/NotificationContext'
import { Bell, CheckCircle, MessageSquare, Users, AlertCircle, Loader, Trash2 } from 'lucide-react'
import { getApiErrorMessage } from '../utils/apiError'

export default function NotificationsPage() {
  const [tab, setTab] = useState('all')
  const { notifications: allNotifications, loading, error, refresh, markRead, markAllRead, remove } = useNotifications()
  const [actionError, setActionError] = useState('')
  const notifications = tab === 'unread' ? allNotifications.filter((item) => !item.isRead) : allNotifications

  const handleMarkAsRead = async (id) => {
    setActionError('')
    try {
      await markRead(id)
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not mark this notification as read.'))
    }
  }

  const handleMarkAllAsRead = async () => {
    setActionError('')
    try {
      await markAllRead()
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not mark notifications as read.'))
    }
  }

  const handleDelete = async (id) => {
    setActionError('')
    try {
      await remove(id)
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not delete this notification.'))
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">Notifications</h1>
          <p className="text-grey-400">Stay updated on your skill exchanges</p>
        </div>
        {allNotifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            className="btn-secondary text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      {(error || actionError) && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
          <span className="flex items-center gap-2"><AlertCircle size={20} /> {actionError || error}</span>
          {error && !actionError && <button type="button" className="btn-secondary shrink-0" onClick={refresh}>Retry</button>}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-300">
        {['all', 'unread'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-semibold border-b-2 transition-all ${
              tab === t
                ? 'text-primary border-primary'
                : 'text-grey-400 border-transparent hover:text-primary'
            }`}
          >
            {t === 'all' ? 'All' : 'Unread'}
          </button>
        ))}
      </div>

      {/* Notifications */}
      {notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="mx-auto text-grey-400 mb-3" size={40} />
          <p className="text-grey-400">
            {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onRead={() => handleMarkAsRead(notif.id)}
              onDelete={() => handleDelete(notif.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notification, onRead, onDelete }) {
  const getIcon = (type) => {
    switch (type) {
      case 'REQUEST':
        return <MessageSquare className="text-primary" size={20} />
      case 'MATCH':
        return <Users className="text-primary" size={20} />
      case 'SESSION':
        return <AlertCircle className="text-primary" size={20} />
      case 'REVIEW':
        return <CheckCircle className="text-primary" size={20} />
      default:
        return <Bell className="text-primary" size={20} />
    }
  }

  return (
    <div
      className={`card flex items-start gap-4 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-primary/5 border-l-4 border-primary' : ''
      }`}
      onClick={!notification.isRead ? onRead : undefined}
    >
      <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-primary">{notification.title}</p>
        <p className="text-grey-600 text-sm">{notification.body}</p>
        <p className="text-xs text-grey-400 mt-2">
          {new Date(notification.createdAt).toLocaleDateString()} 
          {' at '}
          {new Date(notification.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {!notification.isRead && (
          <div className="w-2 h-2 bg-primary rounded-full"></div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-2 hover:bg-red-100 text-grey-400 hover:text-red-600 rounded transition"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

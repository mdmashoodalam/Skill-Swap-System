import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import client, { BASEURL } from '../api/client'
import { useAuth } from './AuthContext'
import { getApiErrorMessage } from '../utils/apiError'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { isAuthenticated, auth } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const socketRef = useRef(null)

  const refresh = async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError('')
    try {
      const response = await client.get('/notifications/me')
      setNotifications(Array.isArray(response.data) ? response.data : [])
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load notifications.'))
      throw requestError
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !auth.token) {
      setNotifications([])
      return
    }
    refresh().catch(() => {})

    const stomp = new Client({
      webSocketFactory: () => new SockJS(`${BASEURL}/ws`),
      connectHeaders: { Authorization: `Bearer ${auth.token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        stomp.subscribe('/user/queue/notifications', (frame) => {
          try {
            const notification = JSON.parse(frame.body)
            setNotifications((current) => current.some((item) => item.id === notification.id)
              ? current
              : [notification, ...current])
          } catch {}
        })
      },
    })
    stomp.activate()
    socketRef.current = stomp
    return () => {
      stomp.deactivate()
      socketRef.current = null
    }
  }, [isAuthenticated, auth.token])

  const markRead = async (id) => {
    await client.patch(`/notifications/${id}/read`)
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item))
  }

  const markAllRead = async () => {
    await client.patch('/notifications/me/read-all')
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
  }

  const remove = async (id) => {
    await client.delete(`/notifications/${id}`)
    setNotifications((current) => current.filter((item) => item.id !== id))
  }

  const value = useMemo(() => ({
    notifications,
    unreadCount: notifications.filter((item) => !item.isRead).length,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
    remove,
  }), [notifications, loading, error])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotifications = () => useContext(NotificationContext)

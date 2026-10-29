import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client, { BASEURL } from '../api/client'
import PermissionRequestModal from '../components/PermissionRequestModal'
import { requestMediaAccess } from '../utils/mediaPermissions'
import {
  Send,
  Loader,
  ArrowLeft,
  Phone,
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Clock,
  AlertCircle,
  Paperclip,
  Reply,
  Pencil,
  Trash2,
  CheckCheck,
  Search,
  X,
  FileText,
  Flag,
  ShieldOff
} from 'lucide-react'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
}

export default function ChatRoomPage() {
  const { auth } = useAuth()
  const { matchId: chatId } = useParams()
  const navigate = useNavigate()

  // Chat states
  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const [sendError, setSendError] = useState('')
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)
  const [messageSearch, setMessageSearch] = useState('')
  const [uploading, setUploading] = useState(false)

  // Call states
  const [callModalOpen, setCallModalOpen] = useState(false)
  const [callActive, setCallActive] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)
  const [isVideoCall, setIsVideoCall] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isStartingCall, setIsStartingCall] = useState(false)
  const [callError, setCallError] = useState('')
  const [callDuration, setCallDuration] = useState(0)

  // Permission states
  const [permissionModalOpen, setPermissionModalOpen] = useState(false)
  const [permissionErrorType, setPermissionErrorType] = useState(null)
  const [retryCallConfig, setRetryCallConfig] = useState(null)

  // Refs
  const messagesEnd = useRef(null)
  const stompClientRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const callTimerRef = useRef(null)
  const typingTimerRef = useRef(null)
  const attachmentInputRef = useRef(null)

  const currentUserId = auth?.userId ? parseInt(auth.userId) : null

  // Load messages on mount
  useEffect(() => {
    if (chatId) loadMessages()
  }, [chatId])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Setup WebSocket connection
  useEffect(() => {
    if (!chatId) return

    const token = localStorage.getItem('token')

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`${BASEURL}/ws`),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true)

        // Subscribe to chat messages
        stompClient.subscribe(`/topic/chat/${chatId}`, (frame) => {
          try {
            const msg = JSON.parse(frame.body)
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev.map((item) => item.id === msg.id ? msg : item)
              return [...prev, msg]
            })
            if (msg.sender?.id !== currentUserId) {
              client.patch(`/chats/${chatId}/read`).catch(() => {})
            }
          } catch (e) {
            console.error('Failed to parse WebSocket chat message', e)
          }
        })

        stompClient.subscribe(`/topic/chat/${chatId}/typing`, (frame) => {
          try {
            const event = JSON.parse(frame.body)
            if (event.userId !== currentUserId) setOtherTyping(Boolean(event.typing))
          } catch {}
        })

        stompClient.subscribe(`/topic/chat/${chatId}/read`, (frame) => {
          try {
            const event = JSON.parse(frame.body)
            const ids = new Set(event.messageIds || [])
            setMessages((current) => current.map((message) => ids.has(message.id) ? { ...message, isRead: true } : message))
          } catch {}
        })

        // Subscribe to call signals
        stompClient.subscribe(`/topic/call/${chatId}`, async (frame) => {
          try {
            const signal = JSON.parse(frame.body)
            if (!signal || signal.senderId === currentUserId) return

            switch (signal.type) {
              case 'offer':
                setIncomingCall(signal)
                setIsVideoCall(signal.payload?.type === 'video')
                setCallModalOpen(true)
                break

              case 'answer':
                if (peerConnectionRef.current && signal.payload?.sdp) {
                  await peerConnectionRef.current.setRemoteDescription(
                    new RTCSessionDescription(signal.payload.sdp)
                  )
                  setCallActive(true)
                }
                break

              case 'ice-candidate':
                if (peerConnectionRef.current && signal.payload?.candidate) {
                  try {
                    await peerConnectionRef.current.addIceCandidate(
                      new RTCIceCandidate(signal.payload.candidate)
                    )
                  } catch (err) {
                    console.error('Error adding ICE candidate', err)
                  }
                }
                break

              case 'end-call':
                cleanupCall()
                break

              case 'reject-call':
                setCallError('Call was rejected.')
                cleanupCall(false)
                break

              default:
                break
            }
          } catch (e) {
            console.error('Failed to parse WebSocket call signal', e)
          }
        })
      },
      onDisconnect: () => {
        setConnected(false)
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame)
        setConnected(false)
      }
    })

    stompClient.activate()
    stompClientRef.current = stompClient

    return () => {
      stompClient.deactivate()
      stompClientRef.current = null
      cleanupCall(false)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [chatId, currentUserId])

  // Call duration timer
  useEffect(() => {
    if (callActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
      setCallDuration(0)
    }

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
    }
  }, [callActive])

  // Helper: Load messages from API
  const loadMessages = async () => {
    try {
      const res = await client.get(`/chats/${chatId}/messages`)
      const data = res.data || []
      setMessages(data)

      const other = data.find((m) => m.sender?.id !== currentUserId)?.sender || null
      setAvatarFailed(false)
      setOtherUser(other)

      if (!other) {
        await fetchOtherUserFromMatch()
      }
    } catch (err) {
      console.error('Failed to load messages', err)
    } finally {
      setLoading(false)
    }
  }

  // Helper: Fetch other user from match
  const fetchOtherUserFromMatch = async () => {
    try {
      const res = await client.get(`/matches/${chatId}`)
      const match = res.data
      const other = match.user1?.id === currentUserId ? match.user2 : match.user1
      setAvatarFailed(false)
      setOtherUser(other)
    } catch (err) {
      console.error('Failed to load match info', err)
    }
  }

  // Helper: Get photo URL
  const getPhotoUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `${BASEURL}${url}`
  }

  // Helper: Format call duration
  const formatCallDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // WebSocket: Publish signal
  const publishSignal = (type, payload = {}) => {
    if (!stompClientRef.current?.connected) return
    stompClientRef.current.publish({
      destination: `/app/call/${chatId}/signal`,
      body: JSON.stringify({
        type,
        senderId: currentUserId,
        targetUserId: otherUser?.id || null,
        payload
      })
    })
  }

  const publishTyping = (typing) => {
    if (!stompClientRef.current?.connected) return
    stompClientRef.current.publish({
      destination: `/app/chat/${chatId}/typing`,
      body: JSON.stringify({ typing }),
    })
  }

  const handleTyping = (value) => {
    setNewMessage(value)
    publishTyping(Boolean(value.trim()))
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => publishTyping(false), 1200)
  }

  // WebRTC: Create peer connection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        publishSignal('ice-candidate', {
          candidate: event.candidate
        })
      }
    }

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream
      }
    }

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      if (state === 'connected') {
        setCallActive(true)
        setCallError('')
      }
      if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        cleanupCall(false)
      }
    }

    return pc
  }

  // Media: Request access to camera/microphone
  const ensureLocalMedia = async (videoEnabled) => {
    try {
      const result = await requestMediaAccess({
        audio: true,
        video: videoEnabled
      })

      if (!result.success) {
        const errorType = result.error.type
        console.error('Media access error:', result.error.message)
        setCallError(result.error.message)
        setPermissionErrorType(errorType)
        setPermissionModalOpen(true)
        throw result.error
      }

      const stream = result.stream
      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      return stream
    } catch (err) {
      console.error('Failed to get media access', err)
      throw err
    }
  }

  // Call: Start outgoing call
  const startCall = async (video = true) => {
    if (!currentUserId || !otherUser?.id) {
      setCallError('Other user not loaded yet.')
      return
    }

    setCallError('')
    setIncomingCall(null)
    setIsVideoCall(video)
    setCallModalOpen(true)
    setIsStartingCall(true)
    setRetryCallConfig({ video })

    try {
      const stream = await ensureLocalMedia(video)
      const pc = createPeerConnection()
      peerConnectionRef.current = pc

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      publishSignal('offer', {
        type: video ? 'video' : 'audio',
        sdp: offer
      })
    } catch (err) {
      console.error('Failed to start call', err)
      if (err.name !== 'NotAllowedError') {
        setCallError('Could not start call. Please try again.')
      }
      cleanupCall(false)
    } finally {
      setIsStartingCall(false)
    }
  }

  // Call: Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return

    setCallError('')

    try {
      const incomingIsVideo = incomingCall.payload?.type === 'video'
      setIsVideoCall(incomingIsVideo)

      const stream = await ensureLocalMedia(incomingIsVideo)
      const pc = createPeerConnection()
      peerConnectionRef.current = pc

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.payload.sdp)
      )

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      publishSignal('answer', { sdp: answer })
      setIncomingCall(null)
      setCallActive(true)
    } catch (err) {
      console.error('Failed to accept call', err)
      setCallError('Could not accept call.')
      cleanupCall(false)
    }
  }

  // Call: Reject incoming call
  const rejectCall = () => {
    publishSignal('reject-call', {})
    cleanupCall(false)
  }

  // Call: End active call
  const endCall = () => {
    publishSignal('end-call', {})
    cleanupCall(true)
  }

  // Call: Cleanup
  const cleanupCall = (closeModal = true) => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close()
      } catch {}
      peerConnectionRef.current = null
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null

    setCallActive(false)
    setIncomingCall(null)
    setIsMuted(false)
    setIsCameraOff(false)
    setIsStartingCall(false)
    setCallDuration(0)

    if (closeModal) {
      setCallModalOpen(false)
    }
  }

  // Call: Retry after permission error
  const handlePermissionRetry = async () => {
    setPermissionModalOpen(false)
    if (retryCallConfig) {
      await startCall(retryCallConfig.video)
    }
  }

  // Audio/Video: Toggle mute
  const toggleMute = () => {
    const stream = localStreamRef.current
    if (!stream) return

    const nextMuted = !isMuted
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted
    })
    setIsMuted(nextMuted)
  }

  // Audio/Video: Toggle camera
  const toggleCamera = () => {
    const stream = localStreamRef.current
    if (!stream) return

    const videoTracks = stream.getVideoTracks()
    if (!videoTracks.length) return

    const nextCameraOff = !isCameraOff
    videoTracks.forEach((track) => {
      track.enabled = !nextCameraOff
    })
    setIsCameraOff(nextCameraOff)
  }

  // Chat: Send message
  const handleSend = async (e) => {
    e.preventDefault()
    setSendError('')

    if (!newMessage.trim() || sending) return

    if (!currentUserId) {
      setSendError('Session expired. Please log in again.')
      return
    }

    setSending(true)
    try {
      if (editingMessage) {
        await client.patch(`/chats/${chatId}/messages/${editingMessage.id}`, { content: newMessage })
      } else {
        await client.post(`/chats/${chatId}/messages`, {
          content: newMessage,
          replyToId: replyTo?.id || null,
        })
      }
      setNewMessage('')
      setReplyTo(null)
      setEditingMessage(null)
      publishTyping(false)
    } catch (err) {
      console.error('Failed to send message', err)
      setSendError('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const startEditing = (message) => {
    if (message.deleted || message.messageType !== 'TEXT') return
    setEditingMessage(message)
    setReplyTo(null)
    setNewMessage(message.content || '')
  }

  const deleteMessage = async (message) => {
    if (!window.confirm('Delete this message?')) return
    try {
      await client.delete(`/chats/${chatId}/messages/${message.id}`)
    } catch (err) {
      setSendError(err.response?.data?.error || 'Unable to delete this message.')
    }
  }

  const uploadAttachment = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setSendError('')
    try {
      const form = new FormData()
      form.append('file', file)
      if (newMessage.trim()) form.append('caption', newMessage.trim())
      if (replyTo?.id) form.append('replyToId', String(replyTo.id))
      await client.post(`/chats/${chatId}/attachments`, form)
      setNewMessage('')
      setReplyTo(null)
    } catch (err) {
      setSendError(err.response?.data?.error || 'Unable to upload this attachment.')
    } finally {
      setUploading(false)
    }
  }

  const reportUser = async () => {
    const reason = window.prompt('Why are you reporting this user?')
    if (!reason?.trim() || !otherUser?.id) return
    try {
      await client.post('/community/reports', { reportedUserId: otherUser.id, reason: reason.trim(), details: `Reported from match ${chatId}` })
      setSendError('Report submitted. An administrator will review it.')
    } catch (err) { setSendError(err.response?.data?.error || 'Unable to submit this report.') }
  }

  const blockUser = async () => {
    if (!otherUser?.id || !window.confirm(`Block ${otherUser.fullName}? You will no longer be able to message each other.`)) return
    try {
      await client.post(`/community/blocks/${otherUser.id}`)
      navigate('/chat')
    } catch (err) { setSendError(err.response?.data?.error || 'Unable to block this user.') }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Loader className="animate-spin text-primary" size={40} />
      </div>
    )
  }

  const visibleMessages = messages.filter((message) => {
    const query = messageSearch.trim().toLowerCase()
    return !query || message.content?.toLowerCase().includes(query)
      || message.attachmentName?.toLowerCase().includes(query)
      || message.sender?.fullName?.toLowerCase().includes(query)
  })

  return (
    <>
      <div className="flex flex-col card p-0 rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 flex items-center gap-3 shadow-lg">
          <button
            onClick={() => navigate('/chat')}
            className="hover:bg-white/20 p-2 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>

          {otherUser?.profilePhotoUrl && !avatarFailed ? (
            <img
              src={getPhotoUrl(otherUser.profilePhotoUrl)}
              alt={otherUser?.fullName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-white text-lg">
              {otherUser?.fullName?.charAt(0) ?? '?'}
            </div>
          )}

          <div className="flex-1">
            <p className="font-bold">{otherUser?.fullName ?? 'Loading...'}</p>
            <div className="flex items-center gap-1 text-xs text-white/70">
              <span className={`w-2 h-2 rounded-full inline-block ${connected ? 'bg-green-400' : 'bg-orange-400'}`}></span>
              {connected ? 'Online' : 'Connecting...'}
            </div>
          </div>

          <button
            onClick={() => startCall(false)}
            className="p-2 rounded-lg hover:bg-white/20 transition"
            title="Audio call"
          >
            <Phone size={20} />
          </button>

          <button
            onClick={() => startCall(true)}
            className="p-2 rounded-lg hover:bg-white/20 transition"
            title="Video call"
          >
            <Video size={20} />
          </button>
          <button onClick={reportUser} className="p-2 rounded-lg hover:bg-white/20" title="Report user"><Flag size={19} /></button>
          <button onClick={blockUser} className="p-2 rounded-lg hover:bg-white/20" title="Block user"><ShieldOff size={19} /></button>
        </div>

        <div className="px-4 py-2 border-b bg-white">
          <label className="relative block">
            <Search size={16} className="absolute left-3 top-2.5 text-grey-400" />
            <input value={messageSearch} onChange={(e) => setMessageSearch(e.target.value)} className="input py-1.5 pl-9 text-sm" placeholder="Search this conversation" />
          </label>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: '#faf9f6' }}>
          {visibleMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="text-5xl mb-4">💬</div>
              <p className="font-medium text-gray-500">No messages yet</p>
              <p className="text-sm mt-1 text-gray-400">Say hi to start the conversation!</p>
            </div>
          ) : (
            visibleMessages.map((msg) => {
              const isOwn = msg.sender?.id === currentUserId

              return (
                <div key={msg.id} className={`group flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                      isOwn
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                    }`}
                  >
                    {msg.replyTo && <div className={`text-xs p-2 mb-2 rounded border-l-2 ${isOwn ? 'bg-white/10 border-white/60' : 'bg-gray-50 border-primary'}`}><strong>{msg.replyTo.senderName}</strong><p className="truncate opacity-80">{msg.replyTo.content || 'Attachment'}</p></div>}
                    {msg.deleted ? <p className="text-sm italic opacity-70">Message deleted</p> : <>
                      {msg.messageType === 'IMAGE' && msg.attachmentUrl && <a href={getPhotoUrl(msg.attachmentUrl)} target="_blank" rel="noopener noreferrer"><img src={getPhotoUrl(msg.attachmentUrl)} alt={msg.attachmentName || 'Shared image'} className="max-h-64 rounded-lg mb-2 object-cover" /></a>}
                      {msg.messageType === 'FILE' && msg.attachmentUrl && <a href={getPhotoUrl(msg.attachmentUrl)} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 rounded-lg mb-2 ${isOwn ? 'bg-white/10 text-white' : 'bg-gray-50'}`}><FileText size={20} /><span className="truncate">{msg.attachmentName || 'Download file'}</span></a>}
                      {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>}
                    </>}
                    <p className={`text-xs mt-1 flex items-center justify-end gap-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {msg.editedAt && <span>· edited</span>}
                      {isOwn && <CheckCheck size={14} className={msg.isRead ? 'text-sky-200' : ''} />}
                    </p>
                    {!msg.deleted && <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'}`}><button type="button" onClick={() => setReplyTo(msg)} className="p-1.5 rounded-full bg-white shadow text-gray-600" title="Reply"><Reply size={14} /></button>{isOwn && msg.messageType === 'TEXT' && <button type="button" onClick={() => startEditing(msg)} className="p-1.5 rounded-full bg-white shadow text-gray-600" title="Edit"><Pencil size={14} /></button>}{isOwn && <button type="button" onClick={() => deleteMessage(msg)} className="p-1.5 rounded-full bg-white shadow text-red-600" title="Delete"><Trash2 size={14} /></button>}</div>}
                  </div>
                </div>
              )
            })
          )}

          {otherTyping && <div className="text-xs text-grey-400 px-2">{otherUser?.fullName || 'They'} is typing…</div>}
          <div ref={messagesEnd}></div>
        </div>

        {/* Error message */}
        {sendError && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-600 text-sm">
            {sendError}
          </div>
        )}

        {(replyTo || editingMessage) && <div className="px-4 py-2 border-t bg-cream-100 flex items-center justify-between text-sm"><div><strong>{editingMessage ? 'Editing message' : `Replying to ${replyTo?.sender?.fullName}`}</strong><p className="text-grey-600 truncate max-w-lg">{(editingMessage || replyTo)?.content || (replyTo?.attachmentName ?? 'Attachment')}</p></div><button type="button" onClick={() => { setReplyTo(null); setEditingMessage(null); setNewMessage('') }} className="p-1" aria-label="Cancel"><X size={18} /></button></div>}

        {/* Message input */}
        <form onSubmit={handleSend} className="border-t border-surface-300 p-4 flex gap-2 bg-white">
          <input ref={attachmentInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" onChange={uploadAttachment} />
          <button type="button" onClick={() => attachmentInputRef.current?.click()} disabled={uploading} className="btn-secondary p-3" title="Attach a file">{uploading ? <Loader size={20} className="animate-spin" /> : <Paperclip size={20} />}</button>
          <input
            type="text"
            placeholder="Type a message..."
            className="input flex-1"
            value={newMessage}
            onChange={(e) => {
              handleTyping(e.target.value)
              if (sendError) setSendError('')
            }}
            onBlur={() => publishTyping(false)}
            disabled={sending}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="btn-primary p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
            title={editingMessage ? 'Save edit' : 'Send'}
          >
            {sending ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>

      {/* Call Modal - IMPROVED UI */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden">
            {/* Call Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {incomingCall && !callActive
                    ? `📞 Incoming ${isVideoCall ? 'Video' : 'Audio'} Call`
                    : callActive
                    ? `🔴 ${isVideoCall ? 'Video' : 'Audio'} Call Active`
                    : `⏳ Initiating ${isVideoCall ? 'Video' : 'Audio'} Call...`}
                </h2>
                <p className="text-white/80 text-sm mt-1">{otherUser?.fullName}</p>
              </div>

              {callActive && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                  <Clock size={16} />
                  <span className="font-mono font-semibold">{formatCallDuration(callDuration)}</span>
                </div>
              )}
            </div>

            {/* Video/Audio containers */}
            <div className={`bg-black p-4 grid gap-4 ${isVideoCall ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Local stream */}
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 min-h-[300px] flex items-center justify-center">
                {isVideoCall ? (
                  <>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      You
                    </div>
                  </>
                ) : (
                  <div className="text-white text-center space-y-3">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/50 rounded-full flex items-center justify-center animate-pulse">
                      <Mic size={40} />
                    </div>
                    <p className="font-semibold">Your Audio</p>
                    <p className="text-sm text-gray-400">Microphone is active</p>
                  </div>
                )}
              </div>

              {/* Remote stream */}
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 min-h-[300px] flex items-center justify-center">
                {isVideoCall ? (
                  <>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      {otherUser?.fullName?.split(' ')[0] || 'Guest'}
                    </div>
                  </>
                ) : (
                  <div className="text-white text-center space-y-3">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
                      <Mic size={40} />
                    </div>
                    <p className="font-semibold">{otherUser?.fullName || 'Remote User'}</p>
                    <p className="text-sm text-gray-400">Connected</p>
                  </div>
                )}
              </div>
            </div>

            {/* Call error */}
            {callError && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
                <AlertCircle size={16} />
                {callError}
              </div>
            )}

            {/* Call controls */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-t">
              <div className="flex flex-wrap gap-3 justify-center">
                {incomingCall && !callActive ? (
                  <>
                    <button
                      onClick={acceptCall}
                      className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold transition transform hover:scale-105 shadow-lg"
                    >
                      <Phone size={20} />
                      Accept Call
                    </button>
                    <button
                      onClick={rejectCall}
                      className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition transform hover:scale-105 shadow-lg"
                    >
                      <PhoneOff size={20} />
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={toggleMute}
                      className={`flex items-center justify-center w-14 h-14 rounded-full font-semibold transition transform hover:scale-110 shadow-lg ${
                        isMuted
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    {isVideoCall && (
                      <button
                        onClick={toggleCamera}
                        className={`flex items-center justify-center w-14 h-14 rounded-full font-semibold transition transform hover:scale-110 shadow-lg ${
                          isCameraOff
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                        title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
                      >
                        {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                      </button>
                    )}

                    <button
                      onClick={endCall}
                      disabled={isStartingCall}
                      className="flex items-center justify-center w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition transform hover:scale-110 shadow-lg disabled:opacity-50"
                      title="End call"
                    >
                      <PhoneOff size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      <PermissionRequestModal
        isOpen={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        onRetry={handlePermissionRetry}
        errorType={permissionErrorType}
        deviceType="camera/microphone"
      />
    </>
  )
}

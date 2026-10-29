import { useCallback, useEffect, useRef, useState } from 'react'
import { requestMediaAccess } from '../utils/mediaPermissions'

const configuredIceServers = (() => {
  try {
    return import.meta.env.VITE_ICE_SERVERS
      ? JSON.parse(import.meta.env.VITE_ICE_SERVERS)
      : [{ urls: 'stun:stun.l.google.com:19302' }]
  } catch {
    console.warn('VITE_ICE_SERVERS is invalid JSON; using the default STUN server')
    return [{ urls: 'stun:stun.l.google.com:19302' }]
  }
})()

const RTC_CONFIG = {
  iceServers: configuredIceServers,
  iceCandidatePoolSize: 10
}

export default function useWebRTC({
  matchId,
  currentUserId,
  otherUserId,
  onSignal,
  onIncomingCallStateChange
}) {
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteStreamRef = useRef(null)
  const pendingIceCandidatesRef = useRef([])
  const pendingOfferRef = useRef(null)

  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [callState, setCallState] = useState('idle')
  const [callType, setCallType] = useState('video')
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [error, setError] = useState('')
  const [mediaError, setMediaError] = useState(null)
  const [permissionErrorType, setPermissionErrorType] = useState(null)

  const safeEmitSignal = useCallback((payload) => {
    if (!payload || !matchId || !currentUserId || !onSignal) return

    onSignal({
      matchId: Number(matchId),
      fromUserId: currentUserId,
      toUserId: payload.toUserId ?? otherUserId ?? null,
      ...payload
    })
  }, [matchId, currentUserId, otherUserId, onSignal])

  const cleanupMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop())
      remoteStreamRef.current = null
    }

    setLocalStream(null)
    setRemoteStream(null)
  }, [])

  const cleanupPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null
      peerConnectionRef.current.onicecandidate = null
      peerConnectionRef.current.onconnectionstatechange = null
      peerConnectionRef.current.oniceconnectionstatechange = null
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    pendingIceCandidatesRef.current = []
    pendingOfferRef.current = null
  }, [])

  const fullCleanup = useCallback(() => {
    cleanupPeerConnection()
    cleanupMedia()
    setCallState('idle')
    setCallType('video')
    setIsMuted(false)
    setIsCameraOff(false)
    setMediaError(null)
    setPermissionErrorType(null)
    onIncomingCallStateChange?.(null)
  }, [cleanupPeerConnection, cleanupMedia, onIncomingCallStateChange])

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current

    const pc = new RTCPeerConnection(RTC_CONFIG)

    remoteStreamRef.current = new MediaStream()
    setRemoteStream(remoteStreamRef.current)

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        remoteStreamRef.current.addTrack(track)
      })
      setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()))
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        safeEmitSignal({
          type: 'ICE_CANDIDATE',
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        })
      }
    }

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      if (state === 'connected') {
        setCallState('connected')
        setError('')
      } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        fullCleanup()
      }
    }

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        fullCleanup()
      }
    }

    peerConnectionRef.current = pc
    return pc
  }, [safeEmitSignal, fullCleanup])

  const ensureLocalMedia = useCallback(async (videoEnabled = true) => {
    if (localStreamRef.current) return localStreamRef.current

    try {
      setMediaError(null)
      setPermissionErrorType(null)
      setError('')

      const result = await requestMediaAccess({
        audio: true,
        video: videoEnabled
      })

      if (!result.success) {
        const errorMsg = result.error.message
        const errorType = result.error.type
        console.error('Failed to access media devices', errorMsg)
        setError(errorMsg)
        setMediaError({
          message: errorMsg,
          type: errorType,
          originalError: result.error.originalError
        })
        setPermissionErrorType(errorType)
        throw new Error(errorMsg)
      }

      const stream = result.stream
      localStreamRef.current = stream
      setLocalStream(stream)
      setCallType(videoEnabled ? 'video' : 'audio')
      setIsMuted(false)
      setIsCameraOff(!videoEnabled)

      return stream
    } catch (err) {
      console.error('Failed to access media devices', err)
      throw err
    }
  }, [])

  const attachLocalTracks = useCallback(async (pc, stream) => {
    const existingTrackIds = new Set(
      pc.getSenders().map(sender => sender.track?.id).filter(Boolean)
    )

    stream.getTracks().forEach(track => {
      if (!existingTrackIds.has(track.id)) {
        pc.addTrack(track, stream)
      }
    })
  }, [])

  const flushPendingIceCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current
    if (!pc || !pc.remoteDescription) return

    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift()
      try {
        await pc.addIceCandidate(candidate)
      } catch (err) {
        console.error('Failed to add buffered ICE candidate', err)
      }
    }
  }, [])

  const startCall = useCallback(async ({ videoEnabled = true, toUserId } = {}) => {
    try {
      setError('')
      setCallType(videoEnabled ? 'video' : 'audio')
      setCallState('outgoing')

      const pc = createPeerConnection()
      const stream = await ensureLocalMedia(videoEnabled)
      await attachLocalTracks(pc, stream)

      safeEmitSignal({
        type: 'CALL_INVITE',
        toUserId,
        videoEnabled
      })
    } catch (err) {
      fullCleanup()
    }
  }, [createPeerConnection, ensureLocalMedia, attachLocalTracks, safeEmitSignal, fullCleanup])

  const acceptCall = useCallback(async ({ videoEnabled = true, toUserId } = {}) => {
    try {
      setError('')
      setCallType(videoEnabled ? 'video' : 'audio')
      setCallState('connecting')

      const pc = createPeerConnection()
      const stream = await ensureLocalMedia(videoEnabled)
      await attachLocalTracks(pc, stream)

      safeEmitSignal({
        type: 'CALL_ACCEPT',
        toUserId,
        videoEnabled
      })

      if (pendingOfferRef.current) {
        const offerSignal = pendingOfferRef.current
        pendingOfferRef.current = null

        await pc.setRemoteDescription(new RTCSessionDescription({
          type: 'offer',
          sdp: offerSignal.sdp
        }))

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        safeEmitSignal({
          type: 'ANSWER',
          toUserId: offerSignal.fromUserId,
          sdp: answer.sdp,
          videoEnabled
        })

        await flushPendingIceCandidates()
      }
    } catch (err) {
      console.error('Failed to accept call', err)
      setError('Failed to accept call')
      fullCleanup()
    }
  }, [createPeerConnection, ensureLocalMedia, attachLocalTracks, safeEmitSignal, flushPendingIceCandidates, fullCleanup])

  const rejectCall = useCallback((toUserId) => {
    safeEmitSignal({
      type: 'CALL_REJECT',
      toUserId,
      message: 'Call rejected'
    })
    fullCleanup()
  }, [safeEmitSignal, fullCleanup])

  const hangUp = useCallback((toUserId) => {
    safeEmitSignal({
      type: 'HANGUP',
      toUserId,
      message: 'Call ended'
    })
    fullCleanup()
  }, [safeEmitSignal, fullCleanup])

  const makeOffer = useCallback(async (toUserId) => {
    try {
      const pc = createPeerConnection()
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video'
      })

      await pc.setLocalDescription(offer)

      safeEmitSignal({
        type: 'OFFER',
        toUserId,
        sdp: offer.sdp,
        videoEnabled: callType === 'video'
      })
    } catch (err) {
      console.error('Failed to create offer', err)
      setError('Failed to create offer')
      fullCleanup()
    }
  }, [createPeerConnection, safeEmitSignal, fullCleanup, callType])

  const handleOffer = useCallback(async (signal) => {
    pendingOfferRef.current = signal
    setCallType(signal?.videoEnabled === false ? 'audio' : 'video')
  }, [])

  const handleAnswer = useCallback(async (signal) => {
    try {
      const pc = peerConnectionRef.current
      if (!pc) return

      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: signal.sdp
      }))

      await flushPendingIceCandidates()
    } catch (err) {
      console.error('Failed to handle answer', err)
      setError('Failed to process answer')
      fullCleanup()
    }
  }, [flushPendingIceCandidates, fullCleanup])

  const handleIceCandidate = useCallback(async (signal) => {
    try {
      const candidate = new RTCIceCandidate({
        candidate: signal.candidate,
        sdpMid: signal.sdpMid,
        sdpMLineIndex: signal.sdpMLineIndex
      })

      const pc = peerConnectionRef.current
      if (!pc || !pc.remoteDescription) {
        pendingIceCandidatesRef.current.push(candidate)
        return
      }

      await pc.addIceCandidate(candidate)
    } catch (err) {
      console.error('Failed to add ICE candidate', err)
    }
  }, [])

  const handleSignal = useCallback(async (signal) => {
    if (!signal || !signal.type) return
    if (signal.fromUserId === currentUserId) return

    switch (signal.type) {
      case 'CALL_INVITE':
        setError('')
        setCallState('ringing')
        setCallType(signal.videoEnabled === false ? 'audio' : 'video')
        onIncomingCallStateChange?.(signal)
        break

      case 'CALL_ACCEPT':
        setCallState('connecting')
        onIncomingCallStateChange?.(null)
        await makeOffer(signal.fromUserId)
        break

      case 'CALL_REJECT':
        setError('Call rejected')
        fullCleanup()
        break

      case 'BUSY':
        setError(signal.message || 'User is busy on another call')
        fullCleanup()
        break

      case 'OFFER':
        await handleOffer(signal)
        break

      case 'ANSWER':
        await handleAnswer(signal)
        break

      case 'ICE_CANDIDATE':
        await handleIceCandidate(signal)
        break

      case 'HANGUP':
        fullCleanup()
        break

      default:
        break
    }
  }, [
    currentUserId,
    makeOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    fullCleanup,
    onIncomingCallStateChange
  ])

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return

    const audioTracks = stream.getAudioTracks()
    if (!audioTracks.length) return

    const nextMuted = !isMuted
    audioTracks.forEach(track => {
      track.enabled = !nextMuted
    })
    setIsMuted(nextMuted)
  }, [isMuted])

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return

    const videoTracks = stream.getVideoTracks()
    if (!videoTracks.length) return

    const nextCameraOff = !isCameraOff
    videoTracks.forEach(track => {
      track.enabled = !nextCameraOff
    })
    setIsCameraOff(nextCameraOff)
  }, [isCameraOff])

  useEffect(() => {
    return () => {
      fullCleanup()
    }
  }, [fullCleanup])

  return {
    localStream,
    remoteStream,
    callState,
    callType,
    isMuted,
    isCameraOff,
    error,
    mediaError,
    permissionErrorType,
    startCall,
    acceptCall,
    rejectCall,
    hangUp,
    handleSignal,
    toggleMute,
    toggleCamera,
    ensureLocalMedia
  }
}

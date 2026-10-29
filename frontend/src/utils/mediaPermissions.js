/**
 * Media Permissions Utility
 * Handles camera and microphone permission requests with proper error handling
 */

export const PERMISSION_STATES = {
  GRANTED: 'granted',
  DENIED: 'denied',
  PROMPT: 'prompt',
  UNKNOWN: 'unknown'
}

/**
 * Check if browser supports the Permissions API
 */
export const supportsPermissionsAPI = () => {
  return navigator && navigator.permissions && navigator.permissions.query
}

/**
 * Get the current permission status for a device type
 * @param {string} deviceType - 'camera' or 'microphone'
 * @returns {Promise<string>} - One of PERMISSION_STATES
 */
export const getPermissionStatus = async (deviceType) => {
  if (!supportsPermissionsAPI()) {
    return PERMISSION_STATES.UNKNOWN
  }

  try {
    const permissionName = deviceType === 'camera' ? 'camera' : 'microphone'
    const permission = await navigator.permissions.query({ name: permissionName })
    return permission.state
  } catch (err) {
    console.warn(`Could not query ${deviceType} permission:`, err)
    return PERMISSION_STATES.UNKNOWN
  }
}

/**
 * Request media access with proper error handling
 * @param {Object} constraints - { audio: boolean, video: boolean }
 * @returns {Promise<MediaStream>} - The media stream
 */
export const requestMediaAccess = async (constraints) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    return {
      success: true,
      stream,
      error: null
    }
  } catch (err) {
    console.error('Media access error:', err)

    let errorMessage = 'Could not access media devices'
    let errorType = 'UNKNOWN_ERROR'
    let needsPermission = false

    if (err.name === 'NotAllowedError') {
      errorType = 'PERMISSION_DENIED'
      errorMessage = 'You denied permission to access camera/microphone'
      needsPermission = true
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorType = 'NO_DEVICES_FOUND'
      errorMessage = 'No camera or microphone found on your device'
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      errorType = 'DEVICE_IN_USE'
      errorMessage = 'Camera/Microphone is being used by another application'
    } else if (err.name === 'SecurityError') {
      errorType = 'SECURITY_ERROR'
      errorMessage = 'Cannot access media in insecure context (use HTTPS)'
    } else if (err.name === 'TypeError') {
      errorType = 'INVALID_CONSTRAINTS'
      errorMessage = 'Invalid media constraints'
    }

    return {
      success: false,
      stream: null,
      error: {
        message: errorMessage,
        type: errorType,
        originalError: err,
        needsPermission
      }
    }
  }
}

/**
 * Get detailed device information
 * @returns {Promise<Object>} - Device details
 */
export const getDeviceInfo = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioDevices = devices.filter(device => device.kind === 'audioinput')
    const videoDevices = devices.filter(device => device.kind === 'videoinput')

    return {
      hasAudio: audioDevices.length > 0,
      hasVideo: videoDevices.length > 0,
      audioDevices: audioDevices.length,
      videoDevices: videoDevices.length,
      devices
    }
  } catch (err) {
    console.error('Failed to enumerate devices:', err)
    return {
      hasAudio: false,
      hasVideo: false,
      audioDevices: 0,
      videoDevices: 0,
      devices: []
    }
  }
}

/**
 * Get a user-friendly permission request URL or instructions
 * @returns {Object} - Instructions for the user
 */
export const getPermissionInstructions = () => {
  const ua = navigator.userAgent.toLowerCase()
  let browser = 'Browser'

  if (ua.includes('chrome')) browser = 'Chrome'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('safari')) browser = 'Safari'
  else if (ua.includes('edge')) browser = 'Edge'

  const instructions = {
    Chrome: [
      'Click the lock icon in the address bar',
      'Find "Camera" or "Microphone" in the dropdown',
      'Change the setting to "Allow"',
      'Refresh the page'
    ],
    Firefox: [
      'Click the information icon (i) in the address bar',
      'Click the dropdown arrow next to "Camera" or "Microphone"',
      'Select "Allow"',
      'Refresh the page'
    ],
    Safari: [
      'Go to Safari > Settings',
      'Click the "Websites" tab',
      'Select "Camera" or "Microphone" from the left menu',
      'Change the setting to "Allow"'
    ],
    Edge: [
      'Click the lock icon in the address bar',
      'Find "Camera" or "Microphone" in the dropdown',
      'Change the setting to "Allow"',
      'Refresh the page'
    ]
  }

  return {
    browser,
    instructions: instructions[browser] || instructions.Chrome
  }
}

/**
 * Try to get partial media access
 * If video fails, try audio only
 * @returns {Promise<Object>}
 */
export const requestPartialMediaAccess = async () => {
  // Try with both audio and video
  let result = await requestMediaAccess({ audio: true, video: true })
  if (result.success) return result

  // If both failed, try audio only
  console.log('Video failed, attempting audio only...')
  result = await requestMediaAccess({ audio: true, video: false })
  if (result.success) {
    result.audioOnly = true
    return result
  }

  // If audio failed too, return the original error
  return result
}

/**
 * Check if microphone permission is granted
 */
export const isMicrophoneAllowed = async () => {
  const status = await getPermissionStatus('microphone')
  return status === PERMISSION_STATES.GRANTED
}

/**
 * Check if camera permission is granted
 */
export const isCameraAllowed = async () => {
  const status = await getPermissionStatus('camera')
  return status === PERMISSION_STATES.GRANTED
}

# Voice & Video Call Improvements Documentation

## Overview

The skill-swap-platform has been enhanced with comprehensive media permission handling and error management for voice and video calls. These improvements ensure users have a smooth experience when accessing camera and microphone resources.

## What's New

### 1. **Media Permissions Utility** (`src/utils/mediaPermissions.js`)

A new utility module that provides robust permission management:

#### Key Features:
- **Permission Status Checking**: Check if permissions are granted, denied, or pending
- **Device Detection**: Detect available microphones and cameras
- **Error Classification**: Categorize different types of media access errors
- **Browser-Specific Instructions**: Provide OS/browser-specific permission steps

#### Available Functions:

```javascript
// Check permission status
const status = await getPermissionStatus('camera'); // Returns: 'granted', 'denied', 'prompt', 'unknown'

// Request media access with error handling
const result = await requestMediaAccess({ audio: true, video: true });
if (result.success) {
  const stream = result.stream;
} else {
  const error = result.error; // Contains detailed error info
  console.log(error.type); // PERMISSION_DENIED, NO_DEVICES_FOUND, DEVICE_IN_USE, etc.
}

// Get device information
const deviceInfo = await getDeviceInfo();
console.log(deviceInfo.hasAudio, deviceInfo.hasVideo);

// Get permission instructions for user
const { browser, instructions } = getPermissionInstructions();
```

### 2. **Permission Request Modal** (`src/components/PermissionRequestModal.jsx`)

A user-friendly modal component that handles different permission error scenarios:

#### Features:
- **Error-Specific Messages**: Different messages for different error types
- **Step-by-Step Instructions**: Browser-specific instructions to enable permissions
- **Retry Functionality**: Allow users to retry after fixing permissions
- **Visual Clarity**: Color-coded alerts and icons for different error types

#### Error Types Handled:
- `PERMISSION_DENIED`: User explicitly denied permission
- `NO_DEVICES_FOUND`: No camera/microphone available
- `DEVICE_IN_USE`: Device is being used by another app
- `SECURITY_ERROR`: HTTPS required
- `INVALID_CONSTRAINTS`: Invalid media constraints

### 3. **Enhanced useWebRTC Hook** (`src/hooks/useWebRTC.js`)

Updated with improved error handling:

```javascript
const {
  localStream,
  remoteStream,
  callState,
  callType,
  isMuted,
  isCameraOff,
  error,
  mediaError,           // New: Detailed error information
  permissionErrorType,  // New: Specific error type
  startCall,
  acceptCall,
  rejectCall,
  hangUp,
  handleSignal,
  toggleMute,
  toggleCamera,
  ensureLocalMedia      // New: Exposed for external use
} = useWebRTC({...})
```

### 4. **Enhanced ChatRoomPage** (`src/pages/ChatRoomPage.jsx`)

Integrated with the new permission system:

- **Permission Modal Integration**: Shows helpful instructions when permission errors occur
- **Retry Mechanism**: Users can retry after fixing permissions
- **Error Tracking**: Maintains state of permission errors
- **Better Error Messages**: Clear feedback on what went wrong

## How It Works

### Call Flow with Permission Handling

```
User clicks "Video Call" button
    ↓
startCall() is triggered
    ↓
ensureLocalMedia() attempts to get camera/microphone access
    ↓
If successful → Continue with call setup
    ↓
If failed → Capture error details
    ↓
Show PermissionRequestModal with:
  - Error description
  - Browser-specific instructions
  - Retry button
    ↓
User follows instructions and clicks "Try Again"
    ↓
ensureLocalMedia() retries access
    ↓
Call proceeds if permissions granted
```

## Error Handling Examples

### Scenario 1: Permission Denied by User

```javascript
// User clicks "Start Video Call" → Browser prompts for permission → User clicks "Block"
// Result: PermissionRequestModal appears with:
// - Error: "You denied permission to access camera/microphone"
// - Step-by-step instructions (specific to their browser)
// - "Try Again" button
```

### Scenario 2: No Camera/Microphone Available

```javascript
// User tries to start call without camera
// Result: PermissionRequestModal appears with:
// - Error: "No camera or microphone found on your device"
// - Troubleshooting steps (check connections, BIOS, etc.)
// - No "Try Again" button (since retrying won't help)
```

### Scenario 3: Device In Use

```javascript
// Camera is being used by Zoom or another app
// Result: PermissionRequestModal appears with:
// - Error: "Camera/Microphone is being used by another application"
// - Instructions to close competing apps
// - "Try Again" button
```

## Implementation Details

### Permission Checking (Browser Support)

The system uses the modern Permissions API when available:

```javascript
// Supported in Chrome 44+, Firefox 43+, Safari 15.1+
const permission = await navigator.permissions.query({ name: 'camera' });
console.log(permission.state); // 'granted', 'denied', or 'prompt'
```

Falls back gracefully for unsupported browsers.

### Media Access with Constraints

```javascript
// Tries both audio and video
const result = await requestMediaAccess({
  audio: true,
  video: true
});

// If fails, tries audio-only
if (!result.success && result.error.type !== 'PERMISSION_DENIED') {
  const audioOnly = await requestMediaAccess({
    audio: true,
    video: false
  });
}
```

## Browser-Specific Instructions

The system provides different instructions based on the detected browser:

- **Chrome/Edge**: Look for lock icon in address bar
- **Firefox**: Look for information icon in address bar
- **Safari**: Go to Settings → Websites
- **Other Browsers**: Generic Chrome instructions

## Best Practices for Users

1. **Grant Permissions**: Always grant camera/microphone permissions when prompted
2. **Check Device Availability**: Ensure camera/microphone are connected
3. **Close Competing Apps**: Close Zoom, Teams, or other video apps if experiencing issues
4. **Use HTTPS**: Access the site over HTTPS for security
5. **Browser Updates**: Keep your browser updated for best compatibility

## Testing Permission Scenarios

### Test Permission Denied:
1. Start a call (browser will ask for permission)
2. Click "Block" on the permission prompt
3. PermissionRequestModal should appear with helpful instructions

### Test Device In Use:
1. Open Zoom or another video app using your camera
2. Try to start a call on this app
3. You should see "Device In Use" error with instructions

### Test No Device:
1. Disconnect camera
2. Try to start a video call
3. You should see "No Device Found" error

### Test Audio-Only Fall back:
1. If video fails but audio is available
2. System automatically offers audio-only calling

## Technical Stack

- **WebRTC**: For peer-to-peer video/audio communication
- **Permissions API**: For permission status checking
- **navigator.mediaDevices.getUserMedia()**: For media stream access
- **React Hooks**: For state management and side effects
- **SockJS + STOMP**: For WebSocket signaling

## Files Modified/Created

### Created:
- `src/utils/mediaPermissions.js` - Permission management utility
- `src/components/PermissionRequestModal.jsx` - Permission error UI

### Modified:
- `src/hooks/useWebRTC.js` - Added error tracking and permission support
- `src/pages/ChatRoomPage.jsx` - Integrated permission modal and improved error handling

## Troubleshooting

### "Camera/Microphone permission denied"

1. Check browser settings for this website
2. Reset site permissions (browser settings)
3. Reload the page
4. Restart the browser

### "No camera or microphone found"

1. Check device connections
2. Verify in system settings that devices are enabled
3. Check BIOS/firmware settings
4. Try another application to verify hardware works

### "Device in use by another application"

1. Close Zoom, Teams, or other video apps
2. Restart the browser
3. Try again

### "HTTPS required" error

Ensure you're accessing the site over HTTPS (secure connection)

## Future Enhancements

1. **Device Selection**: Allow users to choose between multiple cameras/mics
2. **Permission Persistence**: Remember user's choice and skip modal on retry
3. **Audio/Video Quality Settings**: Let users adjust quality based on bandwidth
4. **Call Recording**: Add ability to record calls
5. **Screen Sharing**: Add screen sharing capability
6. **Network Quality Indicators**: Show connection quality during calls

## API Reference

### mediaPermissions.js

#### `getPermissionStatus(deviceType)`
- **Parameters**: `deviceType` - 'camera' or 'microphone'
- **Returns**: Promise<string> - One of PERMISSION_STATES
- **Example**: `const status = await getPermissionStatus('camera')`

#### `requestMediaAccess(constraints)`
- **Parameters**: `constraints` - { audio: boolean, video: boolean }
- **Returns**: Promise<Object> - { success, stream, error }
- **Example**: `const result = await requestMediaAccess({ audio: true, video: true })`

#### `getDeviceInfo()`
- **Returns**: Promise<Object> - Device information
- **Example**: `const info = await getDeviceInfo()`

#### `getPermissionInstructions()`
- **Returns**: Object - { browser, instructions }
- **Example**: `const { browser, instructions } = getPermissionInstructions()`

### PermissionRequestModal.jsx

#### Props:
- `isOpen` (boolean) - Whether modal is visible
- `onClose` (function) - Called when modal closes
- `onRetry` (function) - Called when user clicks "Try Again"
- `errorType` (string) - Type of error to display
- `deviceType` (string) - Device name (default: "camera/microphone")

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for detailed error messages
3. Verify system permissions in OS settings
4. Ensure hardware is functioning in other applications

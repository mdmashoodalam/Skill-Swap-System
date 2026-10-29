# Voice & Video Call Testing Guide

## Quick Test Checklist

### Test 1: Normal Video Call Flow ✓
- [ ] Click "Video Call" button
- [ ] Browser requests permission (if first time)
- [ ] Click "Allow"
- [ ] Local video stream appears in modal
- [ ] Verify mic/camera toggle buttons work
- [ ] End call and verify cleanup

### Test 2: Audio Call Flow ✓
- [ ] Click "Audio Call" button
- [ ] Browser requests permission
- [ ] Click "Allow"
- [ ] Audio indicator appears instead of video
- [ ] Can toggle mute
- [ ] End call and verify cleanup

### Test 3: Permission Denied Error ✓
**Setup**: Block permission when browser asks
- [ ] Click "Video Call"
- [ ] On permission prompt, click "Block"
- [ ] PermissionRequestModal appears
- [ ] Error shows "You denied permission to access camera/microphone"
- [ ] Instructions are displayed for your browser
- [ ] "Try Again" button is available
- [ ] After allowing permissions in settings, "Try Again" works

### Test 4: No Device Error ✓
**Setup**: Disconnect all cameras and microphones
- [ ] Click "Video Call"
- [ ] PermissionRequestModal appears
- [ ] Error shows "No camera or microphone found"
- [ ] Instructions provide troubleshooting steps
- [ ] No "Try Again" button (device error)
- [ ] Connect device back and try again

### Test 5: Device In Use Error ✓
**Setup**: Open Zoom or Teams with camera already in use
- [ ] With Zoom camera active, click "Video Call"
- [ ] PermissionRequestModal appears
- [ ] Error shows "Device is being used by another application"
- [ ] Instructions tell to close competing apps
- [ ] "Try Again" button available
- [ ] After closing Zoom, "Try Again" works

### Test 6: Mute/Camera Toggle During Call ✓
- [ ] Start active call with video
- [ ] Click mute button (Mic icon)
- [ ] Button changes color to red
- [ ] Verify audio is muted
- [ ] Click camera button (Video icon)
- [ ] Video feed stops/becomes black
- [ ] Toggle both back on and verify they work

### Test 7: Incoming Call with Permissions ✓
- [ ] From another user, receive incoming call
- [ ] Call modal opens
- [ ] "Accept" and "Reject" buttons available
- [ ] Click "Accept"
- [ ] Local video appears, remote video appears
- [ ] Can toggle mute and camera
- [ ] "End Call" button terminates call

### Test 8: Incoming Call Permission Denied ✓
**Setup**: Block permissions first, then receive call
- [ ] Receive incoming call while permissions denied
- [ ] Try to accept
- [ ] PermissionRequestModal appears with instructions
- [ ] Allow permissions and retry
- [ ] Call proceeds normally

### Test 9: Audio-Only Fallback (if applicable) ✓
- [ ] Start video call
- [ ] If video unavailable, system offers audio
- [ ] Can proceed with audio-only call
- [ ] Video indicators show "N/A" or hidden

### Test 10: Error Recovery ✓
- [ ] Trigger an error (deny permissions)
- [ ] Close modal without retrying
- [ ] Click call button again
- [ ] New attempt works properly
- [ ] No stale state or errors

## Browser-Specific Tests

### Chrome/Edge Testing
- [ ] Permission prompt shows at top (URL bar area)
- [ ] Lock icon visible for site settings
- [ ] Following Chrome instructions in modal allows access

### Firefox Testing
- [ ] Permission prompt shows at top (info icon area)
- [ ] Following Firefox instructions works

### Safari Testing (if on Mac)
- [ ] Check that permissions work after Settings adjustment
- [ ] Test on Safari 15.1 or later

## Edge Cases to Test

### Edge Case 1: Call During Permission Request
- [ ] Start video call
- [ ] While permission prompt is open, click "Audio Call"
- [ ] Should handle gracefully without errors

### Edge Case 2: Multiple Call Attempts
- [ ] Try to start call
- [ ] Deny permission
- [ ] Immediately try to start another call
- [ ] Should show error modal again properly

### Edge Case 3: Permission Change While App Running
- [ ] Grant permission
- [ ] Start call successfully
- [ ] During call, change OS permission settings
- [ ] Call should continue (permissions already granted)
- [ ] After ending call, verify next call still works

### Edge Case 4: Network Issues During Call
- [ ] Start successful call
- [ ] Disconnect network
- [ ] Call should attempt to reconnect
- [ ] Visual feedback should show connection state

### Edge Case 5: Tab Background
- [ ] Start video call
- [ ] Switch to another tab
- [ ] Switch back
- [ ] Video should resume/reconnect

## Manual Testing Steps

### Test Permission Denied Flow:

```bash
# 1. Open the app in your browser
# 2. Go to chat/messaging page
# 3. Click "Video Call" button
# 4. When browser asks for permission, click "Block"
# 5. Observe: PermissionRequestModal should appear
# 6. Verify error message mentions permission denied
# 7. Follow displayed instructions for your browser
# 8. Grant permission in browser settings
# 9. Click "Try Again" button
# 10. Verify call starts successfully
```

### Test Device In Use Flow:

```bash
# 1. Open Zoom or Teams
# 2. Start video/audio on that app (camera should be in use)
# 3. Go to Skill Swap Platform
# 4. Click "Video Call" button
# 5. Observe: "Device in use" error should appear
# 6. Follow instructions to close competing app
# 7. Close Zoom/Teams app
# 8. Click "Try Again" button in modal
# 9. Verify call starts successfully
```

## Verification Points

After each test, verify:

- [ ] No console errors (open DevTools)
- [ ] WebRTC connection established (check connection state)
- [ ] Audio/Video streams flowing properly
- [ ] UI states update correctly (buttons change color)
- [ ] Error messages are clear and helpful
- [ ] Modal closes and opens appropriately
- [ ] No memory leaks (streams are cleaned up)
- [ ] State resets properly between calls

## Console Debugging

Open browser DevTools (F12) and check console for:

```javascript
// You should see successful logs like:
// "Media stream created successfully"
// "RTCPeerConnection established"
// "Call connected"

// Not errors like:
// "NotAllowedError: Permission denied"
// "NotFoundError: Device not found"
```

To check for specific errors:

```javascript
// In console, check the error object:
console.log(error.type); // PERMISSION_DENIED, NO_DEVICES_FOUND, etc.
console.log(error.message); // User-friendly message
console.log(error.originalError); // Original JS error
```

## Performance Testing

- [ ] Call starts within 2-3 seconds
- [ ] Video appears within 1-2 seconds
- [ ] Permission modal appears within 500ms
- [ ] No UI freezing during call
- [ ] Smooth video/audio without stuttering
- [ ] Low CPU/Memory usage

## Network Conditions Testing

Test with different network speeds using Chrome DevTools:

- [ ] Throttle to 3G
- [ ] Throttle to 4G
- [ ] Set connection to "offline"
- [ ] Observe behavior and recovery

## Accessibility Testing

- [ ] Tab navigation works in modal
- [ ] Screen reader announces error messages
- [ ] Button labels are clear
- [ ] Color alone doesn't convey critical info
- [ ] Instructions are easy to follow

## Sign-Off Checklist

- [ ] All basic tests pass
- [ ] All browser-specific tests pass
- [ ] All edge cases handled gracefully
- [ ] Error messages are helpful
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Ready for production

## Test Report Template

```
Test Date: ____________________
Tester: ______________________
Browser: Chrome / Firefox / Safari / Edge
OS: Windows / Mac / Linux

Tests Passed: __ / 10
Edge Cases Passed: __ / 5

Issues Found:
1. ____________________________
2. ____________________________

Observations:
____________________________

Sign-Off: ____________________
```

## Support Contacts

If tests fail:
1. Check browser console for errors
2. Verify all files are created correctly
3. Ensure dependencies are installed
4. Review the VOICE_VIDEO_CALL_IMPROVEMENTS.md for configuration

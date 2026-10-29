import { AlertCircle, Camera, Mic, Settings, X } from 'lucide-react'
import { getPermissionInstructions } from '../utils/mediaPermissions'

export default function PermissionRequestModal({
  isOpen,
  onClose,
  onRetry,
  errorType,
  deviceType = 'camera/microphone'
}) {
  if (!isOpen) return null

  const { browser, instructions } = getPermissionInstructions()
  const isPermissionError = errorType === 'PERMISSION_DENIED'
  const isDeviceError = errorType === 'NO_DEVICES_FOUND'
  const isInUseError = errorType === 'DEVICE_IN_USE'
  const isSecurityError = errorType === 'SECURITY_ERROR'

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="text-white" />
            <h2 className="text-lg font-bold text-white">
              {isPermissionError
                ? 'Permission Required'
                : isDeviceError
                ? 'No Device Found'
                : isInUseError
                ? 'Device In Use'
                : isSecurityError
                ? 'Security Error'
                : 'Media Error'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1 rounded transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {isPermissionError && (
            <>
              <div className="flex gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
                <Settings size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 mb-2">Permission Denied</p>
                  <p className="text-blue-800 mb-3">
                    To enable {deviceType}, you need to update your browser permissions for {browser}.
                  </p>
                  <p className="font-medium text-blue-900 mb-2">Steps:</p>
                  <ol className="list-decimal list-inside text-blue-800 space-y-1">
                    {instructions.map((instruction, idx) => (
                      <li key={idx} className="text-sm">
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}

          {isDeviceError && (
            <div className="flex gap-3 p-4 bg-yellow-50 rounded-lg">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 mb-2">No {deviceType} Found</p>
                <p className="text-sm text-yellow-800">
                  No camera or microphone could be detected on your device. Please check that your devices are:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
                  <li>Connected and enabled</li>
                  <li>Properly configured in your system settings</li>
                  <li>Not disabled in BIOS/firmware</li>
                </ul>
              </div>
            </div>
          )}

          {isInUseError && (
            <div className="flex gap-3 p-4 bg-orange-50 rounded-lg">
              <AlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900 mb-2">Device In Use</p>
                <p className="text-sm text-orange-800">
                  Your {deviceType} is currently being used by another application. Please:
                </p>
                <ul className="list-disc list-inside text-sm text-orange-800 mt-2 space-y-1">
                  <li>Close other applications using the camera/microphone</li>
                  <li>Refresh this page</li>
                  <li>Try again</li>
                </ul>
              </div>
            </div>
          )}

          {isSecurityError && (
            <div className="flex gap-3 p-4 bg-purple-50 rounded-lg">
              <AlertCircle size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-900 mb-2">Security Restriction</p>
                <p className="text-sm text-purple-800">
                  Camera and microphone access only works on secure (HTTPS) connections. Please ensure you're accessing
                  this site over a secure connection.
                </p>
              </div>
            </div>
          )}

          {!isPermissionError && !isDeviceError && !isInUseError && !isSecurityError && (
            <div className="flex gap-3 p-4 bg-red-50 rounded-lg">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-2">Media Error</p>
                <p className="text-sm text-red-800">
                  An unexpected error occurred while accessing your {deviceType}. Please try again or contact support if
                  the problem persists.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Close
          </button>
          {(isPermissionError || isInUseError) && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-white bg-primary hover:bg-primary-dark rounded-lg transition font-medium flex items-center gap-2"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

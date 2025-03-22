/**
 * Call related type definitions
 */

export type CallState = 
  | 'idle'      // No active call
  | 'ringing'   // Call is ringing (outgoing or incoming)
  | 'answered'  // Call is active
  | 'hangup'    // Call ended
  | 'hold'      // Call is on hold

/**
 * Call direction
 */
export type CallDirection = 'incoming' | 'outgoing'

/**
 * Call session information
 */
export interface CallSession {
  id: string
  direction: CallDirection
  state: CallState
  remoteIdentity: string
  startTime?: Date
  endTime?: Date
  duration: number
}

/**
 * Call audio controls
 */
export interface CallAudioControls {
  isMicMuted: boolean
  isSpeakerMuted: boolean
  volume: number
}

/**
 * Call state context
 */
export interface CallStateContext {
  currentCall: CallSession | null
  callHistory: CallSession[]
  audioControls: CallAudioControls
}

/**
 * SIP Session callback events
 */
export interface SIPSessionEvents {
  onConnecting?: () => void
  onProgress?: () => void
  onAccepted?: () => void
  onConfirmed?: () => void
  onEnded?: (cause: string) => void
  onFailed?: (cause: string, response?: any) => void
  onHold?: () => void
  onUnhold?: () => void
  onMuted?: () => void
  onUnmuted?: () => void
}

/**
 * SIP call options
 */
export interface SIPCallOptions {
  mediaConstraints?: {
    audio: boolean
    video: boolean
  }
  pcConfig?: {
    iceServers?: Array<{urls: string}>
    iceTransportPolicy?: 'all' | 'relay'
    bundlePolicy?: 'balanced' | 'max-bundle' | 'max-compat'
    rtcpMuxPolicy?: 'negotiate' | 'require'
    iceCandidatePoolSize?: number
    sdpSemantics?: 'plan-b' | 'unified-plan'
  }
}
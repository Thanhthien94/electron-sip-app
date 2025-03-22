/**
 * Định nghĩa các hằng số sử dụng trong SIP module
 */

// Đường dẫn âm thanh
export const RINGTONE_PATH = '/audio/original-phone-ringtone-36558.mp3'

// Cấu hình WebRTC
export const DEFAULT_RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ],
  iceTransportPolicy: 'all',
  bundlePolicy: 'balanced',
  rtcpMuxPolicy: 'require',
  iceCandidatePoolSize: 2,
  sdpSemantics: 'unified-plan'
}

// Cấu hình cuộc gọi với early media
export const DEFAULT_CALL_OPTIONS = {
  mediaConstraints: { audio: true, video: false },
  pcConfig: DEFAULT_RTC_CONFIG,
  RTCConstraints: {"optional": [{'DtlsSrtpKeyAgreement': 'true'}]},
  earlyMedia: true,
  answerOnProgress: true
}

// Các trạng thái cuộc gọi
export const CALL_STATES = {
  IDLE: 'idle',
  RINGING: 'ringing',
  ANSWERED: 'answered',
  HANGUP: 'hangup',
  HOLD: 'hold'
}

// Các mã SIP thường gặp và tương ứng tiếng Việt ngắn gọn
export const SIP_CODE_MESSAGES: Record<number, string> = {
  100: 'Đang thử kết nối',
  180: 'Đang đổ chuông',
  183: 'Đang tiến hành',
  200: 'Thành công',
  400: 'Yêu cầu không hợp lệ',
  401: 'Cần xác thực',
  403: 'Bị từ chối',
  404: 'Không tìm thấy',
  408: 'Hết thời gian chờ',
  480: 'Tạm thời không liên lạc được',
  486: 'Máy bận',
  487: 'Cuộc gọi đã hủy',
  488: 'Không chấp nhận',
  500: 'Lỗi máy chủ',
  503: 'Dịch vụ không khả dụng',
  600: 'Bận ở mọi nơi',
  603: 'Từ chối'
}

// Thời gian tối đa không có phản hồi (giây)
export const NO_ANSWER_TIMEOUT = 45

// Số lần thử kết nối tối đa
export const MAX_RECONNECT_ATTEMPTS = 3

// Debug mode
export const DEBUG_SIP = true
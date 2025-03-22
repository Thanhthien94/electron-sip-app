/**
 * SIP status code utilities
 * Based on RFC 3261 and typical SIP implementation codes
 */

export interface SIPCodeInfo {
    code: number;
    category: 'success' | 'redirect' | 'client-error' | 'server-error' | 'global-error';
    title: string;
    description: string;
    vietnameseName: string;
  }
  
  // Map of all SIP status codes with detailed info
  export const SIP_CODES: { [key: number]: SIPCodeInfo } = {
    // 1xx: Provisional responses
    100: { 
      code: 100, 
      category: 'success', 
      title: 'Trying', 
      description: 'Extended search being performed may take a significant time so a forking proxy must send a 100 Trying response', 
      vietnameseName: 'Đang thử'
    },
    180: { 
      code: 180, 
      category: 'success', 
      title: 'Ringing', 
      description: 'Destination user agent received INVITE, and is alerting user of call', 
      vietnameseName: 'Đang đổ chuông'
    },
    181: { 
      code: 181, 
      category: 'success', 
      title: 'Call is Being Forwarded', 
      description: 'Servers can optionally send this response to indicate a call is being forwarded', 
      vietnameseName: 'Cuộc gọi đang được chuyển tiếp'
    },
    182: { 
      code: 182, 
      category: 'success', 
      title: 'Queued', 
      description: 'Called party is temporarily unavailable, but server has decided to queue the call rather than reject it', 
      vietnameseName: 'Đang xếp hàng đợi'
    },
    183: { 
      code: 183, 
      category: 'success', 
      title: 'Session Progress', 
      description: 'Used to convey information about the progress of the call that is not otherwise classified', 
      vietnameseName: 'Đang tiến hành'
    },
  
    // 2xx: Success responses
    200: { 
      code: 200, 
      category: 'success', 
      title: 'OK', 
      description: 'Request was successful', 
      vietnameseName: 'Thành công'
    },
    202: { 
      code: 202, 
      category: 'success', 
      title: 'Accepted', 
      description: 'Request has been accepted for processing, but the processing has not been completed', 
      vietnameseName: 'Đã chấp nhận'
    },
  
    // 3xx: Redirection responses
    300: { 
      code: 300, 
      category: 'redirect', 
      title: 'Multiple Choices', 
      description: 'The address resolved to one of several options for the user or client to choose between', 
      vietnameseName: 'Nhiều lựa chọn'
    },
    301: { 
      code: 301, 
      category: 'redirect', 
      title: 'Moved Permanently', 
      description: 'The user can no longer be found at the address in the Request-URI', 
      vietnameseName: 'Đã chuyển vĩnh viễn'
    },
    302: { 
      code: 302, 
      category: 'redirect', 
      title: 'Moved Temporarily', 
      description: 'The requesting client should retry the request at the new address given by the Contact header field', 
      vietnameseName: 'Đã chuyển tạm thời'
    },
    305: { 
      code: 305, 
      category: 'redirect', 
      title: 'Use Proxy', 
      description: 'The requested resource must be accessed through the proxy given by the Contact field', 
      vietnameseName: 'Sử dụng proxy'
    },
    380: { 
      code: 380, 
      category: 'redirect', 
      title: 'Alternative Service', 
      description: 'The call was not successful, but alternative services are possible', 
      vietnameseName: 'Dịch vụ thay thế'
    },
  
    // 4xx: Client error responses
    400: { 
      code: 400, 
      category: 'client-error', 
      title: 'Bad Request', 
      description: 'The request could not be understood due to malformed syntax', 
      vietnameseName: 'Yêu cầu không hợp lệ'
    },
    401: { 
      code: 401, 
      category: 'client-error', 
      title: 'Unauthorized', 
      description: 'The request requires user authentication', 
      vietnameseName: 'Cần xác thực'
    },
    402: { 
      code: 402, 
      category: 'client-error', 
      title: 'Payment Required', 
      description: 'Reserved for future use', 
      vietnameseName: 'Yêu cầu thanh toán'
    },
    403: { 
      code: 403, 
      category: 'client-error', 
      title: 'Forbidden', 
      description: 'The server understood the request, but is refusing to fulfill it', 
      vietnameseName: 'Bị từ chối'
    },
    404: { 
      code: 404, 
      category: 'client-error', 
      title: 'Not Found', 
      description: 'The server has definitive information that the user does not exist at the domain specified', 
      vietnameseName: 'Không tìm thấy'
    },
    405: { 
      code: 405, 
      category: 'client-error', 
      title: 'Method Not Allowed', 
      description: 'The method specified in the Request-Line is not allowed for the address identified by the Request-URI', 
      vietnameseName: 'Phương thức không được cho phép'
    },
    406: { 
      code: 406, 
      category: 'client-error', 
      title: 'Not Acceptable', 
      description: 'The resource identified by the request is only capable of generating response entities which have content characteristics not acceptable according to the Accept header sent in the request', 
      vietnameseName: 'Không chấp nhận được'
    },
    407: { 
      code: 407, 
      category: 'client-error', 
      title: 'Proxy Authentication Required', 
      description: 'The client must first authenticate itself with the proxy', 
      vietnameseName: 'Yêu cầu xác thực proxy'
    },
    408: { 
      code: 408, 
      category: 'client-error', 
      title: 'Request Timeout', 
      description: 'The server could not produce a response within a suitable amount of time', 
      vietnameseName: 'Hết thời gian chờ'
    },
    409: { 
      code: 409, 
      category: 'client-error', 
      title: 'Conflict', 
      description: 'The request could not be completed due to a conflict with the current state of the resource', 
      vietnameseName: 'Xung đột'
    },
    410: { 
      code: 410, 
      category: 'client-error', 
      title: 'Gone', 
      description: 'The requested resource is no longer available at the server and no forwarding address is known', 
      vietnameseName: 'Đã mất'
    },
    411: { 
      code: 411, 
      category: 'client-error', 
      title: 'Length Required', 
      description: 'The server refuses to accept the request without a defined Content-Length', 
      vietnameseName: 'Yêu cầu độ dài'
    },
    413: { 
      code: 413, 
      category: 'client-error', 
      title: 'Request Entity Too Large', 
      description: 'The server is refusing to process a request because the request entity is larger than the server is willing or able to process', 
      vietnameseName: 'Yêu cầu quá lớn'
    },
    414: { 
      code: 414, 
      category: 'client-error', 
      title: 'Request-URI Too Long', 
      description: 'The server is refusing to service the request because the Request-URI is longer than the server is willing to interpret', 
      vietnameseName: 'URI yêu cầu quá dài'
    },
    415: { 
      code: 415, 
      category: 'client-error', 
      title: 'Unsupported Media Type', 
      description: 'The server is refusing to service the request because the message body of the request is in a format not supported by the server for the requested method', 
      vietnameseName: 'Kiểu media không được hỗ trợ'
    },
    416: { 
      code: 416, 
      category: 'client-error', 
      title: 'Unsupported URI Scheme', 
      description: 'The server cannot process the request because the scheme of the URI in the Request-URI is unknown to the server', 
      vietnameseName: 'Scheme URI không được hỗ trợ'
    },
    420: { 
      code: 420, 
      category: 'client-error', 
      title: 'Bad Extension', 
      description: 'The server did not understand the protocol extension specified in a Proxy-Require or Require header field', 
      vietnameseName: 'Phần mở rộng không hợp lệ'
    },
    421: { 
      code: 421, 
      category: 'client-error', 
      title: 'Extension Required', 
      description: 'The server needs a specific extension not listed in the Supported header', 
      vietnameseName: 'Yêu cầu phần mở rộng'
    },
    422: { 
      code: 422, 
      category: 'client-error', 
      title: 'Session Interval Too Small', 
      description: 'The received request contains a Session-Expires header with a duration below the minimum timer', 
      vietnameseName: 'Khoảng thời gian phiên quá nhỏ'
    },
    423: { 
      code: 423, 
      category: 'client-error', 
      title: 'Interval Too Brief', 
      description: 'The server is refusing to process the request because the expiration time of the resource refreshment is too short', 
      vietnameseName: 'Khoảng thời gian quá ngắn'
    },
    428: { 
      code: 428, 
      category: 'client-error', 
      title: 'Use Identity Header', 
      description: 'The server policy requires an Identity header, and one has not been provided', 
      vietnameseName: 'Sử dụng tiêu đề Identity'
    },
    429: { 
      code: 429, 
      category: 'client-error', 
      title: 'Provide Referrer Identity', 
      description: 'The server did not receive a valid Referred-By token in the request', 
      vietnameseName: 'Cung cấp thông tin giới thiệu'
    },
    433: { 
      code: 433, 
      category: 'client-error', 
      title: 'Anonymity Disallowed', 
      description: 'The request has been rejected because it was anonymous', 
      vietnameseName: 'Không cho phép ẩn danh'
    },
    436: { 
      code: 436, 
      category: 'client-error', 
      title: 'Bad Identity-Info', 
      description: 'The Identity-Info header contains a URI that cannot be dereferenced, or the certificate referenced by the URI is bad', 
      vietnameseName: 'Thông tin nhận dạng không hợp lệ'
    },
    437: { 
      code: 437, 
      category: 'client-error', 
      title: 'Unsupported Certificate', 
      description: 'The server was unable to validate a certificate for the domain that signed the request', 
      vietnameseName: 'Chứng chỉ không được hỗ trợ'
    },
    438: { 
      code: 438, 
      category: 'client-error', 
      title: 'Invalid Identity Header', 
      description: 'The server obtained a valid certificate, but was unable to validate the signature in the Identity header field', 
      vietnameseName: 'Tiêu đề nhận dạng không hợp lệ'
    },
    480: { 
      code: 480, 
      category: 'client-error', 
      title: 'Temporarily Unavailable', 
      description: 'The callee is currently unavailable', 
      vietnameseName: 'Tạm thời không liên lạc được'
    },
    481: { 
      code: 481, 
      category: 'client-error', 
      title: 'Call/Transaction Does Not Exist', 
      description: 'The UAS received a request that does not match any existing dialog or transaction', 
      vietnameseName: 'Cuộc gọi không tồn tại'
    },
    482: { 
      code: 482, 
      category: 'client-error', 
      title: 'Loop Detected', 
      description: 'The server has detected a loop', 
      vietnameseName: 'Phát hiện vòng lặp'
    },
    483: { 
      code: 483, 
      category: 'client-error', 
      title: 'Too Many Hops', 
      description: 'The server received a request that contains a Max-Forwards header with the value zero', 
      vietnameseName: 'Quá nhiều chặng'
    },
    484: { 
      code: 484, 
      category: 'client-error', 
      title: 'Address Incomplete', 
      description: 'The server received a request with a Request-URI that was incomplete', 
      vietnameseName: 'Địa chỉ không đầy đủ'
    },
    485: { 
      code: 485, 
      category: 'client-error', 
      title: 'Ambiguous', 
      description: 'The Request-URI was ambiguous', 
      vietnameseName: 'Không rõ ràng'
    },
    486: { 
      code: 486, 
      category: 'client-error', 
      title: 'Busy Here', 
      description: 'The callee is busy', 
      vietnameseName: 'Máy bận'
    },
    487: { 
      code: 487, 
      category: 'client-error', 
      title: 'Request Terminated', 
      description: 'The request was terminated by a BYE or CANCEL request', 
      vietnameseName: 'Yêu cầu đã bị hủy'
    },
    488: { 
      code: 488, 
      category: 'client-error', 
      title: 'Not Acceptable Here', 
      description: 'The response indicates that the server could not understand the media parameters', 
      vietnameseName: 'Không chấp nhận ở đây'
    },
    489: { 
      code: 489, 
      category: 'client-error', 
      title: 'Bad Event', 
      description: 'The server did not understand an event package specified in an Event header field', 
      vietnameseName: 'Sự kiện không hợp lệ'
    },
    491: { 
      code: 491, 
      category: 'client-error', 
      title: 'Request Pending', 
      description: 'The request was received by a UAS that had a pending request within the same dialog', 
      vietnameseName: 'Yêu cầu đang chờ xử lý'
    },
    493: { 
      code: 493, 
      category: 'client-error', 
      title: 'Undecipherable', 
      description: 'The request contains an encrypted MIME body that the recipient cannot decrypt', 
      vietnameseName: 'Không giải mã được'
    },
    494: { 
      code: 494, 
      category: 'client-error', 
      title: 'Security Agreement Required', 
      description: 'The server has received a request that requires a negotiated security mechanism', 
      vietnameseName: 'Yêu cầu thỏa thuận bảo mật'
    },
  
    // 5xx: Server error responses
    500: { 
      code: 500, 
      category: 'server-error', 
      title: 'Server Internal Error', 
      description: 'The server encountered an unexpected condition that prevented it from fulfilling the request', 
      vietnameseName: 'Lỗi máy chủ nội bộ'
    },
    501: { 
      code: 501, 
      category: 'server-error', 
      title: 'Not Implemented', 
      description: 'The server does not support the functionality required to fulfill the request', 
      vietnameseName: 'Chưa được triển khai'
    },
    502: { 
      code: 502, 
      category: 'server-error', 
      title: 'Bad Gateway', 
      description: 'The server, while acting as a gateway or proxy, received an invalid response from the downstream server', 
      vietnameseName: 'Lỗi gateway'
    },
    503: { 
      code: 503, 
      category: 'server-error', 
      title: 'Service Unavailable', 
      description: 'The server is temporarily unable to handle the request due to a temporary overloading or maintenance of the server', 
      vietnameseName: 'Dịch vụ không khả dụng'
    },
    504: { 
      code: 504, 
      category: 'server-error', 
      title: 'Server Time-out', 
      description: 'The server did not receive a timely response from an external server it needed to access in order to complete the request', 
      vietnameseName: 'Hết thời gian chờ máy chủ'
    },
    505: { 
      code: 505, 
      category: 'server-error', 
      title: 'Version Not Supported', 
      description: 'The server does not support, or refuses to support, the SIP protocol version in the request', 
      vietnameseName: 'Phiên bản không được hỗ trợ'
    },
    513: { 
      code: 513, 
      category: 'server-error', 
      title: 'Message Too Large', 
      description: 'The server was unable to process the request since the message length exceeded its capabilities', 
      vietnameseName: 'Tin nhắn quá lớn'
    },
    580: { 
      code: 580, 
      category: 'server-error', 
      title: 'Precondition Failure', 
      description: 'The server is unable to meet the requirements specified in the Require header', 
      vietnameseName: 'Lỗi điều kiện tiên quyết'
    },
  
    // 6xx: Global error responses
    600: { 
      code: 600, 
      category: 'global-error', 
      title: 'Busy Everywhere', 
      description: 'All possible destinations are busy', 
      vietnameseName: 'Bận ở mọi nơi'
    },
    603: { 
      code: 603, 
      category: 'global-error', 
      title: 'Decline', 
      description: 'The destination does not wish to participate in the call', 
      vietnameseName: 'Từ chối'
    },
    604: { 
      code: 604, 
      category: 'global-error', 
      title: 'Does Not Exist Anywhere', 
      description: 'The server has authoritative information that the user indicated in the Request-URI does not exist anywhere', 
      vietnameseName: 'Không tồn tại ở bất kỳ đâu'
    },
    606: { 
      code: 606, 
      category: 'global-error', 
      title: 'Not Acceptable', 
      description: 'The user\'s agent was contacted successfully but some aspects of the session description were not acceptable', 
      vietnameseName: 'Không chấp nhận được'
    }
  };
  
  /**
   * Get detailed information about a SIP status code
   * @param code SIP status code
   * @returns Information about the code or null if not found
   */
  export function getSIPCodeInfo(code: number): SIPCodeInfo | null {
    return SIP_CODES[code] || null;
  }
  
  /**
   * Check if a SIP code represents a successful response
   * @param code SIP status code
   * @returns true if success, false otherwise
   */
  export function isSIPCodeSuccess(code: number): boolean {
    return (code >= 200 && code < 300);
  }
  
  /**
   * Check if a SIP code represents an error response
   * @param code SIP status code
   * @returns true if error, false otherwise
   */
  export function isSIPCodeError(code: number): boolean {
    return (code >= 400);
  }
  
  /**
   * Get a friendly message for a SIP code
   * @param code SIP status code
   * @returns User-friendly message in Vietnamese
   */
  export function getSIPCodeMessage(code: number): string {
    const info = getSIPCodeInfo(code);
    if (!info) {
      return `Mã SIP không xác định (${code})`;
    }
    
    return info.vietnameseName;
  }
  
  /**
   * Categorize a SIP code
   * @param code SIP status code
   * @returns Category of the SIP code
   */
  export function getSIPCodeCategory(code: number): string {
    if (code >= 100 && code < 200) return 'provisional';
    if (code >= 200 && code < 300) return 'success';
    if (code >= 300 && code < 400) return 'redirect';
    if (code >= 400 && code < 500) return 'client-error';
    if (code >= 500 && code < 600) return 'server-error';
    if (code >= 600 && code < 700) return 'global-error';
    return 'unknown';
  }
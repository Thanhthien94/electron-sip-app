import clsx, { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...args: ClassValue[]): string => {
  return twMerge(clsx(...args))
}

/**
 * Các tiện ích định dạng cho trình cập nhật
 */

/**
 * Định dạng kích thước tệp từ bytes sang đơn vị đọc được
 * @param bytes Kích thước tính bằng bytes
 * @returns Chuỗi biểu thị kích thước với đơn vị thích hợp
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  if (i === 0) return `${bytes} ${sizes[i]}`;
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Định dạng phần trăm
 * @param percent Số phần trăm (0-100)
 * @returns Chuỗi biểu thị phần trăm đã được định dạng
 */
export function formatPercentage(percent: number): string {
  return `${percent.toFixed(1)}%`;
}

/**
 * Tạo chuỗi mô tả thời gian từ milliseconds
 * @param ms Thời gian tính bằng milliseconds
 * @returns Chuỗi thời gian định dạng
 */
export function formatTimeRemaining(ms: number): string {
  if (ms < 1000) return 'ít hơn 1 giây';
  
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`;
  } else if (minutes > 0) {
    return `${minutes} phút ${seconds} giây`;
  } else {
    return `${seconds} giây`;
  }
}

/**
 * Tính thời gian còn lại dựa trên tốc độ tải và dữ liệu còn lại
 * @param bytesPerSecond Tốc độ tải (bytes/s)
 * @param bytesRemaining Số bytes còn lại cần tải
 * @returns Chuỗi thời gian ước tính còn lại
 */
export function estimateTimeRemaining(bytesPerSecond: number, bytesRemaining: number): string {
  if (bytesPerSecond === 0) return 'đang tính...';
  
  const seconds = bytesRemaining / bytesPerSecond;
  return formatTimeRemaining(seconds * 1000);
}

/**
 * So sánh hai phiên bản semantic (x.y.z)
 * @param version1 Phiên bản thứ nhất
 * @param version2 Phiên bản thứ hai
 * @returns 1 nếu version1 > version2, -1 nếu version1 < version2, 0 nếu bằng nhau
 */
export function compareVersions(version1: string, version2: string): number {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = i < parts1.length ? parts1[i] : 0;
    const part2 = i < parts2.length ? parts2[i] : 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

/**
 * Kiểm tra xem phiên bản mới có phải là major update không
 * @param currentVersion Phiên bản hiện tại
 * @param newVersion Phiên bản mới
 * @returns true nếu là major update, false nếu không phải
 */
export function isMajorUpdate(currentVersion: string, newVersion: string): boolean {
  const current = currentVersion.split('.').map(Number);
  const next = newVersion.split('.').map(Number);
  
  return next[0] > current[0];
}

/**
 * Tạo đường dẫn tới file cập nhật dựa trên hệ điều hành
 * @param baseUrl URL cơ sở của máy chủ cập nhật
 * @param platform Nền tảng (win, mac, linux)
 * @param fileName Tên file
 * @returns URL đầy đủ tới file cập nhật
 */
export function getUpdateFileUrl(baseUrl: string, platform: string, fileName: string): string {
  // Đảm bảo baseUrl có dấu / ở cuối
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBaseUrl}${platform}/${fileName}`;
}

/**
 * Trích xuất tên file từ đường dẫn đầy đủ
 * @param filePath Đường dẫn file
 * @returns Tên file
 */
export function extractFileName(filePath: string): string {
  // Xử lý cả đường dẫn URL và đường dẫn file hệ thống
  const parts = filePath.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] || '';
}

/**
 * Tạo văn bản mô tả cập nhật từ ghi chú phát hành
 * @param releaseNotes Ghi chú phát hành (string hoặc mảng string)
 * @param version Phiên bản mới
 * @returns Chuỗi định dạng HTML cho thông báo cập nhật
 */
export function formatReleaseNotes(releaseNotes: string | string[] | null | undefined, version: string): string {
  if (!releaseNotes) {
    return `<p>Phiên bản <strong>${version}</strong> đã sẵn sàng để cài đặt.</p>`;
  }
  
  let content = `<p>Phiên bản <strong>${version}</strong> với các cập nhật sau:</p>`;
  
  if (typeof releaseNotes === 'string') {
    // Chuyển đổi Markdown đơn giản sang HTML
    content += releaseNotes
      .split('\n')
      .map(line => {
        // Xử lý danh sách
        if (line.trim().startsWith('- ')) {
          return `<li>${line.trim().substring(2)}</li>`;
        }
        // Xử lý tiêu đề
        if (line.trim().startsWith('### ')) {
          return `<h4>${line.trim().substring(4)}</h4>`;
        }
        // Dòng trống
        if (!line.trim()) {
          return '';
        }
        // Dòng bình thường
        return `<p>${line}</p>`;
      })
      .join('');
  } else if (Array.isArray(releaseNotes)) {
    content += '<ul>';
    releaseNotes.forEach(note => {
      content += `<li>${note}</li>`;
    });
    content += '</ul>';
  }
  
  return content;
}
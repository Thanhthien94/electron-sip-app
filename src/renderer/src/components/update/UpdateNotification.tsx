import React, { useCallback, useState } from 'react'
import { useUpdate } from '@/contexts/UpdateContext'
import { formatBytes, formatPercentage } from '@/lib/utils'
import { X, Download, RefreshCw, RotateCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UpdateStatus } from '@/types/update.types'

export const UpdateNotification: React.FC = () => {
  const [errorDismissedTime, setErrorDismissedTime] = useState<number | null>(null)

  // Kiểm tra nếu lỗi đã được đóng gần đây (trong vòng 30 phút)
  const isErrorRecentlyDismissed = useCallback(() => {
    if (!errorDismissedTime) return false
    const timeSinceDismiss = Date.now() - errorDismissedTime
    return timeSinceDismiss < 30 * 60 * 1000 // 30 phút
  }, [errorDismissedTime])
  const {
    updateState,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismissUpdate,
    isUpdateAvailable,
    isUpdateDownloaded,
    isUpdateError,
    isCheckingForUpdate,
    isDownloadingUpdate
  } = useUpdate()

  const handleErrorDismiss = () => {
    setErrorDismissedTime(Date.now())
    dismissUpdate()
  }

  if (
    (!isUpdateAvailable && !isUpdateDownloaded && !isDownloadingUpdate && !isUpdateError) ||
    (isUpdateError && isErrorRecentlyDismissed())
  ) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md w-full z-50 rounded-lg shadow-lg bg-card text-card-foreground border border-border-light overflow-hidden">
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isUpdateAvailable && <Download size={18} className="text-orange-500" />}
            {isUpdateDownloaded && <CheckCircle2 size={18} className="text-green-500" />}
            {isDownloadingUpdate && <RefreshCw size={18} className="text-blue-500 animate-spin" />}
            {isUpdateError && <AlertCircle size={18} className="text-red-500" />}

            <h3 className="font-medium text-sm">
              {isUpdateAvailable && 'Cập nhật mới có sẵn'}
              {isUpdateDownloaded && 'Sẵn sàng cài đặt cập nhật'}
              {isDownloadingUpdate && 'Đang tải cập nhật'}
              {isUpdateError && 'Lỗi cập nhật'}
            </h3>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full"
            onClick={isUpdateError ? handleErrorDismiss : dismissUpdate}
          >
            <X size={14} />
            <span className="sr-only">Đóng</span>
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 bg-background">
          {/* Thông tin phiên bản */}
          {updateState.info && (
            <div className="mb-3">
              <p className="text-sm">
                Phiên bản <span className="font-semibold">{updateState.info.version}</span> đã sẵn
                sàng
              </p>

              {updateState.info.releaseDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ngày phát hành:{' '}
                  {new Date(updateState.info.releaseDate).toLocaleDateString('vi-VN')}
                </p>
              )}

              {updateState.info.releaseNotes && (
                <div className="mt-2 text-xs text-muted-foreground max-h-20 overflow-y-auto border-l-2 border-muted pl-2">
                  {typeof updateState.info.releaseNotes === 'string' ? (
                    <p>{updateState.info.releaseNotes}</p>
                  ) : (
                    <>
                      {updateState.info.releaseNotes.map((note, i) => (
                        <p key={i} className="mb-1">
                          {note}
                        </p>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tiến trình tải */}
          {isDownloadingUpdate && updateState.progress && (
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Đang tải xuống</span>
                <span>{formatPercentage(updateState.progress.percent)}</span>
              </div>

              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-in-out"
                  style={{ width: `${updateState.progress.percent}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-xs mt-1">
                <span>
                  {formatBytes(updateState.progress.transferred)} /{' '}
                  {formatBytes(updateState.progress.total)}
                </span>
                <span>{formatBytes(updateState.progress.bytesPerSecond)}/s</span>
              </div>
            </div>
          )}

          {/* Lỗi cập nhật */}
          {isUpdateError && updateState.error && (
            <div className="mb-3 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
              {updateState.error}
            </div>
          )}

          {/* Nút hành động */}
          <div
            className={cn(
              'flex gap-2',
              isCheckingForUpdate ? 'opacity-50 pointer-events-none' : ''
            )}
          >
            {isUpdateAvailable && (
              <Button
                className="flex-1"
                variant="default"
                size="sm"
                onClick={downloadUpdate}
                disabled={isCheckingForUpdate}
              >
                <Download size={16} className="mr-1" />
                Tải xuống
              </Button>
            )}

            {isUpdateDownloaded && (
              <Button
                className="flex-1"
                variant="default"
                size="sm"
                onClick={installUpdate}
                disabled={isCheckingForUpdate}
              >
                <RotateCw size={16} className="mr-1" />
                Cài đặt & khởi động lại
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={checkForUpdates}
              disabled={isCheckingForUpdate || updateState.status === UpdateStatus.CHECKING}
              className="flex items-center gap-1"
            >
              {isCheckingForUpdate ? (
                <>
                  <RefreshCw size={14} className="animate-spin mr-1" />
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <RefreshCw size={14} className="mr-1" />
                  Kiểm tra lại
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

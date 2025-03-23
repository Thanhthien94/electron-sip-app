import React from 'react'
import { useUpdate } from '@/contexts/UpdateContext'
import { Button } from '@/components/ui/button'
import { 
  RefreshCw, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  Download,
  RotateCw
} from 'lucide-react'
import { UpdateStatus } from '@/types/update.types'

export const UpdateSettings: React.FC = () => {
  const { 
    updateState, 
    checkForUpdates, 
    downloadUpdate,
    installUpdate,
    isCheckingForUpdate
  } = useUpdate()

  // Lấy phiên bản hiện tại
  const currentVersion = window.electron?.process?.versions?.app || 'Unknown'

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-neutral-200">Cập nhật ứng dụng</h3>
      
      <div className="p-4 rounded-md bg-neutral-800/50 border border-neutral-700 space-y-4">
        {/* Thông tin phiên bản */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-neutral-300">Phiên bản hiện tại</p>
            <p className="text-xs text-neutral-400">{currentVersion}</p>
          </div>
          
          {/* Trạng thái cập nhật */}
          <div className="flex items-center gap-1">
            {updateState.status === UpdateStatus.NOT_CHECKED && (
              <Info size={14} className="text-blue-400" />
            )}
            {updateState.status === UpdateStatus.CHECKING && (
              <RefreshCw size={14} className="text-blue-400 animate-spin" />
            )}
            {updateState.status === UpdateStatus.AVAILABLE && (
              <AlertTriangle size={14} className="text-orange-400" />
            )}
            {updateState.status === UpdateStatus.NOT_AVAILABLE && (
              <CheckCircle size={14} className="text-green-400" />
            )}
            {updateState.status === UpdateStatus.DOWNLOADING && (
              <Download size={14} className="text-blue-400" />
            )}
            {updateState.status === UpdateStatus.DOWNLOADED && (
              <CheckCircle size={14} className="text-green-400" />
            )}
            {updateState.status === UpdateStatus.ERROR && (
              <AlertTriangle size={14} className="text-red-400" />
            )}
            
            <span className="text-xs">
              {updateState.status === UpdateStatus.NOT_CHECKED && 'Chưa kiểm tra'}
              {updateState.status === UpdateStatus.CHECKING && 'Đang kiểm tra...'}
              {updateState.status === UpdateStatus.AVAILABLE && 'Có bản cập nhật mới'}
              {updateState.status === UpdateStatus.NOT_AVAILABLE && 'Đã cập nhật mới nhất'}
              {updateState.status === UpdateStatus.DOWNLOADING && 'Đang tải cập nhật...'}
              {updateState.status === UpdateStatus.DOWNLOADED && 'Sẵn sàng cài đặt'}
              {updateState.status === UpdateStatus.ERROR && 'Lỗi cập nhật'}
            </span>
          </div>
        </div>
        
        {/* Thông tin cập nhật mới */}
        {updateState.status === UpdateStatus.AVAILABLE && updateState.info && (
          <div className="py-2 px-3 bg-orange-500/10 border border-orange-500/20 rounded">
            <p className="text-xs font-medium text-orange-400 flex items-center gap-1">
              <Info size={12} />
              Phiên bản mới: {updateState.info.version}
            </p>
            {updateState.info.releaseNotes && (
              <p className="text-xs text-neutral-300 mt-1 line-clamp-2">
                {typeof updateState.info.releaseNotes === 'string'
                  ? updateState.info.releaseNotes
                  : updateState.info.releaseNotes.join(' • ')}
              </p>
            )}
          </div>
        )}
        
        {/* Thông tin lỗi */}
        {updateState.status === UpdateStatus.ERROR && updateState.error && (
          <div className="py-2 px-3 bg-red-500/10 border border-red-500/20 rounded">
            <p className="text-xs text-red-400">{updateState.error}</p>
          </div>
        )}
        
        {/* Tiến trình */}
        {updateState.status === UpdateStatus.DOWNLOADING && updateState.progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400">Tiến trình</span>
              <span className="text-neutral-300">{updateState.progress.percent.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all" 
                style={{ width: `${updateState.progress.percent}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Nút hành động */}
        <div className="flex flex-wrap gap-2">
          {updateState.status === UpdateStatus.AVAILABLE && (
            <Button
              size="sm"
              variant="default"
              onClick={downloadUpdate}
              className="flex items-center gap-1"
              disabled={isCheckingForUpdate}
            >
              <Download size={14} />
              Tải xuống
            </Button>
          )}
          
          {updateState.status === UpdateStatus.DOWNLOADED && (
            <Button
              size="sm"
              variant="default"
              onClick={installUpdate}
              className="flex items-center gap-1"
              disabled={isCheckingForUpdate}
            >
              <RotateCw size={14} />
              Cài đặt ngay
            </Button>
          )}
          
          <Button
            size="sm"
            variant="secondary"
            onClick={checkForUpdates}
            className="flex items-center gap-1"
            disabled={isCheckingForUpdate}
          >
            {isCheckingForUpdate ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Đang kiểm tra...
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                Kiểm tra cập nhật
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
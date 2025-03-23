import React, { useState } from 'react'
import { LogOut, Moon, Sun, Monitor, User, Volume2, BellRing, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'

interface SettingsMenuProps {
  isVisible: boolean
  onClose: () => void
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ isVisible, onClose }) => {
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [volume, setVolume] = useState<number>(80)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true)

  // Xử lý logout
  const handleLogout = () => {
    logout()
    onClose()
  }

  // Xử lý thay đổi theme
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
  }

  // Xử lý thay đổi âm lượng
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value))
  }

  // Xử lý bật/tắt thông báo
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled)
  }

  if (!isVisible) return null

  // Nếu không hiển thị, không render gì cả
  if (!isVisible) return null;

  return (
    <div className="absolute top-10 right-4 w-64 bg-bg-secondary rounded-md shadow-lg border border-border-medium translate-x-2">
      {/* Header */}
      <div className="p-3 border-b border-border-light flex justify-between items-center">
        <h3 className="text-sm font-medium">Cài đặt</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
          <span className="sr-only">Đóng</span>
          <X size={16} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-4">
        {/* Theme */}
        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-text-tertiary">Giao diện</h4>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={theme === 'light' ? 'outline' : 'default'}
              size="sm"
              className="flex-1 rounded-full text-xs"
              onClick={() => handleThemeChange('light')}
              disabled={theme === 'light'}
            >
              <Sun size={16} className="mr-1" />
              Sáng
            </Button>
            <Button
              variant={theme === 'dark' ? 'outline' : 'default'}
              size="sm"
              className="flex-1 rounded-full text-xs"
              onClick={() => handleThemeChange('dark')}
              disabled={theme === 'dark'}
            >
              <Moon size={16} className="mr-1" />
              Tối
            </Button>
            <Button
              variant={theme === 'system' ? 'outline' : 'default'}
              size="sm"
              className="flex-1 rounded-full text-xs"
              onClick={() => handleThemeChange('system')}
              disabled={theme === 'system'}
            >
              <Monitor size={16} className="mr-1" />
              Tự động
            </Button>
          </div>
        </div>

        {/* Sound volume */}
        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-text-tertiary">Âm thanh</h4>
          <div className="flex items-center gap-2">
            <Volume2 size={16} />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 rounded-lg appearance-none bg-bg-tertiary cursor-pointer volume-slider"
            />
            <span className="text-xs">{volume}%</span>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-text-tertiary">Thông báo</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing size={16} />
              <span className="text-sm">Thông báo cuộc gọi</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={toggleNotifications}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-2 border-t border-border-light">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut size={16} className="mr-1" />
            Đăng xuất
          </Button>
        </div>
      </div>
    </div>
  )
}
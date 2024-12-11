import React, { useState, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'
import { clearLocalStorage } from '@/store/LocalStorage'
import { LogOut } from 'lucide-react'

interface DialogProps {
  children?: React.ReactNode
  className?: string
}

export const LeftBar: React.FC<DialogProps> = ({ className, children }) => {
  return (
    <div
      className={twMerge(
        'flex flex-row justify-start min-w-[100vw] min-h-[100vh] pt-10 overflow-y-hidden scrollbar-small',
        className
      )}
    >
      <div
        className={
          'flex flex-col w-[300px] min-h-full p-5 mr-auto gap-1 border-r-2 border-gray-400'
        }
      >
        <div className={'flex p-2 gap-2'}>
          <button className={'px-3 py-1 w-fit rounded-sm text-white bg-orange-300 hover:bg-orange-200'}>CDR</button>
          <button className={'px-3 py-1 w-fit rounded-sm text-white bg-orange-300 hover:bg-orange-200'}>Danh bạ</button>
        </div>
        <div className={'flex flex-col mx-auto gap-2 mt-auto'}>
          <button
            onClick={() => {
              // clearLocalStorage()
              window.electron.ipcRenderer.send('logout')
            }}
            className="px-2 py-2 w-fit rounded-full bg-red-500 text-white"
          >
            <LogOut size={20}/>
          </button>
        </div>
      </div>
      <main className={'w-full p-2'}>{children}</main>
    </div>
  )
}

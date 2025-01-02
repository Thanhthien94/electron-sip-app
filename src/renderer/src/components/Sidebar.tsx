import React, { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { clearLocalStorage } from '@/store/LocalStorage'
import { Power } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CDR from '@/components/CDR'
import Customer from '@/components/Customer'

interface DialogProps {
  children?: React.ReactNode
  className?: string
}

const logout = () => {
  clearLocalStorage()
  window.electron.ipcRenderer.send('logout')
}

export const Sidebar: React.FC<DialogProps> = ({ className }) => {

  return (
    <div
      className={twMerge(
        'flex flex-row justify-start min-h-full pt-10 overflow-y-hidden scrollbar-small',
        className
      )}
    >
      <Tabs
        defaultValue="cdr"
        className="w-[400px] border-r border-gray-400 flex flex-col items-center"
      >
        <TabsList className="grid w-[90%] grid-cols-2 gap-1 items-center justify-center bg-neutral-50/20">
          <TabsTrigger value="cdr">CDR</TabsTrigger>
          <TabsTrigger value="contact">Danh bạ</TabsTrigger>
        </TabsList>
        <TabsContent value="cdr">
          <CDR />
        </TabsContent>
        <TabsContent value="contact">
          <Customer />
        </TabsContent>
        <div className={'absolute bottom-2'}>
          <button
            onClick={logout}
            className="px-2 py-2 w-fit rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <Power size={20} />
          </button>
        </div>
      </Tabs>
      {/* <main className={'w-full p-2'}>{children}</main> */}
    </div>
  )
}

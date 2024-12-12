import React from 'react'
// import { MdClose } from 'react-icons/md'
import { twMerge } from 'tailwind-merge'
import {X} from 'lucide-react'

interface DialogProps {
  children?: React.ReactNode
  title?: string
  isOpen?: boolean
  onClose: () => void
  className?: string
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  className,
  children,
  title
}) => {
  return (
    <div
      className={`dialog backdrop-blur-sm fixed inset-0 flex items-center justify-center ${
        isOpen ? 'visible' : 'hidden'
      }`}
      onClick={onClose}
      onKeyDown={(e: any) => {
        if (e.keyCode === 27) {
          onClose()
        }
      }}
    >
      <div
        className={`dialog-content fixed drop-shadow-md p-3 border-[0.5px] border-t-4 border-green-500 top-[50%] left-[50%] max-h-full h-full md:h-auto md:max-h-[90vh] w-full md:w-auto md:max-w-5xl translate-x-[-50%] translate-y-[-50%] md:rounded-2xl overflow-hidden focus:outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`dialog-title text-center py-4 border-neutral-500 ${!title ? 'hidden' : ''}`}
        >
          <h2 className="text-xl font-bold mt-2 ">{title}</h2>
        </div>
        <div className="button-close flex">
          <button
            className="
            hover:text-white
            bg-neutral-600/50
            text-orange-500
            absolute
            top-[5px]
            right-[5px]
            inline-flex
            h-[20px]
            w-[20px]
            appearance-none
            items-center
            justify-center
            rounded-full
            focus:outline-none
            rotateZ
          "
            onClick={onClose}
          >
            <X size={10} />
          </button>
        </div>
        {/* Add other form */}
        <main
          className={twMerge(
            'flex flex-col mt-2 rounded-t-3xl h-full max-h-[90vh] w-fit md:max-h-[80vh] overflow-y-auto scrollbar-small',
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default Dialog

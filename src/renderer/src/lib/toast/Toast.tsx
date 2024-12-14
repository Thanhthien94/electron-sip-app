import React from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



interface ToastProps {
    // position?: ToastPosition
    children: React.ReactNode
}
// interface ToastOptions {
//     position: 'bottom-left'|'top-right' | 'top-center' | 'top-left';
//     autoClose: number;
//     theme: 'colored' | 'dark';
//     closeButton: boolean;
//   }
const Toast: React.FC<ToastProps> = ({
    children
}) => {

    return (
        <>
            <ToastContainer theme="colored" position="bottom-left" stacked/>
            <div className="min-h-[100vh]">
            {children}
            </div>
        </>
     );
}

export default Toast;

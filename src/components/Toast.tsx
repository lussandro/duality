import {
  BsFillCheckCircleFill,
  BsFillExclamationTriangleFill,
  BsInfoCircleFill,
  BsFillXCircleFill,
} from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { AiOutlineLoading } from 'react-icons/ai';
import { IoClose } from 'react-icons/io5';

interface ToastProps {
  type: 'success' | 'error' | 'information' | 'warning' | 'loading';
  message: string;
  index: number;
}

const Toast: React.FC<ToastProps> = ({ type, message, index }) => {
  const [toasts, setToasts] = useState<
    {
      id: number;
      message: string;
      type: 'success' | 'error' | 'information' | 'warning' | 'loading';
    }[]
  >([]);

  useEffect(() => {
    setToasts((prevToasts) => {
      if (prevToasts.some((toast) => toast.message === message && toast.id === index)) {
        return prevToasts;
      }

      const newToasts = [...prevToasts, { id: index, message, type }];

      setTimeout(() => {
        handleClose(index);
      }, 10000);

      return newToasts;
    });
  }, [message, index, type]);

  const handleClose = (id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const getIcon = (toastType: 'success' | 'error' | 'information' | 'warning' | 'loading') => {
    switch (toastType) {
      case 'success':
        return <BsFillCheckCircleFill className="w-5 h-5" />;
      case 'error':
        return <BsFillXCircleFill className="w-5 h-5" />;
      case 'information':
        return <BsInfoCircleFill className="w-5 h-5" />;
      case 'warning':
        return <BsFillExclamationTriangleFill className="w-5 h-5" />;
      case 'loading':
        return (
          <AiOutlineLoading
            className="w-5 h-5 animate-spin"
            style={{ animationDuration: '0.5s' }}
          />
        );
      default:
        return null;
    }
  };

  const getToastColor = (
    toastType: 'success' | 'error' | 'information' | 'warning' | 'loading'
  ) => {
    switch (toastType) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'information':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'loading':
        return 'bg-text-secundary';
      default:
        return '';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            layout
            className={`flex rounded-xl p-4 items-center mb-2 ${getToastColor(toast.type)}`}
          >
            {getIcon(toast.type)}
            <div className="font-medium text-sm cursor-default mx-2">{toast.message}</div>
            <IoClose
              className="w-5 h-5 hover:opacity-50 transition-all duration-300 cursor-pointer"
              onClick={() => handleClose(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;

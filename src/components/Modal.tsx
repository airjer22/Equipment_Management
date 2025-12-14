import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'center' | 'bottom';
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  position = 'center',
}: ModalProps) {
  useEffect(() => {
    // Don't lock body scroll - let the modal overlay handle scrolling
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  const contentClasses = position === 'bottom'
    ? 'rounded-t-2xl w-full animate-slide-up'
    : 'rounded-2xl animate-scale-in';

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black bg-opacity-50 overflow-y-auto py-8">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className={`relative bg-white dark:bg-gray-800 ${contentClasses} ${sizeClasses[size]} w-full max-w-full mx-4 my-auto shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

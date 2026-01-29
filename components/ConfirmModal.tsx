'use client';

// FIX: Import React to use React.FC.
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isSubmitting?: boolean;
  isLoading?: boolean;
  confirmText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isSubmitting = false,
  isLoading = false,
  confirmText = 'Delete',
}) => {
  if (!isOpen) return null;
  
  const loading = isSubmitting || isLoading;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center animate-fadeIn p-4">
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-md transform transition-all animate-slideUp border-2 sm:border-4 border-brand-red">
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-brand-red/10 animate-pulse">
              <AlertTriangle className="h-5 w-5 sm:h-7 sm:w-7 text-brand-red" aria-hidden="true" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-brand-red">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 sm:p-2 rounded-lg transition-all"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="mb-6 sm:mb-8">
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">{message}</p>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            type="button"
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-white bg-brand-red hover:bg-brand-red/90 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </span>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
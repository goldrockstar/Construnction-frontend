import React from 'react';
import { createPortal } from 'react-dom';
import { XCircle } from 'lucide-react'; 

const Modal = ({ children, onClose }) => {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-full overflow-y-auto rounded-lg shadow-xl bg-white p-6">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <XCircle size={24} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;

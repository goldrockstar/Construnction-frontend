import React from 'react';
import { XCircle } from 'lucide-react';

const Modal = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 font-sans antialiased">
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-lg shadow-xl overflow-hidden transform transition-all sm:my-8 sm:w-full">
        <div className="flex justify-between items-center bg-gray-100 p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

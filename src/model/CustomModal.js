import React from 'react';
import { createPortal } from 'react-dom';

const CustomModal = ({ children, onClose }) => {
    return createPortal(
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-h-[90vh] overflow-y-auto w-full max-w-2xl transform transition-all scale-100 opacity-100">
                <div className="p-6 relative">
                    {children}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none"
                    >
                        {/* A simple close icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CustomModal;
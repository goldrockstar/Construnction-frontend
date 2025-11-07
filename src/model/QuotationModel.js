import React from 'react';
const Modal = ({ message, type = 'alert', onClose, onConfirm }) => {

    // Headings and button styles based on the type
    let title = 'Notification';
    let headerClass = 'text-blue-600';
    
    if (type === 'confirm') {
        title = 'Confirm Action';
        headerClass = 'text-red-600';
    }

    if (!message) {
        // If no message is passed, don't render a broken modal (optional safeguard)
        return null;
    }

    return (
        // Overlay (Outer container)
        <div className='fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 transition-opacity duration-300'>
            
            {/* Modal Box */}
            <div className='bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-sm transform transition-all duration-300 scale-100'>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                    <h3 className={`text-xl font-bold ${headerClass}`}>
                        {title}
                    </h3>
                </div>

                {/* Body - Message Content */}
                <div className="mb-6">
                    {/* 🎯 நீங்கள் ஸ்கிரீன்ஷாட்டில் காணாமல் போன செய்தி இதுதான். */}
                    <p className='text-gray-700 text-base'>
                        {message}
                    </p>
                </div>

                {/* Footer - Action Buttons */}
                <div className='flex justify-end space-x-3'>
                    
                    {type === 'confirm' ? (
                        // Confirmation (Yes / No) Buttons
                        <>
                            <button 
                                onClick={onClose} 
                                className='px-4 py-2 text-gray-700 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition duration-150'
                            >
                                No / Cancel
                            </button>
                            <button 
                                onClick={onConfirm} 
                                className='px-4 py-2 text-white bg-red-600 rounded-lg font-medium hover:bg-red-700 transition duration-150'
                            >
                                Yes, Proceed
                            </button>
                        </>
                    ) : (
                        // Alert (OK) Button
                        <button 
                            onClick={onClose} 
                            className='px-6 py-2 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 transition duration-150'
                        >
                            OK
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
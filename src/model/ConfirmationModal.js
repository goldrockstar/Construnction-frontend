import React from 'react';

const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => {
    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 mb-4">{message}</p>
            <div className="flex justify-end space-x-2">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default ConfirmationModal;
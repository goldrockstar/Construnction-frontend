import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = "Loading..." }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-xl">
                <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-700 text-lg font-medium">{message}</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;

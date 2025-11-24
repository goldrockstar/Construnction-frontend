import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

// TransactionForm handles both Income and manual Expense (like Transport) entries.
const TransactionForm = ({ transaction, onClose, projectId, type }) => {
    const isEditing = !!transaction;
    const isIncome = type === 'Income';

    const [formData, setFormData] = useState({
        projectId: projectId || '',
        transactionDate: '',
        amount: '',
        description: '',
        type: type, // 'Income' or 'Expense'
        // 'category' will specify the type of expense (e.g., 'Transport')
        category: isIncome ? 'Income' : 'Transport Charges', 
    });

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const formatDateToInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        // Initialize or populate form data
        if (transaction) {
            setFormData({
                projectId: transaction.projectId || projectId || '',
                transactionDate: formatDateToInput(transaction.transactionDate),
                amount: transaction.amount || '',
                description: transaction.description || '',
                type: transaction.type || type,
                category: transaction.category || (isIncome ? 'Income' : 'Transport Charges'),
            });
        } else {
            setFormData(prev => ({
                ...prev,
                projectId: projectId || '',
                transactionDate: formatDateToInput(new Date()),
                amount: '',
                description: '',
                type: type,
                category: isIncome ? 'Income' : 'Transport Charges',
            }));
        }
    }, [transaction, projectId, type, isIncome]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        setSuccessMessage(null);

        if (!formData.transactionDate || !formData.amount || !formData.projectId) {
            setFormError('Please fill in all required fields (Project ID, Date, Amount).');
            setSubmitting(false);
            return;
        }

        if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
            setFormError('Amount must be a positive number.');
            setSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication token not found. Please log in.");

            const url = transaction
                ? `${API_BASE_URL}/transactions/${transaction._id}`
                : `${API_BASE_URL}/transactions`;
            const method = transaction ? 'PUT' : 'POST';

            const payload = {
                // IMPORTANT: The backend expects 'project' for the ID, not 'projectId'
                project: formData.projectId, 
                transactionDate: formData.transactionDate,
                amount: parseFloat(formData.amount),
                description: formData.description || '',
                type: formData.type,
                category: formData.category, // Transport Charges or Income
            };

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${transaction ? 'update' : 'add'} ${formData.type}.`);
            }

            setSuccessMessage(`${formData.type} ${transaction ? 'updated' : 'added'} successfully!`);
            
            // Auto-close on success
            setTimeout(() => {
                onClose(true); // Pass true to indicate successful submission and trigger data refresh
            }, 1000); 

        } catch (error) {
            console.error('Form submission error:', error);
            setFormError(error.message || 'An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    const title = isEditing 
        ? `Edit ${isIncome ? 'Income' : 'Transport Expense'}` 
        : `Add New ${isIncome ? 'Income' : 'Transport Expense'}`;
        
    const submitButtonText = submitting 
        ? 'Saving...' 
        : (isEditing ? 'Update' : (isIncome ? 'Add Income' : 'Add Expense'));

    return (
        <div className="p-6 bg-white rounded-xl max-w-lg w-full">
            <h2 className={`text-2xl font-bold mb-6 text-center ${isIncome ? 'text-green-700' : 'text-red-700'}`}>{title}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Project ID (Read-only) */}
                <div className="form-group">
                    <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">Project ID (Read Only):</label>
                    <input
                        type="text"
                        id="projectId"
                        name="projectId"
                        value={formData.projectId}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed text-xs"
                    />
                </div>
                <div className='form-group'>
                    <label className="block text-sm font-medium text-gray-700">Type:</label>
                    <input
                        type="text"
                        id="type"
                        name="type"
                        value={formData.type}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed text-xs"
                    />
                </div>
                
                {/* Transaction Date */}
                <div className="form-group">
                    <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        id="transactionDate"
                        name="transactionDate"
                        value={formData.transactionDate}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    />
                </div>

                {/* Amount */}
                <div className="form-group">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (₹) <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        placeholder="e.g., 50000"
                    />
                </div>

                {/* Description */}
                <div className="form-group">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                        placeholder={isIncome ? "e.g., Client Advance / Second Payment" : "e.g., Material delivery charges"}
                    ></textarea>
                </div>
                
                {/* Error/Success Messages (using basic Tailwind styling instead of a full Modal for simplicity) */}
                {formError && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">{formError}</div>}
                {successMessage && <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">{successMessage}</div>}


                <div className="form-actions flex justify-end space-x-3 pt-4">
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className={`px-6 py-2 rounded-lg font-semibold shadow-md transition-colors duration-200 flex items-center justify-center ${
                            submitting 
                                ? 'bg-gray-400' 
                                : (isIncome ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700')
                        } text-white`}
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitButtonText}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => onClose(false)} // Pass false for no refresh
                        disabled={submitting}
                        className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-colors duration-200 shadow-md"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TransactionForm;
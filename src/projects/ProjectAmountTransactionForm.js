// src/components/ProjectAmountTransactionForm.js
import React, { useState, useEffect } from 'react';
import MessageModal from '../model/MessageModal';

const API_BASE_URL = 'http://localhost:5000/api';

// Renamed clientId prop to projectId for clarity
const ProjectAmountTransactionForm = ({ transaction, onClose, projectId }) => {
    // State to hold the form data. We now exclusively use 'projectId'.
    const [formData, setFormData] = useState({
        projectId: projectId || '', // Initialize with projectId prop
        transactionDate: '',
        amount: '',
        description: '',
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
        if (transaction) {
            // If a transaction is passed, populate the form for editing
            setFormData({
                // Ensure projectId is correctly populated from the transaction object
                projectId: transaction.projectId || projectId || '', // Use transaction.projectId if available
                transactionDate: formatDateToInput(transaction.transactionDate),
                amount: transaction.amount || '',
                description: transaction.description || '',
            });
        } else {
            // If no transaction is passed, initialize form for a new entry with today's date
            setFormData(prev => ({
                ...prev,
                projectId: projectId || '', // Ensure the projectId prop is used for new transactions
                transactionDate: formatDateToInput(new Date()),
            }));
        }
    }, [transaction, projectId]); // Changed dependency to projectId

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        setSuccessMessage(null);

        if (!formData.transactionDate || !formData.amount) {
            setFormError('Please fill in all required fields: Transaction Date and Amount.');
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
            if (!token) {
                setFormError("Authentication token not found. Please log in.");
                setSubmitting(false);
                return;
            }

            const url = transaction
                ? `${API_BASE_URL}/transactions/${transaction._id}`
                : `${API_BASE_URL}/transactions`;
            const method = transaction ? 'PUT' : 'POST';

            const payload = {
                // இதுதான் முக்கியமான திருத்தம்: பேக்கெண்ட் 'project' என்ற பெயரை எதிர்பார்த்ததால்,
                // இங்கு 'projectId' என்பதை 'project' என்று மாற்றப்பட்டுள்ளது.
                project: formData.projectId,
                transactionDate: formData.transactionDate,
                amount: parseFloat(formData.amount),
                description: formData.description || '',
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
                throw new Error(errorData.message || `Failed to ${transaction ? 'update' : 'add'} transaction.`);
            }

            setSuccessMessage(`Transaction ${transaction ? 'updated' : 'added'} successfully!`);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Form submission error:', error);
            setFormError(error.message || 'An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg max-w-lg w-full mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">{transaction ? 'Edit Transaction' : 'Add New Transaction'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* projectId is implicitly handled by the context/parent, no need for a visible input */}
                {/* If you wanted to display it (read-only), you could uncomment this and change clientId to projectId */}
                
                <div className="form-group">
                    <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">Project ID:</label>
                    <input
                        type="text"
                        id="projectId"
                        name="projectId"
                        value={formData.projectId}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                    />
                </div>
                

                <div className="form-group">
                    <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">Transaction Date <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        id="transactionDate"
                        name="transactionDate"
                        value={formData.transactionDate}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., 50000"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Initial amount received"
                    ></textarea>
                </div>

                {formError && <MessageModal message={formError} onClose={() => setFormError(null)} />}
                {successMessage && <MessageModal message={successMessage} onClose={() => setSuccessMessage(null)} />}

                <div className="form-actions flex justify-end space-x-3 mt-6">
                    <button type="submit" disabled={submitting}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200">
                        {submitting ? 'Saving...' : (transaction ? 'Update' : 'Save')}
                    </button>
                    <button type="button" onClick={onClose} disabled={submitting}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectAmountTransactionForm;

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const TransactionForm = ({ transaction, onClose, projectId, type }) => {
    const isEditing = !!transaction;
    const isIncome = type === 'Income';

    // New State for Project List
    const [projectsList, setProjectsList] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    const [formData, setFormData] = useState({
        projectId: projectId || '', // Default to prop if available
        transactionDate: '',
        amount: '',
        description: '',
        type: type, 
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

    // 1. Fetch Projects List (To show in dropdown)
    useEffect(() => {
        const fetchProjects = async () => {
            setLoadingProjects(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch(`${API_BASE_URL}/projects`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Failed to fetch projects');

                const data = await response.json();
                const list = Array.isArray(data) ? data : (data.projects || []);
                setProjectsList(list);
            } catch (err) {
                console.error("Error fetching projects:", err);
            } finally {
                setLoadingProjects(false);
            }
        };
        fetchProjects();
    }, []);

    // 2. Initialize Form Data
    useEffect(() => {
        if (transaction) {
            setFormData({
                projectId: transaction.projectId || projectId || '',
                transactionDate: formatDateToInput(transaction.transactionDate || transaction.date),
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

        // Validation: Project ID must be selected
        if (!formData.projectId) {
            setFormError('Please select a Project.');
            setSubmitting(false);
            return;
        }

        if (!formData.transactionDate || !formData.amount) {
            setFormError('Date and Amount are required.');
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
                project: formData.projectId, // Use selected ID
                transactionDate: formData.transactionDate,
                amount: parseFloat(formData.amount),
                description: formData.description || '',
                type: formData.type,
                category: formData.category,
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
            
            setTimeout(() => {
                onClose(true); 
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
                
                {/* Project Selection Dropdown (Replaces Read-Only ID) */}
                <div className="form-group">
                    <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">Select Project <span className="text-red-500">*</span></label>
                    <select
                        id="projectId"
                        name="projectId"
                        value={formData.projectId}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white"
                        // If projectId prop was passed (from Project List), lock this field. Otherwise allow selection.
                        disabled={!!projectId || loadingProjects} 
                    >
                        <option value="">{loadingProjects ? 'Loading Projects...' : '-- Select a Project --'}</option>
                        {projectsList.map(project => (
                            <option key={project._id} value={project._id}>
                                {project.projectName}
                            </option>
                        ))}
                    </select>
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
                
                {/* Error/Success Messages */}
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
                        onClick={() => onClose(false)} 
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
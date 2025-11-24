import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const PersonalExpenditureForm = ({ expenditure, onClose, onSaveSuccess }) => {
   const [formData, setFormData] = useState({
        fromDate: '',
        toDate: '',
        amount: '',
        description: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [formMessage, setFormMessage] = useState(null);

    // Populate form data if an expenditure record is passed for editing.
    useEffect(() => {
        if (expenditure) {
            setFormData({
                fromDate: expenditure.fromDate ? expenditure.fromDate.split('T')[0] : '',
                toDate: expenditure.toDate ? expenditure.toDate.split('T')[0] : '',
                amount: expenditure.amount || '',
                description: expenditure.description || '',
            });
        } else {
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                fromDate: today,
                toDate: today,
                amount: '',
                description: '',
            });
        }
    }, [expenditure]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        setFormMessage(null);

        // Basic client-side validation
        if (!formData.fromDate || !formData.toDate || formData.amount === '' || !formData.description) {
            setFormError("From Date, To Date, Amount, and Description are required.");
            setSubmitting(false);
            return;
        }

        try {
            const dataToSave = { ...formData, amount: Number(formData.amount) };
            let response;
            let method;
            let url;

            // Determine if we're creating a new record or updating an existing one.
            if (expenditure && expenditure._id) { // Use _id instead of id as per MongoDB convention
                method = 'PUT';
                url = `${API_BASE_URL}/personal-Expenditures/${expenditure._id}`;
            } else {
                method = 'POST';
                url = `${API_BASE_URL}/personal-Expenditures`;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication failed. Please log in.');
            }

            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSave),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to save personal expenditure: ${response.statusText}`);
            }

            setFormMessage("Personal expenditure saved successfully!");
            // Call the success callback to close the modal and re-fetch data in the parent component
            onSaveSuccess();
        } catch (err) {
            console.error("Error saving personal expenditure:", err);
            setFormError("Failed to save: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="col-span-full text-2xl font-semibold mb-4 text-center">
                {expenditure ? 'Edit Personal Expenditure' : 'Add New Personal Expenditure'}
            </h3>
            {formError && <p className="col-span-full text-red-500 text-center mb-4 font-medium">{formError}</p>}
            {formMessage && <p className="col-span-full text-green-500 text-center mb-4 font-medium">{formMessage}</p>}

            <div>
                <label htmlFor="fromDate" className="block text-gray-700 text-sm font-bold mb-2">
                    From Date<span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    id="fromDate"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>
            <div>
                <label htmlFor="toDate" className="block text-gray-700 text-sm font-bold mb-2">
                    To Date<span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    id="toDate"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>
            <div>
                <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">
                    Amount<span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                    required
                />
            </div>
            <div className="col-span-full">
                <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                    Description<span className="text-red-500">*</span>
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter description"
                    rows="3"
                    required
                ></textarea>
            </div>

            <div className="col-span-full flex justify-end space-x-3 mt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                    disabled={submitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={submitting}
                >
                    {submitting ? 'Saving...' : (expenditure ? 'Update' : 'Save')}
                </button>
            </div>
        </form>
    );
};


export default PersonalExpenditureForm;
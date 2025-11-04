import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

const ReceiptForm = ({ receipt, onClose, setReceipts, customAlert }) => {
    const [formData, setFormData] = useState({
        receiptNo: '',
        date: '',
        amount: '',
        description: '',
        signedDate: '',
        signatureImage: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (receipt) {
            setFormData({
                receiptNo: receipt.receiptNo || '',
                date: receipt.date ? new Date(receipt.date).toISOString().split('T')[0] : '',
                amount: receipt.amount || '',
                description: receipt.description || '',
                signedDate: receipt.signedDate ? new Date(receipt.signedDate).toISOString().split('T')[0] : '',
                signatureImage: receipt.signatureImage || '',
            });
        } else {
            setFormData({
                receiptNo: '',
                date: new Date().toISOString().split('T')[0],
                amount: '',
                description: '',
                signedDate: new Date().toISOString().split('T')[0],
                signatureImage: '',
            });
        }
        setError(null);
        setSuccess(false);
    }, [receipt]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError(null);
        setSuccess(false);

        if (!formData.receiptNo || !formData.date || !formData.amount || !formData.description) {
            setError("Receipt number, date, amount, and description are required.");
            setLoading(false);
            return;
        }

        if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
            setError("Amount must be a positive number.");
            setLoading(false);
            return;
        }

        try {
            const dataToSave = { ...formData, amount: Number(formData.amount) };
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Token not found. Please log in again.");
            }

            let response;
            if (receipt && receipt._id) { // Use _id for MongoDB compatibility
                // Update existing receipt
                response = await fetch(`${API_BASE_URL}/receipts/${receipt._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(dataToSave),
                });
            } else {
                // Add new receipt
                response = await fetch(`${API_BASE_URL}/receipts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ...dataToSave, createdAt: new Date().toISOString() }),
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error: ${response.statusText}`);
            }

            const result = await response.json();

            setSuccess(true);
            customAlert(receipt ? "Receipt Saved Successfully!" : "New Receipt Saved Successfully!");

            // Update the state in the parent component
            setReceipts(prevReceipts => {
                if (receipt) {
                    return prevReceipts.map(r => r._id === receipt._id ? result : r);
                } else {
                    return [result, ...prevReceipts]; // Changed to add new receipt to the top
                }
            });

            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err) {
            console.error("Error saving receipt:", err);
            setError("Error saving receipt: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="col-span-full text-xl font-semibold mb-4">{receipt ? "Update Receipt" : "Add New Receipt"}</h3>
            {error && <p className="col-span-full text-red-500 mb-4">{error}</p>}
            {success && <p className="col-span-full text-green-500 mb-4">Receipt saved successfully!</p>}
            <div>
                <label htmlFor="receiptNo" className="block text-gray-700 text-sm font-bold mb-2">
                    Receipt No <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="receiptNo"
                    name="receiptNo"
                    value={formData.receiptNo}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter receipt number"
                    required
                />
            </div>
            <div>
                <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">
                    Date <span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                />
            </div>
            <div>
                <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">
                    Amount <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter amount"
                    required
                />
            </div>
            <div className="col-span-full">
                <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                    Description <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter description"
                    rows="3"
                    required
                ></textarea>
            </div>
            <div>
                <label htmlFor="signedDate" className="block text-gray-700 text-sm font-bold mb-2">
                    Signed Date
                </label>
                <input
                    type="date"
                    id="signedDate"
                    name="signedDate"
                    value={formData.signedDate}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
            </div>
            <div>
                <label htmlFor="signatureImage" className="block text-gray-700 text-sm font-bold mb-2">
                    Signature
                </label>
                <input
                    type="text"
                    id="signatureImage"
                    name="signatureImage"
                    value={formData.signatureImage}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter signature URL"
                />
            </div>
            <div className="col-span-full flex justify-end space-x-3 mt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : (receipt ? 'Update' : 'Add')}
                </button>
            </div>
        </form>
    );
};

export default ReceiptForm;
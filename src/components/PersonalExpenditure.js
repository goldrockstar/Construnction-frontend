import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../model/Modal';
import PersonalExpenditureForm from './PersonalExpenditureForm';
import ConfirmationModal from '../model/ConfirmationModal';
import  { Edit, Trash2, PlusCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const PersonalExpenditure = () => {
    const [personalExpenditures, setPersonalExpenditures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [currentPersonalExpenditure, setCurrentPersonalExpenditure] = useState(null);
    const [deleteItemId, setDeleteItemId] = useState(null);

    const navigate = useNavigate();

    // Use useCallback to memoize the fetch function to prevent infinite loops in useEffect.
    const fetchPersonalExpenditures = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // If no token exists, the user is not authenticated.
                // We can stop here and show a message.
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await fetch(`${API_BASE_URL}/personal-expenditures`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch personal expenditures: ${response.statusText}`);
            }

            const data = await response.json();
            setPersonalExpenditures(data);
        } catch (err) {
            console.error("Error fetching personal expenditures:", err);
            setError("Failed to fetch personal expenditures. " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch data when the component mounts.
    useEffect(() => {
        fetchPersonalExpenditures();
    }, [fetchPersonalExpenditures]);

    const handleDelete = (id) => {
        setDeleteItemId(id);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        setShowConfirmModal(false);
        if (!deleteItemId) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }
            const response = await fetch(`${API_BASE_URL}/personal-expenditures/${deleteItemId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete personal expenditure: ${response.statusText}`);
            }

            // Optimistically update the UI by removing the item without re-fetching all data.
            // This is more performant for small changes.
            setPersonalExpenditures(prev => prev.filter(item => item._id !== deleteItemId));
            setError(null); // Clear any previous errors if deletion was successful
        } catch (err) {
            console.error("Error deleting personal expenditure:", err);
            setError("Failed to delete personal expenditure: " + err.message);
        } finally {
            setDeleteItemId(null);
        }
    };

    const handleEdit = (expenditure) => {
        setCurrentPersonalExpenditure(expenditure);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        setCurrentPersonalExpenditure(null);
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        fetchPersonalExpenditures();
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><p className="text-xl">Loading personal expenditures...</p></div>;
    }

    const handleBackClick = () => {
        navigate(-1);
    };

    return (
        <div className="p-2 font-sans bg-gray-100 w-full h-full">
            <div className="max-w-8xl bg-white p-2 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={handleBackClick}
                            className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                            title="Go Back"
                        >
                            <ArrowLeft size={20} className="mr-2" /> Back
                        </button>
                        <h2 className="text-3xl p-2 font-bold text-gray-800">Personal Expenditure</h2>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                         <PlusCircle size={20} className="mr-2" />Add New Expenditure
                    </button>
                </div>

                {error && <div className="text-red-500 text-center mb-4">{error}</div>}

                {personalExpenditures.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <p className="text-lg">No personal expenditures found.</p>
                        <p className="mt-2">Click "Add New Expenditure" to add one.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto shadow-md rounded-lg">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider rounded-tl-lg">S.No</th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">From Date</th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">To Date</th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {personalExpenditures.map((item, index) => (
                                    <tr key={item._id} className="hover:bg-gray-50">
                                        <td className="py-4 px-6 whitespace-nowrap">{index + 1}</td>
                                        <td className="py-4 px-6 whitespace-nowrap">{item.fromDate ? item.fromDate.split('T')[0] : 'N/A'}</td>
                                        <td className="py-4 px-6 whitespace-nowrap">{item.toDate ? item.toDate.split('T')[0] : 'N/A'}</td>
                                        <td className="py-4 px-6 whitespace-nowrap">₹{item.amount}</td>
                                        <td className="py-4 px-6 whitespace-nowrap">{item.description || 'N/A'}</td>
                                        <td className="py-4 px-6 whitespace-nowrap space-x-2">
                                            <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 transition-colors">
                                                <Edit size={20} />
                                            </button>
                                            <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-900 transition-colors">
                                                <Trash2 size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Render modals based on state */}
            {showFormModal && (
                <Modal onClose={handleFormClose}>
                    <PersonalExpenditureForm
                        expenditure={currentPersonalExpenditure}
                        onClose={handleFormClose}
                        onSaveSuccess={handleFormClose}
                    />
                </Modal>
            )}

            {showConfirmModal && (
                <ConfirmationModal
                    message="Are you sure you want to delete this personal expenditure record?"
                    onConfirm={confirmDelete}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </div>
    );
};
export default PersonalExpenditure;
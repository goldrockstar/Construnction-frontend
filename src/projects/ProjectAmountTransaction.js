// src/components/ProjectAmountTransaction.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from '../model/Modal';
import ConfirmModal from '../model/ConfirmModal';
import MessageModal from '../model/MessageModal';
import ProjectAmountTransactionForm from './ProjectAmountTransactionForm';
import { Edit, Trash2, PlusCircle, ArrowLeft } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const ProjectAmountTransaction = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [projectData, setProjectData] = useState({
        clientName: 'Loading...',
        projectName: 'Loading...',
        totalBudget: 0,
        givenAmount: 0,
        remainingAmount: 0
    });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [transactionIdToDelete, setTransactionIdToDelete] = useState(null);
    const [message, setMessage] = useState(null);

    // This function now fetches both the transaction list AND the summary in one API call.
    const fetchTransactionsAndSummary = useCallback(async () => {
        if (!projectId) {
            setError("Project ID is missing in the URL. Cannot fetch transactions.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Authentication token not found. Please log in.");
                setLoading(false);
                navigate('/login');
                return;
            }
            // Major change: Call the summary API endpoint which provides all data needed.
            const response = await fetch(`${API_BASE_URL}/transactions/summary/${projectId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    navigate('/login');
                    throw new Error('Invalid or expired token. Please log in again.');
                }
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch transactions: ${response.statusText}`);
            }
            const data = await response.json();

            // Update transactions list with data.data
            setTransactions(data.data || []);
            
            // Update project summary with data.summary
            if (data.summary) {
                setProjectData({
                    projectName: data.summary.projectName || 'N/A',
                    clientName: data.summary.clientName || 'N/A',
                    totalBudget: data.summary.totalBudget || 0,
                    givenAmount: data.summary.givenAmount || 0,
                    remainingAmount: data.summary.remainingAmount || 0
                });
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
            setError(err.message || "An error occurred while fetching transactions.");
        } finally {
            setLoading(false);
        }
    }, [projectId, navigate]);
    
    // Call the new combined function on initial load and when projectId changes
    useEffect(() => {
        if (projectId) {
            fetchTransactionsAndSummary();
        }
    }, [projectId, fetchTransactionsAndSummary]);

    const handleDelete = (transactionId) => {
        setTransactionIdToDelete(transactionId);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!transactionIdToDelete) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/transactions/${transactionIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete transaction.`);
            }

            setMessage("Transaction deleted successfully!");
            // Re-fetch transactions to update summary values after deletion
            fetchTransactionsAndSummary();
        } catch (err) {
            console.error("Error deleting transaction:", err);
            setMessage("An error occurred while deleting the transaction: " + err.message);
        } finally {
            setTransactionIdToDelete(null);
            setShowConfirmModal(false);
        }
    };

    const handleEdit = (transaction) => {
        setCurrentTransaction(transaction);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        setCurrentTransaction(null);
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        setCurrentTransaction(null);
        // Re-fetch transactions to update summary values after form submission
        fetchTransactionsAndSummary();
    };

    const handleBackClick = () => {
        navigate(-1);
    };

    if (loading) {
        return <div className="p-4 text-center text-gray-700">Loading transactions...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-700">{error}</div>;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={handleBackClick}
                    className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back
                </button>
                <h2 className="text-2xl font-semibold text-gray-800">
                    Transactions: {projectData.projectName || 'N/A'}
                </h2>
                <div></div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                    <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
                        <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                    </span>
                </div>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-gray-100 p-4 rounded-md shadow-inner">
                <div className="flex items-center space-x-2">
                    <span className="text-gray-700">Client:</span>
                    <span className="font-semibold text-gray-900">{projectData.clientName}</span>
                </div>
                <div className="flex items-center space-x-2 mt-2 md:mt-0">
                    <span className="text-gray-700">Total Budget:</span>
                    <span className="font-semibold text-gray-900">
                        {projectData.totalBudget?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                </div>
                <div className="flex items-center space-x-2 mt-2 md:mt-0">
                    <span className="text-gray-700">Amount Received:</span>
                    <span className="font-semibold text-green-600">
                        {projectData.givenAmount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                </div>
                <div className="flex items-center space-x-2 mt-2 md:mt-0">
                    <span className="text-gray-700">Remaining Amount:</span>
                    <span className="font-semibold text-red-600">
                        {projectData.remainingAmount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                </div>
            </div>

            <button
                onClick={handleAdd}
                className="mb-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 flex items-center"
            >
                <PlusCircle size={20} className="mr-2" /> Add New Transaction
            </button>

            {transactions.length === 0 ? (
                <p className="text-gray-600 italic">No transactions found for this project. Click "Add New Transaction" to add one.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-200">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((transaction) => (
                                <tr key={transaction._id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {new Date(transaction.transactionDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {transaction.amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                                        {transaction.description || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(transaction)}
                                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 transition duration-200"
                                                title="Edit Transaction"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(transaction._id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition duration-200"
                                                title="Delete Transaction"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showFormModal && (
                <Modal onClose={handleFormClose}>
                    <ProjectAmountTransactionForm
                        transaction={currentTransaction}
                        projectId={projectId}
                        onClose={handleFormClose}
                    />
                </Modal>
            )}

            {showConfirmModal && (
                <ConfirmModal
                    message="Are you sure you want to delete this transaction?"
                    onConfirm={confirmDelete}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}

            {message && (
                <MessageModal
                    message={message}
                    onClose={() => setMessage(null)}
                />
            )}
        </div>
    );
};

export default ProjectAmountTransaction;

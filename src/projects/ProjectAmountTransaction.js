import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from '../model/Modal';
import ConfirmModal from '../model/ConfirmModal';
import MessageModal from '../model/MessageModal';
import ProjectAmountTransactionForm from './ProjectAmountTransactionForm'; 
import { Edit, Trash2, PlusCircle, ArrowLeft, DollarSign, TrendingUp, TrendingDown, Building2, Calendar, FileText } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const ProjectAmountTransaction = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [formType, setFormType] = useState('Income'); 
    
    const [projectData, setProjectData] = useState({
        clientName: 'Loading...',
        projectName: 'Loading...',
        totalIncome: 0,
        totalExpense: 0,
        netProfitLoss: 0
    });

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [transactionIdToDelete, setTransactionIdToDelete] = useState(null);
    const [message, setMessage] = useState(null);

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
            setTransactions(data.allTransactions || []);
            
            if (data.summary) {
                setProjectData({
                    projectName: data.summary.projectName || 'N/A',
                    clientName: data.summary.clientName || 'N/A',
                    totalIncome: data.summary.totalIncome || 0, 
                    totalExpense: data.summary.totalExpense || 0, 
                    netProfitLoss: data.summary.netProfitLoss || 0 
                });
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
            setError(err.message || "An error occurred while fetching transactions.");
        } finally {
            setLoading(false);
        }
    }, [projectId, navigate]);
    
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
        if (transaction.source !== 'General') {
            setMessage("Only General Income/Expense transactions can be edited directly here. For Material or Manpower changes, please update them via their dedicated sections.");
            return;
        }

        setFormType(transaction.type || 'Income'); 
        setCurrentTransaction({
            _id: transaction.id,
            amount: transaction.amount,
            transactionDate: transaction.date,
            description: transaction.description,
            type: transaction.type,
        });
        setShowFormModal(true);
    };

    const handleAddIncome = () => {
        setFormType('Income');
        setCurrentTransaction(null);
        setShowFormModal(true);
    };
    
    const handleAddExpense = () => {
        setFormType('Expense');
        setCurrentTransaction(null);
        setShowFormModal(true);
    };

    const handleFormClose = (refresh = false) => {
        setShowFormModal(false);
        setCurrentTransaction(null);
        setFormType('Income');
        if (refresh) {
            fetchTransactionsAndSummary();
        }
    };

    const handleBackClick = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md w-full">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">!</span>
                            </div>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-red-800 font-semibold">Error</h3>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 overflow-hidden">
            <div className="max-w-full mx-auto h-full flex flex-col">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleBackClick}
                            className="flex items-center px-4 py-3 bg-white text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md border border-indigo-100"
                        >
                            <ArrowLeft size={20} className="mr-2" /> Back
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                <DollarSign className="h-7 w-7 mr-3 text-indigo-600" />
                                Income & Expense Transactions
                            </h1>
                            <p className="text-gray-600 text-sm mt-1">Manage income and expenses for {projectData.projectName}</p>
                        </div>
                    </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                    {/* Project Info Card */}
                    <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Building2 className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-gray-700">Project</h3>
                                <p className="text-sm font-bold text-gray-900 truncate">{projectData.projectName}</p>
                                <p className="text-xs text-gray-600">Client: {projectData.clientName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Income Card */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-xs font-medium">Total Income</p>
                                <p className="text-xl font-bold mt-1">
                                    ₹{projectData.totalIncome?.toLocaleString('en-IN') || '0'}
                                </p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-lg">
                                <TrendingUp size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Total Expense Card */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-xs font-medium">Total Expense</p>
                                <p className="text-xl font-bold mt-1">
                                    ₹{projectData.totalExpense?.toLocaleString('en-IN') || '0'}
                                </p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-lg">
                                <TrendingDown size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Net Profit/Loss Card */}
                    <div className={`rounded-xl p-4 shadow-lg text-white ${
                        projectData.netProfitLoss >= 0 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                            : 'bg-gradient-to-r from-red-500 to-pink-600'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-xs font-medium">
                                    {projectData.netProfitLoss >= 0 ? 'Net Profit' : 'Net Loss'}
                                </p>
                                <p className="text-xl font-bold mt-1">
                                    ₹{Math.abs(projectData.netProfitLoss)?.toLocaleString('en-IN') || '0'}
                                </p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-lg">
                                <DollarSign size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <button
                        onClick={handleAddIncome}
                        className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-sm"
                    >
                        <PlusCircle size={18} className="mr-2" />
                        Add Income
                    </button>
                    <button
                        onClick={handleAddExpense}
                        className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-sm"
                    >
                        <PlusCircle size={18} className="mr-2" />
                        Add Expense
                    </button>
                </div>

                {/* Transactions Section */}
                <div className="flex-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                            Transaction History
                        </h3>
                    </div>
                    
                    {transactions.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <FileText className="h-12 w-12 text-gray-300 mb-3" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Transactions Found</h3>
                            <p className="text-gray-500 text-sm mb-4">Start by adding your first income or expense transaction</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={handleAddIncome}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                                >
                                    <PlusCircle size={16} className="inline mr-2" />
                                    Add Income
                                </button>
                                <button
                                    onClick={handleAddExpense}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                                >
                                    <PlusCircle size={16} className="inline mr-2" />
                                    Add Expense
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-indigo-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Source</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Description</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Amount</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {transactions.map((transaction, index) => (
                                        <tr key={transaction.id || index} className="hover:bg-gray-50 transition-all duration-150">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center text-xs text-gray-600">
                                                    <Calendar size={12} className="mr-2 text-gray-400" />
                                                    {new Date(transaction.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                                                    {transaction.source || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    transaction.type === 'Income' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {transaction.type === 'Income' ? '💰 Income' : '💸 Expense'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                                    {transaction.description || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className={`text-sm font-bold ${
                                                    transaction.type === 'Income' 
                                                        ? 'text-green-700 bg-green-50' 
                                                        : 'text-red-700 bg-red-50'
                                                } px-2 py-1 rounded`}>
                                                    {transaction.type === 'Income' ? '+' : '-'} 
                                                    ₹{transaction.amount?.toLocaleString('en-IN') || '0'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center justify-center space-x-1">
                                                    {transaction.source === 'General' ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(transaction)}
                                                                className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-lg transition-all duration-200"
                                                                title="Edit"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(transaction.id)}
                                                                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-all duration-200"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs italic">
                                                            Read-only
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modals */}
                {showFormModal && (
                    <Modal onClose={() => handleFormClose(false)}>
                        <ProjectAmountTransactionForm
                            transaction={currentTransaction}
                            projectId={projectId}
                            type={formType}
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
        </div>
    );
};

export default ProjectAmountTransaction;
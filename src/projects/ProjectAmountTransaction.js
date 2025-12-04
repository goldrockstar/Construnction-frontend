import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from '../model/Modal';
import ConfirmModal from '../model/ConfirmModal';
import MessageModal from '../model/MessageModal';
import ProjectAmountTransactionForm from './ProjectAmountTransactionForm'; 
import { Edit, Trash2, PlusCircle, ArrowLeft, DollarSign, TrendingUp, TrendingDown, Building2, Calendar, FileText, Briefcase } from 'lucide-react';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const ProjectAmountTransaction = () => {
    const { projectId: paramProjectId } = useParams();
    const navigate = useNavigate();

    const [projectsList, setProjectsList] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(paramProjectId || ''); 

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false); 
    const [dataLoading, setDataLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [formType, setFormType] = useState('Income'); 
    
    const [projectData, setProjectData] = useState({
        clientName: '-',
        projectName: 'All Projects',
        totalIncome: 0,
        totalExpense: 0,
        netProfitLoss: 0
    });

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [transactionIdToDelete, setTransactionIdToDelete] = useState(null);
    const [message, setMessage] = useState(null);

    // 1. Fetch All Projects for Dropdown AND Lookup
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const response = await fetch(`${API_BASE_URL}/projects`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("Failed to fetch projects list.");
                
                const data = await response.json();
                const list = Array.isArray(data) ? data : (data.projects || []);
                setProjectsList(list);
            } catch (err) {
                console.error("Error fetching projects:", err);
            }
        };
        fetchProjects();
    }, [navigate]);

    // 2. Fetch Transactions (All or Project Specific)
    const fetchTransactionsAndSummary = useCallback(async (id) => {
        setDataLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            
            let url = '';
            if (id) {
                url = `${API_BASE_URL}/transactions/summary/${id}`;
            } else {
                url = `${API_BASE_URL}/transactions`; 
            }

            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            
            if (!response.ok) {
                if (response.status === 404 && !id) {
                    setTransactions([]);
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch transactions.`);
            }

            const data = await response.json();
            
            // Handle response structure
            if (id) {
                // Specific Project View
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
            } else {
                // All Projects View
                const allTrans = Array.isArray(data) ? data : (data.transactions || []);
                setTransactions(allTrans);
                
                const tIncome = allTrans.filter(t => t.type === 'Income').reduce((sum, t) => sum + (t.amount || 0), 0);
                const tExpense = allTrans.filter(t => t.type === 'Expense').reduce((sum, t) => sum + (t.amount || 0), 0);
                
                setProjectData({
                    projectName: 'All Projects',
                    clientName: '-',
                    totalIncome: tIncome,
                    totalExpense: tExpense,
                    netProfitLoss: tIncome - tExpense
                });
            }

        } catch (err) {
            console.error("Error fetching transactions:", err);
            if (id) setError(err.message); 
        } finally {
            setDataLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactionsAndSummary(selectedProjectId);
    }, [selectedProjectId, fetchTransactionsAndSummary]);

    // Helper to get Project Name
    const getProjectName = (projectField) => {
        // If populated object
        if (projectField && projectField.projectName) return projectField.projectName;
        
        // If ID string, find in projectsList
        const foundProject = projectsList.find(p => p._id === projectField || p.projectId === projectField);
        if (foundProject) return foundProject.projectName;

        return '-';
    };

    const handleProjectChange = (e) => {
        setSelectedProjectId(e.target.value);
    };

    // ... (Copy handlers: handleDelete, confirmDelete, handleEdit, etc. - No changes needed here)
    const handleDelete = (transactionId) => {
        setTransactionIdToDelete(transactionId);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!transactionIdToDelete) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/transactions/${transactionIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            setMessage("Transaction deleted successfully!");
            fetchTransactionsAndSummary(selectedProjectId);
        } catch (err) {
            setMessage("Error: " + err.message);
        } finally {
            setTransactionIdToDelete(null);
            setShowConfirmModal(false);
        }
    };

    const handleEdit = (transaction) => {
        setFormType(transaction.type || 'Income'); 
        setCurrentTransaction(transaction);
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
        if (refresh) fetchTransactionsAndSummary(selectedProjectId);
    };

    const handleBackClick = () => navigate(-1);


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 overflow-hidden">
            <div className="max-w-full mx-auto h-full flex flex-col">
                
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="relative min-w-[300px]">
                            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <select
                                value={selectedProjectId}
                                onChange={handleProjectChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-gray-700 font-medium"
                            >
                                <option value="">-- All Projects --</option>
                                {projectsList.map(project => (
                                    <option key={project._id} value={project._id}>
                                        {project.projectName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div>
                         <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <DollarSign className="h-7 w-7 mr-3 text-indigo-600" />
                            Income & Expense
                        </h1>
                    </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Building2 className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-gray-700">Currently Viewing</h3>
                                <p className="text-sm font-bold text-gray-900 truncate">{projectData.projectName}</p>
                                {selectedProjectId && <p className="text-xs text-gray-600">Client: {projectData.clientName}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-xs font-medium">Total Income</p>
                                <p className="text-xl font-bold mt-1">₹{projectData.totalIncome?.toLocaleString('en-IN') || '0'}</p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-lg"><TrendingUp size={18} /></div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-xs font-medium">Total Expense</p>
                                <p className="text-xl font-bold mt-1">₹{projectData.totalExpense?.toLocaleString('en-IN') || '0'}</p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-lg"><TrendingDown size={18} /></div>
                        </div>
                    </div>

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
                                <p className="text-xl font-bold mt-1">₹{Math.abs(projectData.netProfitLoss)?.toLocaleString('en-IN') || '0'}</p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-lg"><DollarSign size={18} /></div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <button onClick={handleAddIncome} className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl text-sm">
                        <PlusCircle size={18} className="mr-2" /> Add Income
                    </button>
                    <button onClick={handleAddExpense} className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl text-sm">
                        <PlusCircle size={18} className="mr-2" /> Add Expense
                    </button>
                </div>

                {/* Transactions Table */}
                <div className="flex-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-indigo-600" /> Transaction History
                        </h3>
                    </div>
                    
                    {dataLoading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading transactions...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <FileText className="h-12 w-12 text-gray-300 mb-3" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Transactions Found</h3>
                            <p className="text-gray-500 text-sm mb-4">Start by adding your first income or expense transaction</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-indigo-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Project Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Description</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Amount</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {transactions.map((transaction, index) => (
                                        <tr key={transaction.id || transaction._id || index} className="hover:bg-gray-50 transition-all duration-150">
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                                {new Date(transaction.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 font-medium">
                                                 {getProjectName(transaction.project)} 
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transaction.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {transaction.type === 'Income' ? '💰 Income' : '💸 Expense'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                                                {transaction.description || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className={`text-sm font-bold ${transaction.type === 'Income' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'} px-2 py-1 rounded`}>
                                                    {transaction.type === 'Income' ? '+' : '-'} ₹{transaction.amount?.toLocaleString('en-IN') || '0'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <div className="flex justify-center space-x-1">
                                                    <button onClick={() => handleEdit(transaction)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg"><Edit size={14} /></button>
                                                    <button onClick={() => handleDelete(transaction.id || transaction._id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 size={14} /></button>
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
                            projectId={selectedProjectId} // Pass selected ID (or empty)
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
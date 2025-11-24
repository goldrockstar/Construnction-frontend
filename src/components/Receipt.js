import React, { useState, useEffect } from 'react';
import CustomModal from '../model/CustomModal';
import ReceiptForm from './ReceiptForm';
import { Edit, PlusCircle, Printer, Trash2, FileText, Download, Search, Filter, IndianRupee, Calendar, Hash, MoreVertical, Eye } from 'lucide-react';
import PrintableReceipt from './PrintableReceipt';

const API_BASE_URL = 'http://localhost:5000/api';

const Receipt = () => {
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', onConfirm: null, showConfirm: false });
    const [receiptToPrint, setReceiptToPrint] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('latest');

    const showMessage = (message) => {
        setModalContent({ title: "Notification", message, onConfirm: null, showConfirm: false });
        setShowModal(true);
    };

    const showConfirmation = (message, onConfirmAction) => {
        setModalContent({
            title: "Confirm Deletion",
            message,
            onConfirm: () => {
                onConfirmAction();
                setShowModal(false);
            },
            showConfirm: true,
        });
        setShowModal(true);
    };

    const fetchReceipts = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Authentication token not found.");
            }
            const response = await fetch(`${API_BASE_URL}/receipts`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch receipts: ${response.statusText}`);
            }

            const data = await response.json();
            setReceipts(data);
        } catch (err) {
            console.error("Error fetching receipts:", err);
            setError("Failed to fetch receipts. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceipts();
    }, []);

    const handleDelete = (id) => {
        showConfirmation("Are you sure you want to delete this receipt? This action cannot be undone.", async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error("Authentication token not found.");
                }
                const response = await fetch(`${API_BASE_URL}/receipts/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to delete receipt: ${response.statusText}`);
                }
                setReceipts(receipts.filter(item => item._id !== id));
                showMessage("Receipt deleted successfully!");
            } catch (err) {
                console.error("Error deleting receipt:", err);
                showMessage("Failed to delete receipt: " + err.message);
            }
        });
    };

    const handleEdit = (receipt) => {
        setCurrentReceipt(receipt);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        setCurrentReceipt(null);
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        fetchReceipts();
    };

    const handlePrint = (item) => {
        setReceiptToPrint(item);
        setTimeout(() => {
            window.print();
            setReceiptToPrint(null);
        }, 500);
    };

    // Filter and sort receipts
    const filteredReceipts = receipts
        .filter(receipt => 
            receipt.receiptNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            receipt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            receipt.amount?.toString().includes(searchTerm)
        )
        .sort((a, b) => {
            switch(sortBy) {
                case 'latest':
                    return new Date(b.date) - new Date(a.date);
                case 'oldest':
                    return new Date(a.date) - new Date(b.date);
                case 'amount-high':
                    return (b.amount || 0) - (a.amount || 0);
                case 'amount-low':
                    return (a.amount || 0) - (b.amount || 0);
                default:
                    return 0;
            }
        });

    const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg font-medium">Loading Receipts...</p>
                    <p className="text-gray-500 text-sm">Preparing your financial documents</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-100 p-6 rounded-2xl max-w-md mx-auto border border-red-200">
                        <p className="text-red-600 text-lg font-semibold">{error}</p>
                        <button 
                            onClick={fetchReceipts}
                            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl shadow-2xl p-8 text-white">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Receipt Management</h1>
                                <p className="text-green-100 mt-2">Manage and track all payment receipts</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleAdd}
                            className="bg-white text-green-600 font-bold py-3 px-6 rounded-xl shadow-2xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-2"
                        >
                            <PlusCircle size={20} />
                            <span>Create Receipt</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Card */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider">TOTAL RECEIPTS</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{filteredReceipts.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider">TOTAL AMOUNT</p>
                            <p className="text-3xl font-bold text-green-600 mt-2 flex items-center">
                                <IndianRupee className="w-6 h-6 mr-1" />
                                {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                    {/* Filters Bar */}
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                                {/* Search */}
                                <div className="relative flex-1 min-w-[250px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search receipts..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm"
                                    />
                                </div>

                                {/* Sort By */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm"
                                >
                                    <option value="latest">Latest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="amount-high">Amount: High to Low</option>
                                    <option value="amount-low">Amount: Low to High</option>
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                                    <Filter className="w-5 h-5 text-gray-600" />
                                </button>
                                <button className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                                    <Download className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Receipts Table */}
                    {filteredReceipts.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center">
                                <FileText className="w-10 h-10 text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-600 mb-3">No Receipts Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">
                                {searchTerm 
                                    ? 'Try adjusting your search terms'
                                    : 'Get started by creating your first receipt'
                                }
                            </p>
                            <button 
                                onClick={handleAdd}
                                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center space-x-2"
                            >
                                <PlusCircle className="w-5 h-5" />
                                <span>Create First Receipt</span>
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Receipt Details</th>
                                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                                        <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                                        <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredReceipts.map((item) => (
                                        <tr key={item._id} className="hover:bg-green-50/30 transition-all duration-200 group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <FileText className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 group-hover:text-green-700">
                                                            {item.receiptNo}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Receipt
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center text-gray-600">
                                                    <Calendar className="w-3 h-3 mr-2" />
                                                    {new Date(item.date).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-sm text-gray-700">
                                                    {item.description || 'No description'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="text-lg font-bold text-green-600 flex items-center justify-end">
                                                    <IndianRupee className="w-4 h-4 mr-1" />
                                                    {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center space-x-1">
                                                    <button 
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handlePrint(item)}
                                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                        title="Print"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item._id)}
                                                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors duration-200"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
                        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white z-10 px-8 py-6 flex justify-between items-center">
                            <h3 className="text-2xl font-bold">
                                {currentReceipt ? 'Edit Receipt' : 'Create New Receipt'}
                            </h3>
                            <button 
                                onClick={handleFormClose}
                                className="text-white hover:text-gray-200 text-2xl transition-colors duration-200"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-2">
                            <ReceiptForm receipt={currentReceipt} onClose={handleFormClose} setReceipts={setReceipts} customAlert={showMessage} />
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <CustomModal
                    title={modalContent.title}
                    message={modalContent.message}
                    onConfirm={modalContent.onConfirm}
                    onCancel={() => setShowModal(false)}
                    showConfirm={modalContent.showConfirm}
                />
            )}

            {/* Printable Receipt */}
            {receiptToPrint && (
                <div className="printable-only">
                    <PrintableReceipt receipt={receiptToPrint} />
                </div>
            )}
        </div>
    );
};

export default Receipt;
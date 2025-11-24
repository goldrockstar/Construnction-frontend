import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, PlusCircle, Trash2, Printer, Loader2, FileText, Search, Filter, Download, Calendar, User, IndianRupee, MoreVertical, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuotationForm from '../projects/QuotationForm';
import QuotationModel from '../model/QuotationModel';

const API_BASE_URL = 'http://localhost:5000/api';

const QuotationList = () => {
    const navigate = useNavigate();

    const [quotations, setQuotations] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentQuotation, setCurrentQuotation] = useState(null);
    const [messageModal, setMessageModal] = useState({ show: false, message: '', type: '', onConfirm: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('latest');
    const [dateFilter, setDateFilter] = useState('all');
    const [downloading, setDownloading] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    const showMessage = (message, type = 'alert', onConfirm = null) => {
        setMessageModal({ show: true, message, type, onConfirm });
    };

    const handleCloseModal = () => {
        setMessageModal({ show: false, message: '', type: '', onConfirm: null });
    };

    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await axios.get(`${API_BASE_URL}/quotations`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            setQuotations(response.data);
        } catch (error) {
            console.error('Error fetching quotations:', error);
            setError(error.response?.data?.message || 'Failed to fetch quotations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    const handleDelete = (id) => {
        showMessage("Are you sure you want to delete this quotation record?", 'confirm', () => deleteQuotation(id));
    }

    const deleteQuotation = async (id) => {
        handleCloseModal();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found. Please log in.');
            }

            await axios.delete(`${API_BASE_URL}/quotations/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            setQuotations(prevQuotations => prevQuotations.filter(item => item._id !== id));
            showMessage("Quotation deleted successfully!", 'alert');
        } catch (error) {
            console.error("Error deleting quotation:", error);
            showMessage("Failed to delete quotation: " + (error.response?.data?.message || error.message), 'alert');
        }
    };

    const handleEdit = (quotation) => {
        setCurrentQuotation(quotation);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        setCurrentQuotation(null);
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        fetchQuotations();
    };

    const handlePrint = (id) => {
        navigate(`/quotations/print/${id}`);
    };

    // Download as Excel/CSV
    const handleDownload = async () => {
        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found.');
            }

            // Get filtered data for export
            const dataToExport = filteredQuotations.map(quotation => ({
                'Quotation Number': quotation.quotationNumber || 'N/A',
                'Project Name': quotation.projectId?.projectName || 'N/A',
                'Client Name': quotation.quotationTo?.clientName || 'N/A',
                'Quotation Date': quotation.quotationDate ? new Date(quotation.quotationDate).toLocaleDateString('en-IN') : 'N/A',
                'Due Date': quotation.dueDate ? new Date(quotation.dueDate).toLocaleDateString('en-IN') : 'N/A',
                'Total Amount': quotation.grandTotal || 0,
                'Status': new Date(quotation.dueDate) < new Date() ? 'Expired' : 'Active'
            }));

            // Create CSV content
            const headers = Object.keys(dataToExport[0]).join(',');
            const csvContent = dataToExport.map(row => 
                Object.values(row).map(field => 
                    `"${String(field).replace(/"/g, '""')}"`
                ).join(',')
            ).join('\n');

            const csv = `${headers}\n${csvContent}`;
            
            // Create and download file
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `quotations_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showMessage("Quotations exported successfully as CSV!", 'alert');
        } catch (error) {
            console.error('Error downloading quotations:', error);
            showMessage("Failed to export quotations: " + error.message, 'alert');
        } finally {
            setDownloading(false);
        }
    };

    // Download as PDF
    const handleDownloadPdf = async (quotationId = null) => {
        setDownloadingPdf(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found.');
            }

            let url;
            if (quotationId) {
                // Download single quotation PDF
                url = `${API_BASE_URL}/quotations/${quotationId}/pdf`;
            } else {
                // Download all filtered quotations as PDF
                const ids = filteredQuotations.map(q => q._id).join(',');
                url = `${API_BASE_URL}/quotations/pdf?ids=${ids}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = downloadUrl;
            link.download = quotationId 
                ? `quotation_${quotationId}_${new Date().toISOString().split('T')[0]}.pdf`
                : `quotations_${new Date().toISOString().split('T')[0]}.pdf`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            showMessage(`PDF ${quotationId ? 'quotation' : 'quotations'} downloaded successfully!`, 'alert');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            showMessage("Failed to download PDF: " + error.message, 'alert');
        } finally {
            setDownloadingPdf(false);
        }
    };

    // Filter and sort quotations
    const filteredQuotations = quotations ? quotations.filter(quotation => {
        const matchesSearch = 
            quotation.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quotation.projectId?.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quotation.quotationTo?.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Status calculation based on dates
        const today = new Date();
        const dueDate = new Date(quotation.dueDate);
        let status = 'active';
        if (dueDate < today) status = 'expired';
        
        const matchesStatus = statusFilter === 'all' || status === statusFilter;

        // Date filter
        const quotationDate = new Date(quotation.quotationDate);
        const matchesDate = dateFilter === 'all' || 
            (dateFilter === 'today' && quotationDate.toDateString() === today.toDateString()) ||
            (dateFilter === 'week' && (today - quotationDate) <= 7 * 24 * 60 * 60 * 1000) ||
            (dateFilter === 'month' && quotationDate.getMonth() === today.getMonth() && quotationDate.getFullYear() === today.getFullYear());
        
        return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
        switch(sortBy) {
            case 'latest':
                return new Date(b.quotationDate) - new Date(a.quotationDate);
            case 'oldest':
                return new Date(a.quotationDate) - new Date(b.quotationDate);
            case 'amount-high':
                return (b.grandTotal || 0) - (a.grandTotal || 0);
            case 'amount-low':
                return (a.grandTotal || 0) - (b.grandTotal || 0);
            case 'due-soon':
                return new Date(a.dueDate) - new Date(b.dueDate);
            default:
                return 0;
        }
    }) : [];

    // Calculate stats
    const totalQuotations = filteredQuotations.length;
    const totalAmount = filteredQuotations.reduce((sum, quotation) => sum + (quotation.grandTotal || 0), 0);
    const activeQuotations = filteredQuotations.filter(q => new Date(q.dueDate) >= new Date()).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg font-medium">Loading Quotations...</p>
                    <p className="text-gray-500 text-sm">Preparing your business documents</p>
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
                            onClick={fetchQuotations}
                            className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
            {messageModal.show && <QuotationModel message={messageModal.message} onClose={handleCloseModal} onConfirm={messageModal.onConfirm} type={messageModal.type} />}

            {/* Header Section */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white p-8">
                <div className="container mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Quotation Management</h1>
                                <p className="text-green-100 mt-1">Create and manage professional business quotations</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleAdd}
                            className="bg-white text-green-600 font-bold py-3 px-6 rounded-xl shadow-2xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-2"
                        >
                            <PlusCircle size={20} />
                            <span>Create Quotation</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="container mx-auto px-4 -mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">TOTAL QUOTATIONS</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{totalQuotations}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-green-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">TOTAL VALUE</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">₹{totalAmount.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-xl">
                                <IndianRupee className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-emerald-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">ACTIVE QUOTATIONS</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{activeQuotations}</p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <Calendar className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 pb-8">
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
                                        placeholder="Search quotations..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm"
                                    />
                                </div>

                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                </select>

                                {/* Date Filter */}
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm"
                                >
                                    <option value="all">All Dates</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </select>

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
                                    <option value="due-soon">Due Date: Soonest</option>
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={handleDownload}
                                    disabled={downloading || filteredQuotations.length === 0}
                                    className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {downloading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Download className="w-5 h-5" />
                                    )}
                                    <span>{downloading ? 'Exporting...' : 'Export CSV'}</span>
                                </button>

                                <button 
                                    onClick={() => handleDownloadPdf()}
                                    disabled={downloadingPdf || filteredQuotations.length === 0}
                                    className="flex items-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {downloadingPdf ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <FileText className="w-5 h-5" />
                                    )}
                                    <span>{downloadingPdf ? 'Generating PDF...' : 'Export PDF'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quotations Table */}
                    {filteredQuotations.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center">
                                <FileText className="w-10 h-10 text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-600 mb-3">No Quotations Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">
                                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'Get started by creating your first quotation'
                                }
                            </p>
                            <button 
                                onClick={handleAdd}
                                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center space-x-2"
                            >
                                <PlusCircle className="w-5 h-5" />
                                <span>Create First Quotation</span>
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Quotation Details</th>
                                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Client</th>
                                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Project</th>
                                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Dates</th>
                                        <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                                        <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredQuotations.map((item) => {
                                        const today = new Date();
                                        const dueDate = new Date(item.dueDate);
                                        const isExpired = dueDate < today;
                                        
                                        return (
                                            <tr key={item._id} className="hover:bg-green-50/30 transition-all duration-200 group">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-green-100 rounded-lg">
                                                            <FileText className="w-4 h-4 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 group-hover:text-green-700">
                                                                {item.quotationNumber || 'N/A'}
                                                            </div>
                                                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold mt-1 ${
                                                                isExpired 
                                                                    ? 'bg-red-100 text-red-800 border border-red-200' 
                                                                    : 'bg-green-100 text-green-800 border border-green-200'
                                                            }`}>
                                                                {isExpired ? 'EXPIRED' : 'ACTIVE'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.quotationTo?.clientName || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {item.quotationTo?.companyName || ''}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="text-sm text-gray-700 font-medium">
                                                        {item.projectId?.projectName || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="text-sm space-y-1">
                                                        <div className="flex items-center text-gray-600">
                                                            <Calendar className="w-3 h-3 mr-2" />
                                                            {item.quotationDate ? new Date(item.quotationDate).toLocaleDateString('en-IN') : 'N/A'}
                                                        </div>
                                                        <div className="flex items-center text-gray-500 text-xs">
                                                            Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="text-lg font-bold text-gray-900">
                                                        ₹{item.grandTotal ? item.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
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
                                                            onClick={() => handlePrint(item._id)}
                                                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                            title="Print"
                                                        >
                                                            <Printer size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDownloadPdf(item._id)}
                                                            disabled={downloadingPdf}
                                                            className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                                            title="Download PDF"
                                                        >
                                                            {downloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
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
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
                        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white z-10 px-8 py-6 flex justify-between items-center">
                            <h3 className="text-2xl font-bold">
                                {currentQuotation ? 'Edit Quotation' : 'Create New Quotation'}
                            </h3>
                            <button 
                                onClick={handleFormClose}
                                className="text-white hover:text-gray-200 text-2xl transition-colors duration-200"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-2">
                            <QuotationForm initialData={currentQuotation} onClose={handleFormClose} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotationList;
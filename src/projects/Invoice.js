import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, PlusCircle, Trash2, Printer, Loader2, FileText, Search, Filter, Download, MoreVertical, Eye, Calendar, User, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InvoiceForm from './InvoiceForm';
import QuotationModel from '../model/QuotationModel';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const API_BASE_URL = 'http://localhost:5000/api';

const InvoiceList = () => {
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState(null);
    const [messageModal, setMessageModal] = useState({ show: false, message: '', type: '', onConfirm: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('latest');
    const [exportLoading, setExportLoading] = useState(false);

    const showMessage = (message, type = 'alert', onConfirm = null) => {
        setMessageModal({ show: true, message, type, onConfirm });
    };

    const handleCloseModal = () => {
        setMessageModal({ show: false, message: '', type: '', onConfirm: null });
    };

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found. Please log in.');

            const response = await axios.get(`${API_BASE_URL}/invoices`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });

            setInvoices(response.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setError(error.response?.data?.message || 'Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleDelete = (id) => {
        showMessage("Are you sure you want to delete this invoice record?", 'confirm', () => deleteInvoice(id));
    }

    const deleteInvoice = async (id) => {
        handleCloseModal();
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Token not found. Please log in.');

            await axios.delete(`${API_BASE_URL}/invoices/${id}`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });

            setInvoices(prevInvoices => prevInvoices.filter(item => item._id !== id));
            showMessage("Invoice deleted successfully!", 'alert');
        } catch (error) {
            console.error("Error deleting invoice:", error);
            showMessage("Failed to delete invoice: " + (error.response?.data?.message || error.message), 'alert');
        }
    };

    const handleEdit = (invoice) => {
        setCurrentInvoice(invoice);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        setCurrentInvoice(null);
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        fetchInvoices();
    };

    const handlePrint = (id) => {
        navigate(`/invoices/print/${id}`);
    };

    // PDF Export Function
    const handleExportPDF = async () => {
        setExportLoading(true);
        try {
            // Create a simple HTML content for PDF
            const content = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invoice Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { 
                            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                            color: white; 
                            padding: 20px; 
                            text-align: center; 
                            border-radius: 10px;
                            margin-bottom: 20px;
                        }
                        .stats { 
                            background: #f8fafc; 
                            padding: 15px; 
                            border-radius: 8px; 
                            margin-bottom: 20px;
                            border-left: 4px solid #3b82f6;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-top: 20px;
                        }
                        th { 
                            background-color: #3b82f6; 
                            color: white; 
                            padding: 12px; 
                            text-align: left;
                        }
                        td { 
                            padding: 10px; 
                            border-bottom: 1px solid #e2e8f0;
                        }
                        tr:nth-child(even) {
                            background-color: #f8fafc;
                        }
                        .amount { text-align: right; font-weight: bold; }
                        .status-overdue { color: #dc2626; background: #fef2f2; padding: 4px 8px; border-radius: 12px; }
                        .status-pending { color: #d97706; background: #fffbeb; padding: 4px 8px; border-radius: 12px; }
                        .status-paid { color: #059669; background: #f0fdf4; padding: 4px 8px; border-radius: 12px; }
                        .footer { 
                            margin-top: 30px; 
                            text-align: center; 
                            color: #6b7280; 
                            font-size: 12px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>INVOICE REPORT</h1>
                        <p>Biz Master - Professional Invoice Management</p>
                    </div>
                    
                    <div class="stats">
                        <strong>Generated on:</strong> ${new Date().toLocaleDateString('en-IN')} | 
                        <strong> Total Invoices:</strong> ${filteredInvoices.length} | 
                        <strong> Total Amount:</strong> ₹${totalAmount.toLocaleString('en-IN')}
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Invoice No</th>
                                <th>Client</th>
                                <th>Project</th>
                                <th>Invoice Date</th>
                                <th>Due Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredInvoices.map((item, index) => {
                const today = new Date();
                const dueDate = new Date(item.dueDate);
                const isOverdue = dueDate < today;
                const isPending = dueDate > today;
                const status = isOverdue ? 'OVERDUE' : isPending ? 'PENDING' : 'PAID';
                const statusClass = isOverdue ? 'status-overdue' : isPending ? 'status-pending' : 'status-paid';

                return `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${item.invoiceNumber || 'N/A'}</td>
                                        <td>${item.invoiceTo?.clientName || item.invoiceTo?.name || 'N/A'}</td>
                                        <td>${item.projectId?.projectName || 'N/A'}</td>
                                        <td>${item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                                        <td>${item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                                        <td class="amount">₹${item.grandTotal ? item.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</td>
                                        <td><span class="${statusClass}">${status}</span></td>
                                    </tr>
                                `;
            }).join('')}
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <p>Generated by Biz Master Invoice Management System</p>
                        <p>Page 1 of 1</p>
                    </div>
                </body>
                </html>
            `;

            // Open print dialog for PDF
            const printWindow = window.open('', '_blank');
            printWindow.document.write(content);
            printWindow.document.close();

            // Wait for content to load then print
            printWindow.onload = function () {
                printWindow.print();
                printWindow.onafterprint = function () {
                    printWindow.close();
                };
            };

        } catch (error) {
            console.error('Error generating PDF:', error);
            showMessage('Failed to generate PDF export: ' + error.message, 'alert');
        } finally {
            setExportLoading(false);
        }
    };

    // CSV Export Function
    const handleExportCSV = () => {
        try {
            const headers = ['Invoice Number', 'Client', 'Project', 'Invoice Date', 'Due Date', 'Amount', 'Status'];

            const csvData = filteredInvoices.map(item => {
                const today = new Date();
                const dueDate = new Date(item.dueDate);
                const status = dueDate < today ? 'Overdue' : dueDate > today ? 'Pending' : 'Paid';

                return [
                    item.invoiceNumber || 'N/A',
                    item.invoiceTo?.clientName || item.invoiceTo?.name || 'N/A',
                    item.projectId?.projectName || 'N/A',
                    item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString('en-IN') : 'N/A',
                    item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN') : 'N/A',
                    item.grandTotal ? item.grandTotal.toFixed(2) : '0.00',
                    status
                ];
            });

            const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `invoice-report-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error generating CSV:', error);
            showMessage('Failed to generate CSV export', 'alert');
        }
    };

    // Filter and sort invoices
    const filteredInvoices = invoices ? invoices.filter(invoice => {
        const matchesSearch =
            invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.projectId?.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.invoiceTo?.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.invoiceTo?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        // Simple status filter based on due date
        const today = new Date();
        const dueDate = new Date(invoice.dueDate);
        let status = 'paid';
        if (dueDate < today) status = 'overdue';
        else if (dueDate > today) status = 'pending';

        const matchesStatus = statusFilter === 'all' || status === statusFilter;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'latest':
                return new Date(b.invoiceDate) - new Date(a.invoiceDate);
            case 'oldest':
                return new Date(a.invoiceDate) - new Date(b.invoiceDate);
            case 'amount-high':
                return (b.grandTotal || 0) - (a.grandTotal || 0);
            case 'amount-low':
                return (a.grandTotal || 0) - (b.grandTotal || 0);
            default:
                return 0;
        }
    }) : [];

    // Calculate stats
    const totalInvoices = filteredInvoices.length;
    const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + (invoice.grandTotal || 0), 0);

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg font-medium">Loading Invoices...</p>
                <p className="text-gray-500 text-sm">Preparing your financial documents</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
                <div className="bg-red-100 p-4 rounded-2xl max-w-md mx-auto">
                    <p className="text-red-600 text-lg font-semibold">{error}</p>
                    <button
                        onClick={fetchInvoices}
                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
            {messageModal.show && <QuotationModel message={messageModal.message} onClose={handleCloseModal} onConfirm={messageModal.onConfirm} type={messageModal.type} />}

            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white p-8">
                <div className="container mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Invoice Management</h1>
                                <p className="text-blue-100 mt-1">Manage and track all your client invoices</p>
                            </div>
                        </div>

                        <button
                            onClick={handleAdd}
                            className="bg-white text-blue-600 font-bold py-3 px-6 rounded-xl shadow-2xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-2"
                        >
                            <PlusCircle size={20} />
                            <span>Create Invoice</span>
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
                                <p className="text-gray-600 text-sm font-semibold">TOTAL INVOICES</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{totalInvoices}</p>
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

                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-semibold">ACTIVE CLIENTS</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">
                                    {new Set(filteredInvoices.map(inv => inv.invoiceTo?.clientName || inv.invoiceTo?.name)).size}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <User className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 pb-8">
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                    {/* Filters Bar */}
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                                {/* Search */}
                                <div className="relative flex-1 min-w-[250px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search invoices..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
                                    />
                                </div>

                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                    <option value="overdue">Overdue</option>
                                </select>

                                {/* Sort By */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
                                >
                                    <option value="latest">Latest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="amount-high">Amount: High to Low</option>
                                    <option value="amount-low">Amount: Low to High</option>
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleExportCSV}
                                    disabled={exportLoading || filteredInvoices.length === 0}
                                    className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Download className="w-5 h-5 text-gray-600" />
                                    <span className="text-sm font-medium">CSV</span>
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    disabled={exportLoading || filteredInvoices.length === 0}
                                    className="p-3 border border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {exportLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <FileText className="w-5 h-5" />
                                    )}
                                    <span className="text-sm font-medium">PDF</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Invoices Table */}
                    {filteredInvoices.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center">
                                <FileText className="w-10 h-10 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-600 mb-3">No Invoices Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">
                                {searchTerm || statusFilter !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'Get started by creating your first invoice'
                                }
                            </p>
                            <button
                                onClick={handleAdd}
                                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center space-x-2"
                            >
                                <PlusCircle className="w-5 h-5" />
                                <span>Create First Invoice</span>
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Invoice Details</th>
                                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Client</th>
                                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Project</th>
                                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Dates</th>
                                        <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                                        <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredInvoices.map((item) => {
                                        const today = new Date();
                                        const dueDate = new Date(item.dueDate);
                                        const isOverdue = dueDate < today;
                                        const isPending = dueDate > today;

                                        return (
                                            <tr key={item._id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <FileText className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 group-hover:text-blue-700">
                                                                {item.invoiceNumber || 'N/A'}
                                                            </div>
                                                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold mt-1 ${isOverdue
                                                                ? 'bg-red-100 text-red-800 border border-red-200'
                                                                : isPending
                                                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                                    : 'bg-green-100 text-green-800 border border-green-200'
                                                                }`}>
                                                                {isOverdue ? 'OVERDUE' : isPending ? 'PENDING' : 'PAID'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.invoiceTo?.clientName || item.invoiceTo?.name || 'N/A'}
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
                                                            {item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString('en-IN') : 'N/A'}
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
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white z-10 px-8 py-6 flex justify-between items-center">
                            <h3 className="text-2xl font-bold">
                                {currentInvoice ? 'Edit Invoice' : 'Create New Invoice'}
                            </h3>
                            <button
                                onClick={handleFormClose}
                                className="text-white hover:text-gray-200 text-2xl transition-colors duration-200"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-2">
                            <InvoiceForm initialData={currentInvoice} onClose={handleFormClose} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceList;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit,  PlusCircle, Trash2, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InvoiceForm from '../projects/InvoiceForm';
import  Model  from '../model/Modal';

const API_BASE_URL = 'http://localhost:5000/api';

const Invoice = () => {
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState(null);
    const [messageModal, setMessageModal] = useState({ show: false, message: '', type: '', onConfirm: null });

    const showMessage = (message, type = 'alert', onConfirm = null) => {
        setMessageModal({ show: true, message, type, onConfirm });
    };

    const handleCloseModal = () => {
        setMessageModal({ show: false, message: '', type: '', onConfirm: null });
    };

    const fetchInvoices = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await axios.get(`${API_BASE_URL}/invoices`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            setInvoices(response.data);
            console.log(response.data);
        } catch (error) {
            console.log('Error fetching invoices:', error);
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
            if (!token) {
                throw new Error('Token not found. Please log in.');
            }

            await axios.delete(`${API_BASE_URL}/invoices/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            setInvoices(invoices.filter(item => item._id !== id));
            showMessage("Invoice deleted successfully!");
        } catch (error) {
            console.error("Error deleting invoice:", error);    
            showMessage("Failed to delete invoice: " + (error.response?.data?.message || error.message));
        }
    };

    const handleEdit = (invoice) => {
        setCurrentInvoice(invoice);
        setShowFormModal(true);
    };

    const handleAdd = (invoice) => {
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

    if (loading) {
        return <p className='text-center text-gray-500 text-lg mt-10'>Loading Invoices...</p>;
    }

    if (error) {
        return <p className='text-center text-red-500 text-lg mt-10'>{error}</p>;
    }

    return (
        <div className="invoice-container p-6 sm:p-8 bg-gray-100 min-h-screen font-sans">
            {messageModal.show && <Model message={messageModal.message} onClose={handleCloseModal} onConfirm={messageModal.onConfirm} type={messageModal.type} />}
            <div className="flex justify-between items-center mb-6">
                <h2 className='text-2xl font-bold text-gray-800'>Invoices</h2>
                <button onClick={handleAdd} className='bg-blue-600 text-white font-semibold py-2 px-6 rounded-full shadow-lg hover:bg-blue-700 transition duration-200 flex items-center gap-2'>
                    <PlusCircle size={16} />
                    Generate Invoice
                </button>
            </div>

            {invoices && invoices.length > 0 ? (
                <p className='text-center text-gray-500 mt-10'>No Invoices found. Click "Generate Invoice" to add one.</p>
            ) : (
                <div className='overflow-x-auto bg-white rounded-xl shadow-lg'>
                    <table className='min-w-full'>
                        <thead className='bg-gray-50 text-gray-600 uppercase text-sm leading-normal'>
                            <tr>
                                <th className='py-3 px-6 text-left'>Invoice Number</th>
                                <th className='py-3 px-6 text-left'>Project Name</th>
                                <th className='py-3 px-6 text-left'>Client Name</th>
                                <th className='py-3 px-6 text-left'>Date</th>
                                <th className='py-3 px-6 text-left'>Total Amount</th>
                                <th className='py-3 px-6 text-left'>Status</th>
                                <th className='py-3 px-6 text-center'>Actions</th>
                            </tr>
                        </thead>
                        <table className='text-gray-600 text-sm font-light'>
                            {invoices.map((item => (
                                <tr key={item._id} className='border-b border-gray-200 hover:bg-gray-50'>
                                    <td className='py-3 px-6 text-left whitespace-nowrap'>{item.invoiceNumber || 'N/A'}</td>
                                    <td className='py-3 px-6 text-left whitespace-nowrap'>{item.projectId?.projectName || 'N/A'}</td>
                                    <td className='py-3 px-6 text-left whitespace-nowrap'>{item.invoiceTo?.clientName || 'N/A'}</td>
                                    <td className='py-3 px-6 text-left whitespace-nowrap'>{item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className='py-3 px-6 text-left whitespace-nowrap'>{item.totalAmount ? item.totalAmount.toFixed(2) : '0.00'}</td>
                                    <td className='py-3 px-6 text-left whitespace-nowrap'>
                                        <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
                                            item.status === 'Draft' ? 'bg-yellow-200 text-yellow-800' : 
                                            item.status === 'Sent' ? 'bg-blue-200 text-blue-800' : 
                                            item.status === 'Accepted' ? 'bg-green-200 text-green-800' :
                                            item.status === 'Rejected' ? 'bg-red-200 text-red-800' : 
                                            'bg-gray-200 text-gray-800'
                                        }`}>
                                            {item.status || 'N/A'}
                                        </span>
                                    </td>
                                    <td className='py-3 px-6 text-center whitespace-nowrap flex items-center justify-center space-x-2'>
                                        <button onClick={() => handleEdit(item)} className='text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 transition duration-200'>
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(item._id)} className='text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition duration-200'>
                                            <Trash2 size={16} />
                                        </button>
                                        <button onClick={() => handlePrint(item._id)} className='text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition duration-200'>
                                            <Printer size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )))}
                        </table>
                    </table>
                </div>
            )}

            {showFormModal && (
                <div className='fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-40'>
                    <div className='bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
                        <InvoiceForm invoice={currentInvoice} onClose={handleFormClose} />
                    </div>
                </div>
            )}  
        </div >
    );
};

export default Invoice;
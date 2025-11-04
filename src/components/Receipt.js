import React, { useState, useEffect } from 'react';
import CustomModal from '../model/CustomModal';
import ReceiptForm from './ReceiptForm';
import { Edit, PlusCircle, Printer, Trash2 } from 'lucide-react';
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
    
    // Add state for printing
    const [receiptToPrint, setReceiptToPrint] = useState(null);

    // Your other functions remain the same
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
        showConfirmation("Are you sure you want to delete this record?", async () => {
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
        console.log('handleAdd called. Setting showFormModal to true.');
        setCurrentReceipt(null);
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        console.log('handleFormClose called. Setting showFormModal to false.');
        setShowFormModal(false);
        fetchReceipts();
    };

    // Updated handlePrint function
    const handlePrint = (item) => {
        setReceiptToPrint(item);
        // Wait for a moment to let the component render before printing
        setTimeout(() => {
            window.print();
            setReceiptToPrint(null); // Clear the state after printing
        }, 500);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl text-gray-700">Loading receipts...</div></div>;
    }

    if (error) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl text-red-500">{error}</div></div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen p-8 font-sans">
            <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl text-gray-900">Receipts</h2>
                    <button onClick={handleAdd} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                        <PlusCircle size={18} />
                        <span>Add New Receipt</span>
                    </button>
                </div>

                {receipts.length === 0 ? (
                    <p className="text-center text-gray-500 text-lg mt-12">
                        No receipts found. Click "Add New Receipt" to add one.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-xl">
                        <table className="min-w-full bg-white border-collapse">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Receipt No</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                                    <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {receipts.map(item => (
                                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6 text-sm text-gray-800">{item.receiptNo}</td>
                                        <td className="py-4 px-6 text-sm text-gray-800">{new Date(item.date).toLocaleDateString()}</td>
                                        <td className="py-4 px-6 text-sm text-gray-800">₹{Number(item.amount).toFixed(2)}</td>
                                        <td className="py-4 px-6 text-sm text-gray-800">{item.description || 'N/A'}</td>
                                        <td className="py-4 px-6 flex justify-center space-x-2">
                                            <button onClick={() => handleEdit(item)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-colors">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(item._id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                            <button onClick={() => handlePrint(item)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-colors">
                                                <Printer size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {showFormModal && (
                    <CustomModal onClose={handleFormClose}>
                        <ReceiptForm receipt={currentReceipt} onClose={handleFormClose} setReceipts={setReceipts} customAlert={showMessage} />
                    </CustomModal>
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
                {/* Conditionally render the printable component for printing */}
                {receiptToPrint && (
                    <div className="printable-only">
                        <PrintableReceipt receipt={receiptToPrint} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Receipt;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const InvoicePrint = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- 1. Fetch Invoice Data ---
    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Authentication required");

                const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error("Failed to fetch invoice");
                
                const data = await response.json();
                setInvoice(data);
                
                if(data.invoiceNumber) {
                    document.title = `Invoice-${data.invoiceNumber}`;
                }
            } catch (error) {
                console.error("Error:", error);
                toast.error("Error loading invoice for printing.");
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();

        return () => { document.title = 'Biz Master'; };
    }, [id]);

    // --- 2. Print Function ---
    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount) => {
        return parseFloat(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin mr-2 text-blue-600" /> Loading Invoice...</div>;
    if (!invoice) return <div className="text-center mt-10 text-red-500">Invoice not found.</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans print:bg-white print:p-0 print:m-0 print:overflow-hidden">
            <Toaster position="top-center" />
            
            {/* --- Optimised Print Styles --- */}
            <style>
                {`
                    @media print {
                        /* 1. Remove Browser Default Margins */
                        @page { 
                            size: A4; 
                            margin: 0; 
                        }
                        
                        /* 2. Reset Body */
                        body, html { 
                            width: 100%;
                            height: 100%;
                            margin: 0;
                            padding: 0;
                            background-color: white !important;
                            -webkit-print-color-adjust: economy;
                        }

                        /* 3. Hide UI Elements */
                        .print\\:hidden { display: none !important; }
                        
                        /* 4. Invoice Container Layout - OPTIMIZED MARGINS */
                        .print\\:container {
                            width: 100% !important;
                            max-width: 210mm !important; /* Fixed A4 Width */
                            min-height: 100vh;
                            margin: 0 auto !important; /* Center Horizontally */
                            /* Adjusted Padding: Top/Bottom 10mm, Left/Right 15mm (Standard Print Margin) */
                            padding: 20mm 15mm !important; 
                            // box-sizing: border-box; 
                            box-shadow: none !important;
                            border: none !important;
                            position: absolute;
                            top: 0;
                            left: 0;
                        }
                        
                        /* Ensure table fits and doesn't cut off */
                        table { width: 100% !important; table-layout: auto; }
                        
                        /* Readable Text */
                        .print\\:text-black { color: black !important; }
                    }
                `}
            </style>

            {/* --- Action Bar --- */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 transition"
                >
                    <ArrowLeft size={18} className="mr-2" /> Back
                </button>
                <div className="space-x-3">
                    <button 
                        onClick={handlePrint} 
                        className="flex items-center px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        <Printer size={20} className="mr-2" /> Print / Save PDF
                    </button>
                </div>
            </div>

            {/* --- INVOICE DOCUMENT --- */}
            <div className="flex justify-center print:block">
                <div 
                    className="w-[210mm] bg-white shadow-2xl print:container" 
                    style={{ minHeight: '297mm' }}
                >
                    <div className="p-10 md:p-12 print:p-0 h-full flex flex-col justify-between  border-gray-200 print:border-none">
                        
                        <div>
                            {/* Header */}
                            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
                                <div className="w-1/2">
                                    <h1 className="text-5xl font-extrabold text-gray-900 uppercase tracking-tight print:text-black">INVOICE</h1>
                                    <p className="text-gray-500 mt-1 text-sm">Original for Recipient</p>
                                </div>
                                <div className="w-1/2 text-right break-words pl-4">
                                    <div className="mb-2 text-xl font-bold text-blue-700 print:text-black">{invoice.invoiceFrom?.companyName || 'Company Name'}</div>
                                    <p className="text-gray-600 text-sm whitespace-pre-line">{invoice.invoiceFrom?.address || 'Address'}</p>
                                    <p className="text-gray-600 text-sm mt-1">Ph: {invoice.invoiceFrom?.contactNumber || 'Phone'}</p>
                                    {invoice.invoiceFrom?.gst && <p className="text-gray-600 text-sm font-semibold">GSTIN: {invoice.invoiceFrom.gst}</p>}
                                </div>
                            </div>

                            {/* Bill To & Meta */}
                            <div className="flex justify-between mb-8">
                                <div className="w-1/2 pr-4">
                                    <h3 className="text-gray-500 text-xs font-bold uppercase mb-2 tracking-wider">Bill To:</h3>
                                    <div className="text-gray-900 font-bold text-lg print:text-black">{invoice.invoiceTo?.clientName || 'Client Name'}</div>
                                    <p className="text-gray-600 text-sm whitespace-pre-line mt-1">{invoice.invoiceTo?.address}</p>
                                    <p className="text-gray-600 text-sm mt-1">Ph: {invoice.invoiceTo?.phone}</p>
                                    <p className='text-gray-600 text-sm whitespace-pre-line mt-1'>{invoice.invoiceTo?.gst && `GSTIN: ${invoice.invoiceTo.gst}`}</p>
                                </div>
                                <div className="w-1/2 text-right pl-4">
                                    <div className="mb-2">
                                        <span className="text-gray-500 text-xs font-bold uppercase block">Invoice No:</span>
                                        <span className="text-gray-900 font-bold text-xl print:text-black">{invoice.invoiceNumber}</span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-gray-500 text-xs font-bold uppercase block">Date:</span>
                                        <span className="text-gray-900 font-medium">{formatDate(invoice.invoiceDate)}</span>
                                    </div>
                                    {invoice.dueDate && (
                                        <div>
                                            <span className="text-gray-500 text-xs font-bold uppercase block">Due Date:</span>
                                            <span className="text-gray-900 font-medium">{formatDate(invoice.dueDate)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full mb-8 border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 border-b-2 border-gray-300 print:bg-gray-100">
                                        <th className="py-2 px-2 text-left text-xs font-bold text-gray-700 uppercase w-[5%] print:text-black">#</th>
                                        <th className="py-2 px-2 text-left text-xs font-bold text-gray-700 uppercase w-[40%] print:text-black">Item Description</th>
                                        <th className="py-2 px-2 text-right text-xs font-bold text-gray-700 uppercase w-[10%] print:text-black">Qty</th>
                                        <th className="py-2 px-2 text-right text-xs font-bold text-gray-700 uppercase w-[15%] print:text-black">Rate</th>
                                        <th className="py-2 px-2 text-right text-xs font-bold text-gray-700 uppercase w-[10%] print:text-black">GST%</th>
                                        <th className="py-2 px-2 text-right text-xs font-bold text-gray-700 uppercase w-[20%] print:text-black">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items && invoice.items.map((item, index) => {
                                        const gstAmount = (item.cgst || 0) + (item.sgst || 0);
                                        return (
                                            <tr key={index} className="border-b border-gray-200 text-sm">
                                                <td className="py-3 px-2 text-gray-500 align-top">{index + 1}</td>
                                                <td className="py-3 px-2 font-semibold text-gray-900 print:text-black align-top">{item.Name || item.name}</td>
                                                <td className="py-3 px-2 text-right text-gray-600 align-top">{item.quantity}</td>
                                                <td className="py-3 px-2 text-right text-gray-600 align-top">{formatCurrency(item.rate)}</td>
                                                <td className="py-3 px-2 text-right text-gray-500 text-xs align-top">
                                                    <div>{formatCurrency(gstAmount)}</div>
                                                    <div className="text-[10px]">({item.gstRate}%)</div>
                                                </td>
                                                <td className="py-3 px-2 text-right font-bold text-gray-900 print:text-black align-top">{formatCurrency(item.lineTotal)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="flex justify-end mb-12">
                                <div className="w-1/2 sm:w-5/12 space-y-2 border-t border-gray-300 pt-4">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal:</span>
                                        <span className="font-medium">{formatCurrency(invoice.subTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>CGST:</span>
                                        <span className="font-medium">{formatCurrency(invoice.totalCGST)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>SGST:</span>
                                        <span className="font-medium">{formatCurrency(invoice.totalSGST)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-extrabold text-gray-900 border-t-2 border-gray-800 pt-3 mt-2 print:text-black">
                                        <span>Grand Total:</span>
                                        <span>{formatCurrency(invoice.grandTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-auto page-break-inside-avoid">
                            <div className="flex justify-between items-end mb-8 gap-8">
                                <div className="w-1/2 text-xs text-gray-500">
                                    {invoice.termsAndConditions && (
                                        <>
                                            <p className="font-bold uppercase text-gray-700 mb-1">Terms & Conditions:</p>
                                            <p className="whitespace-pre-line leading-relaxed text-justify">{invoice.termsAndConditions}</p>
                                        </>
                                    )}
                                </div>
                                <div className="text-center w-1/3">
                                    {/* {invoice.signature && (
                                    <div className="mb-4 text-lg font-cursive text-blue-900 font-bold italic print:text-black">{invoice.signature}</div>
                                    )}
                                    {!invoice.signature && <div className="h-12"></div>} */}
                                    <p className="text-xs font-bold uppercase text-gray-400 border-t border-gray-300 pt-2 px-2">Authorized Signatory</p>
                                </div>
                            </div>
                            <div className="text-center border-t border-gray-200 pt-4">
                                <p className="text-xs text-gray-400">Thank you for your business!</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoicePrint;
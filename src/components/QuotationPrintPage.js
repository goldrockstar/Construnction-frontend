import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5000/api';

const QuotationPrint = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- 1. Fetch Quotation Data ---
    useEffect(() => {
        const fetchQuotation = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Authentication required");

                // Updated Endpoint for Quotations
                const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error("Failed to fetch quotation");
                
                const data = await response.json();
                setQuotation(data);
                
                // Set Document Title for Cleaner PDF Name
                if(data.quotationNumber) {
                    document.title = `Quotation-${data.quotationNumber}`;
                }
            } catch (error) {
                console.error("Error:", error);
                toast.error("Error loading quotation for printing.");
            } finally {
                setLoading(false);
            }
        };
        fetchQuotation();

        // Reset title when unmounting
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

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin mr-2 text-blue-600" /> Loading Quotation...</div>;
    if (!quotation) return <div className="text-center mt-10 text-red-500">Quotation not found.</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans print:bg-white print:p-0 print:m-0 print:overflow-hidden">
            <Toaster position="top-center" />
            
            {/* --- Custom Print Styles (Optimized for A4) --- */}
            <style>
                {`
                    @media print {
                        @page { 
                            size: A4; 
                            margin: 0; /* Removes browser headers/footers */
                        }
                        
                        body, html { 
                            margin: 0;
                            padding: 0;
                            width: 100%;
                            height: 100%;
                            background-color: white !important;
                            -webkit-print-color-adjust: economy;
                        }

                        .print\\:hidden { display: none !important; }
                        
                        /* Optimized Container for A4 Print */
                        .print\\:container {
                            width: 100% !important;
                            max-width: 210mm !important; 
                            min-height: 100vh;
                            margin: 0 auto !important;
                            /* Padding: Top/Bottom 10mm, Left/Right 15mm */
                            padding: 20mm 15mm !important; 
                            box-sizing: border-box;
                            box-shadow: none !important;
                            border: none !important;
                            position: absolute;
                            top: 0;
                            left: 0;
                        }
                        
                        table { width: 100% !important; table-layout: auto; }
                        .print\\:text-black { color: black !important; }
                    }
                `}
            </style>

            {/* --- Action Bar (Hidden in Print) --- */}
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

            {/* --- QUOTATION DOCUMENT --- */}
            <div className="flex justify-center print:block">
                <div 
                    className="w-[210mm] bg-white shadow-2xl print:container" 
                    style={{ minHeight: '297mm' }}
                >
                    <div className="p-10 md:p-12 print:p-0 h-full flex flex-col justify-between  border-gray-200 print:border-none">
                        
                        <div>
                            {/* Header Section */}
                            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
                                <div className="w-1/2">
                                    <h1 className="text-4xl font-extrabold text-gray-900 uppercase tracking-tight print:text-black">QUOTATION</h1>
                                    <p className="text-gray-500 mt-1 text-sm">Estimate for Project</p>
                                </div>
                                <div className="w-1/2 text-right break-words pl-4">
                                    {/* Quotation From Details */}
                                    <div className="mb-2 text-xl font-bold text-blue-700 print:text-black">{quotation.quotationFrom?.companyName || 'Company Name'}</div>
                                    <p className="text-gray-600 text-sm whitespace-pre-line">{quotation.quotationFrom?.address || 'Address'}</p>
                                    <p className="text-gray-600 text-sm mt-1">Ph: {quotation.quotationFrom?.contactNumber || 'Phone'}</p>
                                    {quotation.quotationFrom?.gst && <p className="text-gray-600 text-sm font-semibold">GSTIN: {quotation.quotationFrom.gst}</p>}
                                </div>
                            </div>

                            {/* Quotation To & Meta Details */}
                            <div className="flex justify-between mb-8">
                                <div className="w-1/2 pr-4">
                                    <h3 className="text-gray-500 text-xs font-bold uppercase mb-2 tracking-wider">Quotation To:</h3>
                                    <div className="text-gray-900 font-bold text-lg print:text-black">{quotation.quotationTo?.name || quotation.quotationToName || 'Client Name'}</div>
                                    <p className="text-gray-600 text-sm whitespace-pre-line mt-1">{quotation.quotationTo?.address || 'Client Address'}</p>
                                    <p className="text-gray-600 text-sm mt-1">Ph: {quotation.quotationTo?.contactNumber || quotation.phoneTo || 'Phone'}</p>
                                </div>
                                <div className="w-1/2 text-right pl-4">
                                    <div className="mb-2">
                                        <span className="text-gray-500 text-xs font-bold uppercase block">Quotation No:</span>
                                        <span className="text-gray-900 font-bold text-xl print:text-black">{quotation.quotationNumber}</span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-gray-500 text-xs font-bold uppercase block">Date:</span>
                                        <span className="text-gray-900 font-medium">{formatDate(quotation.quotationDate)}</span>
                                    </div>
                                    {quotation.dueDate && (
                                        <div>
                                            <span className="text-gray-500 text-xs font-bold uppercase block">Valid Until:</span>
                                            <span className="text-gray-900 font-medium">{formatDate(quotation.dueDate)}</span>
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
                                    {quotation.items && quotation.items.map((item, index) => {
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

                            {/* Totals Section */}
                            <div className="flex justify-end mb-12">
                                <div className="w-1/2 sm:w-5/12 space-y-2 border-t border-gray-300 pt-4">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal:</span>
                                        <span className="font-medium">{formatCurrency(quotation.subTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>CGST:</span>
                                        <span className="font-medium">{formatCurrency(quotation.totalCGST)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>SGST:</span>
                                        <span className="font-medium">{formatCurrency(quotation.totalSGST)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-extrabold text-gray-900 border-t-2 border-gray-800 pt-3 mt-2 print:text-black">
                                        <span>Grand Total:</span>
                                        <span>{formatCurrency(quotation.grandTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="mt-auto page-break-inside-avoid">
                            <div className="flex justify-between items-end mb-8 gap-8">
                                <div className="w-1/2 text-xs text-gray-500 pr-4">
                                    {quotation.termsAndConditions && (
                                        <>
                                            <p className="font-bold uppercase text-gray-700 mb-1">Terms & Conditions:</p>
                                            <p className="whitespace-pre-line leading-relaxed text-justify">{quotation.termsAndConditions}</p>
                                        </>
                                    )}
                                </div>
                                <div className="text-center w-1/3">
                                    {quotation.signature && (
                                        <div className="mb-4 text-lg font-cursive text-blue-900 font-bold italic print:text-black">{quotation.signature}</div>
                                    )}
                                    {!quotation.signature && <div className="h-12"></div>}
                                    <p className="text-xs font-bold uppercase text-gray-400 border-t border-gray-300 pt-2 px-2">Authorized Signatory</p>
                                </div>
                            </div>
                            <div className="text-center border-t border-gray-200 pt-4">
                                <p className="text-xs text-gray-400">This is a system-generated quotation.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationPrint;


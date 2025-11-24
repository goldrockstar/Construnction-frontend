import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Ban, Trash2, User, Building, Plus, RefreshCw, X, FileText, Calculator, IndianRupee, Calendar, Hash, Package, Percent } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const InvoiceForm = ({ initialData, onClose }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [profile, setProfile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const currentId = initialData?._id || id;

    const [formData, setFormData] = useState({
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().substring(0, 10),
        projectId: '',
        
        invoiceFrom: '',
        gstFrom: '',
        addressFrom: '',
        contactNumberFrom: '',

        invoiceTo: '', 
        invoiceToName: '',
        addressTo: '',
        phoneTo: '',
        gstNoTo: '',
        
        dueDate: '',
        signedDate: '',
        termsAndConditions: '1. Payment due immediately upon receipt.\n2. Please include invoice number on your check.',
        
        totalAmount: 0, 
    });
    
    const [gstPercentage, setGstPercentage] = useState(18); 
    const [items, setItems] = useState([
        { id: Date.now(), name: '', gstRate: 18, quantity: 1, rate: 0, amount: 0, cgst: 0, sgst: 0, total: 0 }
    ]);

    const safeFixed = (num, decimals = 2) => {
        const val = parseFloat(num);
        return isNaN(val) ? '0.00' : val.toFixed(decimals);
    };

    const calculations = useMemo(() => {
        const subTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const gstRate = parseFloat(gstPercentage) || 0;
        const gstAmt = subTotal * (gstRate / 100);
        const grandTotal = subTotal + gstAmt;

        return { subTotal, gstAmount: gstAmt, grandTotal };
    }, [items, gstPercentage]);

    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Authentication token not found.');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [projectsRes, clientsRes, profileRes] = await Promise.allSettled([
                    fetch(`${API_BASE_URL}/projects`, { headers }),
                    fetch(`${API_BASE_URL}/clients`, { headers }),
                    fetch(`${API_BASE_URL}/users/profile`, { headers }),
                ]);

                if (projectsRes.status === 'fulfilled' && projectsRes.value.ok) setProjects(await projectsRes.value.json());
                
                if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) {
                    const clientsData = await clientsRes.value.json();
                    console.log("Loaded Clients:", clientsData);
                    setClients(clientsData);
                }
                
                let profileData = null;
                if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
                    const rawProfile = await profileRes.value.json();
                    profileData = rawProfile.profile || rawProfile;
                    setProfile(profileData);
                    if (profileData._id) localStorage.setItem('profileId', profileData._id);
                }

                let dataToLoad = null;
                if (initialData) {
                    dataToLoad = initialData;
                } else if (id) {
                    const res = await fetch(`${API_BASE_URL}/invoices/${id}`, { headers });
                    if (res.ok) dataToLoad = await res.json();
                }

                if (dataToLoad) {
                    console.log("Loading Edit Data:", dataToLoad);
                    const projId = dataToLoad.projectId?._id || dataToLoad.projectId || '';
                    const clientId = dataToLoad.invoiceTo?.clientId || dataToLoad.invoiceTo?._id || dataToLoad.invoiceTo || '';
                    const loadedGstTo = dataToLoad.invoiceTo?.gst || dataToLoad.invoiceTo?.gstNo || '';

                    setFormData({
                        invoiceNumber: dataToLoad.invoiceNumber || '',
                        invoiceDate: dataToLoad.invoiceDate ? dataToLoad.invoiceDate.substring(0, 10) : '',
                        projectId: projId,
                        
                        invoiceFrom: dataToLoad.invoiceFrom?.companyName || dataToLoad.invoiceFrom || '',
                        gstFrom: dataToLoad.invoiceFrom?.gst || dataToLoad.gstFrom || '',
                        addressFrom: dataToLoad.invoiceFrom?.address || dataToLoad.addressFrom || '',
                        contactNumberFrom: dataToLoad.invoiceFrom?.contactNumber || dataToLoad.contactNumberFrom || '',

                        invoiceTo: clientId,
                        invoiceToName: dataToLoad.invoiceTo?.name || dataToLoad.invoiceToName || '',
                        addressTo: dataToLoad.invoiceTo?.address || dataToLoad.addressTo || '',
                        phoneTo: dataToLoad.invoiceTo?.contactNumber || dataToLoad.phoneTo || '',
                        gstNoTo: loadedGstTo,
                        
                        dueDate: dataToLoad.dueDate ? dataToLoad.dueDate.substring(0, 10) : '',
                        signedDate: dataToLoad.signedDate ? dataToLoad.signedDate.substring(0, 10) : '',
                        termsAndConditions: dataToLoad.termsAndConditions || '',
                        
                        totalAmount: parseFloat(dataToLoad.subTotal || dataToLoad.totalAmount) || 0,
                    });
                    
                    setGstPercentage(parseFloat(dataToLoad.gstPercentage) || 18);

                    if (dataToLoad.items?.length > 0) {
                        setItems(dataToLoad.items.map(item => ({ 
                            ...item, 
                            name: item.Name || item.name || '', 
                            amount: parseFloat(item.lineAmount || item.amount || 0),
                            cgst: parseFloat(item.cgst || 0),
                            sgst: parseFloat(item.sgst || 0),
                            total: parseFloat(item.lineTotal || item.total || 0),
                            id: item._id || Date.now() + Math.random() 
                        })));
                    }
                } else if (profileData) {
                    setFormData(prev => ({
                        ...prev,
                        invoiceFrom: profileData.companyName || profileData.username || '',
                        gstFrom: profileData.gst || profileData.gstNumber || '', 
                        addressFrom: profileData.address || '',
                        contactNumberFrom: profileData.contactNumber || profileData.phoneNumber || '',
                    }));
                }

            } catch (err) {
                console.error(err);
                toast.error("Failed to load data.");
            } finally {
                setIsLoading(false);
            }
        };

        initData();
    }, [id, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGstChange = (e) => setGstPercentage(e.target.value);

    const handleClientChange = (e) => {
        const selectedClientId = e.target.value;
        const client = clients.find(c => c._id === selectedClientId);

        console.log("Selected Client Object:", client);

        setFormData(prev => ({
            ...prev,
            invoiceTo: selectedClientId,
            invoiceToName: client ? (client.clientName || client.name) : '',
            addressTo: client ? client.address : '',
            phoneTo: client ? (client.phoneNumber || client.contactNumber) : '',
            gstNoTo: client ? (client.gst || client.gstNo || client.gstNumber || client.GSTIN || '') : '',
        }));
    };

    const handleProjectChange = (e) => setFormData(prev => ({ ...prev, projectId: e.target.value }));

    const calculateRow = (item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        const gstPercent = parseFloat(item.gstRate) || 0;

        const amount = quantity * rate;
        const totalGSTAmount = (amount * gstPercent) / 100;
        const total = amount + totalGSTAmount;

        return { ...item, amount, cgst: totalGSTAmount / 2, sgst: totalGSTAmount / 2, total };
    };

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return calculateRow({ ...item, [field]: value });
            }
            return item;
        }));
    };

    const addItem = () => setItems([...items, { id: Date.now(), name: '', gstRate: 18, quantity: 1, rate: 0, amount: 0, cgst: 0, sgst: 0, total: 0 }]);
    const deleteItem = (id) => items.length > 1 ? setItems(items.filter(i => i.id !== id)) : toast.error("One item required.");

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!formData.projectId) return toast.error("Please select a Project.");
        if (!formData.invoiceTo) return toast.error("Please select a Client.");
        if (items.length === 0) return toast.error("Please add at least one item.");
        
        const validItems = items.filter(i => i.name && i.total > 0);
        if (validItems.length === 0) {
             return toast.error("Please ensure at least one item has a name and amount > 0.");
        }

        let profileId = profile?._id || localStorage.getItem('profileId') || localStorage.getItem('userId');
        
        setIsSaving(true);

        const mappedItems = validItems.map(item => ({
            Name: item.name, 
            gstRate: parseFloat(item.gstRate) || 0,
            quantity: parseFloat(item.quantity) || 0,
            rate: parseFloat(item.rate) || 0,
            lineAmount: parseFloat(item.amount) || 0,
            cgst: parseFloat(item.cgst) || 0,
            sgst: parseFloat(item.sgst) || 0,
            lineTotal: parseFloat(item.total) || 0
        }));

        const payload = {
            invoiceNumber: formData.invoiceNumber,
            invoiceDate: formData.invoiceDate,
            projectId: formData.projectId,
            
            invoiceFrom: { 
                companyName: formData.invoiceFrom, 
                gst: formData.gstFrom, 
                address: formData.addressFrom, 
                contactNumber: formData.contactNumberFrom, 
                profileId: profileId 
            },
            invoiceTo: { 
                clientId: formData.invoiceTo, 
                name: formData.invoiceToName, 
                address: formData.addressTo, 
                contactNumber: formData.phoneTo,
                gst: formData.gstNoTo 
            },
            
            totalAmount: calculations.subTotal, 
            gstPercentage: parseFloat(gstPercentage),
            subTotal: calculations.subTotal,
            totalGST: calculations.gstAmount,
            grandTotal: calculations.grandTotal,
            
            dueDate: formData.dueDate || undefined,
            signedDate: formData.signedDate || undefined,
            termsAndConditions: formData.termsAndConditions,
            signature: "Pending",
            status: "Draft",
            items: mappedItems 
        };

        try {
            const token = localStorage.getItem('token');
            const url = currentId ? `${API_BASE_URL}/invoices/${currentId}` : `${API_BASE_URL}/invoices`;
            const method = currentId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${currentId ? 'update' : 'add'} invoice.`);
            }

            toast.success(`Invoice ${currentId ? 'updated' : 'created'} successfully!`);
            
            setTimeout(() => {
                if (onClose) onClose();
                else navigate('/invoices'); 
            }, 1000); 

        } catch (error) {
            console.error('Form submission error:', error);
            toast.error(error.message || 'An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (onClose) onClose();
        else navigate('/invoices');
    };

    if (isLoading) return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
                <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">Loading Invoice Form...</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Toaster position="top-right" />
            
            {/* Main Container - Fixed Size with Scroll */}
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden">
                {/* Fixed Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {currentId ? 'Edit Invoice' : 'Create New Invoice'}
                                </h1>
                                <p className="text-blue-100 text-sm mt-1">
                                    {currentId ? 'Update invoice details' : 'Create a professional invoice'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="hidden md:block bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <button 
                                onClick={handleCancel}
                                className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors duration-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSave} className="p-6 space-y-6">
                        {/* Meta Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <Hash className="w-4 h-4 mr-2 text-blue-500" />
                                    Invoice No
                                </label>
                                <input 
                                    type="text" 
                                    name="invoiceNumber" 
                                    value={formData.invoiceNumber} 
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                                    placeholder="INV-001" 
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <Calendar className="w-4 h-4 mr-2 text-green-500" />
                                    Invoice Date
                                </label>
                                <input 
                                    type="date" 
                                    name="invoiceDate" 
                                    value={formData.invoiceDate} 
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <Building className="w-4 h-4 mr-2 text-purple-500" />
                                    Project *
                                </label>
                                <select 
                                    name="projectId" 
                                    value={formData.projectId} 
                                    onChange={handleProjectChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                                    required
                                >
                                    <option value="">-- Select Project --</option>
                                    {projects.map(p => (
                                        <option key={p._id} value={p._id}>{p.projectName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* From & To Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* From Section */}
                            <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-4 rounded-xl border border-emerald-200">
                                <h3 className="text-lg font-bold text-emerald-800 mb-3 flex items-center">
                                    <Building className="w-5 h-5 mr-2" />
                                    From Details
                                </h3>
                                <div className="space-y-3">
                                    <input 
                                        name="invoiceFrom" 
                                        value={formData.invoiceFrom} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                        placeholder="Company Name" 
                                    />
                                    <input 
                                        name="gstFrom" 
                                        value={formData.gstFrom} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                        placeholder="GST Number" 
                                    />
                                    <textarea 
                                        name="addressFrom" 
                                        value={formData.addressFrom} 
                                        onChange={handleChange}
                                        rows="2"
                                        className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                        placeholder="Company Address"
                                    ></textarea>
                                    <input 
                                        name="contactNumberFrom" 
                                        value={formData.contactNumberFrom} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                        placeholder="Contact Number" 
                                    />
                                </div>
                            </div>

                            {/* To Section */}
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-4 rounded-xl border border-blue-200">
                                <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center">
                                    <User className="w-5 h-5 mr-2" />
                                    Client Details *
                                </h3>
                                <div className="space-y-3">
                                    <select 
                                        name="invoiceTo" 
                                        value={formData.invoiceTo} 
                                        onChange={handleClientChange}
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        required
                                    >
                                        <option value="">-- Select Client --</option>
                                        {clients.map(c => (
                                            <option key={c._id} value={c._id}>{c.clientName}</option>
                                        ))}
                                    </select>
                                    <input 
                                        name="invoiceToName" 
                                        value={formData.invoiceToName} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        placeholder="Client Name" 
                                    />
                                    <textarea 
                                        name="addressTo" 
                                        value={formData.addressTo} 
                                        onChange={handleChange}
                                        rows="2"
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        placeholder="Client Address"
                                    ></textarea>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input 
                                            name="phoneTo" 
                                            value={formData.phoneTo} 
                                            onChange={handleChange}
                                            className="px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            placeholder="Phone" 
                                        />
                                        <input 
                                            name="gstNoTo" 
                                            value={formData.gstNoTo} 
                                            onChange={handleChange}
                                            className="px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            placeholder="GST No" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                    <Package className="w-5 h-5 mr-2 text-purple-500" />
                                    Items & Services
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="bg-gray-50">
                                        <tr className="text-left text-xs font-semibold text-gray-700">
                                            <th className="px-4 py-3">Item Description</th>
                                            <th className="px-2 py-3 text-center w-16">Qty</th>
                                            <th className="px-2 py-3 text-right w-24">Rate (₹)</th>
                                            <th className="px-4 py-3 text-right w-28">Amount (₹)</th>
                                            <th className="px-2 py-3 text-center w-16">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {items.map((item) => (
                                            <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <input 
                                                        value={item.name} 
                                                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                                                        placeholder="Item description"
                                                        required 
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <input 
                                                        type="number" 
                                                        value={item.quantity} 
                                                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center bg-white text-sm"
                                                        required 
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <input 
                                                        type="number" 
                                                        value={item.rate} 
                                                        onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-right bg-white text-sm"
                                                        required 
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-gray-700 text-sm">
                                                    ₹{safeFixed(item.amount)}
                                                </td>
                                                <td className="px-2 py-3 text-center">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => deleteItem(item.id)}
                                                        className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors duration-200"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-4 py-3 border-t border-gray-200">
                                <button 
                                    type="button" 
                                    onClick={addItem}
                                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
                                >
                                    <Plus size={16} />
                                    <span>Add New Item</span>
                                </button>
                            </div>
                        </div>

                        {/* Summary & Terms */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Terms & Conditions */}
                            <div className="lg:col-span-2 space-y-3">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Terms & Conditions
                                </label>
                                <textarea 
                                    name="termsAndConditions" 
                                    value={formData.termsAndConditions} 
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                ></textarea>
                            </div>

                            {/* Cost Summary */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-xl border border-blue-200">
                                <h4 className="text-base font-bold text-gray-800 mb-3 flex items-center">
                                    <Calculator className="w-4 h-4 mr-2 text-blue-600" />
                                    Cost Summary
                                </h4>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 text-sm">Subtotal:</span>
                                        <span className="font-semibold text-gray-800">₹{safeFixed(calculations.subTotal)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 text-sm">GST %:</span>
                                        <input 
                                            type="number" 
                                            value={gstPercentage} 
                                            onChange={handleGstChange} 
                                            className="w-16 px-2 py-1 border border-blue-300 rounded text-right text-sm bg-white"
                                        />
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 text-sm">GST Amount:</span>
                                        <span className="font-semibold text-gray-800">₹{safeFixed(calculations.gstAmount)}</span>
                                    </div>

                                    <div className="border-t border-gray-300 pt-2 mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-bold text-gray-800">Grand Total:</span>
                                            <span className="text-xl font-bold text-green-600">
                                                ₹{calculations.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none flex items-center space-x-2 font-semibold"
                            >
                                {isSaving ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span>{isSaving ? 'Saving...' : 'Save Invoice'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InvoiceForm;
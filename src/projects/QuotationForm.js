import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Ban, Trash2, User, Building, Plus, RefreshCw, FileText, Calculator, IndianRupee, Calendar, Hash, Package, Percent, X } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5000/api';

const QuotationForm = ({ initialData, onClose }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [profile, setProfile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const currentId = initialData?._id || id;

    const [formData, setFormData] = useState({
        quotationNumber: '',
        quotationDate: new Date().toISOString().substring(0, 10),
        projectId: '',
        
        quotationFrom: '',
        gstFrom: '',
        addressFrom: '',
        contactNumberFrom: '',

        quotationTo: '',
        quotationToName: '',
        addressTo: '',
        phoneTo: '',
        gstTo: '',
        
        dueDate: '',
        signedDate: '',
        termsAndConditions: '1. Goods once sold cannot be taken back.\n2. Payment due within 15 days.',
        
        totalAmount: 0,
    });

    const [items, setItems] = useState([
        { id: Date.now(), name: '', unit: '', gstRate: 18, quantity: 1, rate: 0, amount: 0, cgst: 0, sgst: 0, total: 0 }
    ]);

    const safeFixed = (num, decimals = 2) => {
        const val = parseFloat(num);
        return isNaN(val) ? '0.00' : val.toFixed(decimals);
    };

    const calculations = useMemo(() => {
        const subTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalCGST = items.reduce((sum, item) => sum + (parseFloat(item.cgst) || 0), 0);
        const totalSGST = items.reduce((sum, item) => sum + (parseFloat(item.sgst) || 0), 0);
        const grandTotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

        return { subTotal, totalGST: totalCGST + totalSGST, grandTotal };
    }, [items]);

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
                if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) setClients(await clientsRes.value.json());
                
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
                } else if (currentId) {
                    const res = await fetch(`${API_BASE_URL}/quotations/${currentId}`, { headers });
                    if (res.ok) dataToLoad = await res.json();
                }

                if (dataToLoad) {
                    const projId = dataToLoad.projectId?._id || dataToLoad.projectId || '';
                    const clientId = dataToLoad.quotationTo?._id || dataToLoad.quotationTo?.clientId || dataToLoad.quotationTo || '';

                    setFormData({
                        quotationNumber: dataToLoad.quotationNumber || '',
                        quotationDate: dataToLoad.quotationDate ? dataToLoad.quotationDate.substring(0, 10) : '',
                        projectId: projId,

                        quotationFrom: dataToLoad.quotationFrom?.companyName || dataToLoad.quotationFrom || '',
                        gstFrom: dataToLoad.quotationFrom?.gst || dataToLoad.gstFrom || '',
                        addressFrom: dataToLoad.quotationFrom?.address || dataToLoad.addressFrom || '',
                        contactNumberFrom: dataToLoad.quotationFrom?.contactNumber || dataToLoad.contactNumberFrom || '',

                        quotationTo: clientId,
                        quotationToName: dataToLoad.quotationTo?.name || dataToLoad.quotationToName || '',
                        addressTo: dataToLoad.quotationTo?.address || dataToLoad.addressTo || '',
                        phoneTo: dataToLoad.quotationTo?.contactNumber || dataToLoad.phoneTo || '',
                        gstTo: dataToLoad.quotationTo?.gst || dataToLoad.gstTo || '',

                        dueDate: dataToLoad.dueDate ? dataToLoad.dueDate.substring(0, 10) : '',
                        signedDate: dataToLoad.signedDate ? dataToLoad.signedDate.substring(0, 10) : '',
                        termsAndConditions: dataToLoad.termsAndConditions || '',
                    });

                    if (dataToLoad.items && dataToLoad.items.length > 0) {
                        setItems(dataToLoad.items.map(item => ({
                            ...item,
                            name: item.Name || item.name || '',
                            amount: parseFloat(item.amount || item.lineAmount || 0),
                            cgst: parseFloat(item.cgst || 0),
                            sgst: parseFloat(item.sgst || 0),
                            total: parseFloat(item.total || item.lineTotal || 0),
                            id: item._id || Date.now() + Math.random()
                        })));
                    }
                } else if (profileData) {
                    setFormData(prev => ({
                        ...prev,
                        quotationFrom: profileData.companyName || profileData.username || '',
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
    }, [currentId, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClientChange = (e) => {
        const selectedClientId = e.target.value;
        const client = clients.find(c => c._id === selectedClientId);

        setFormData(prev => ({
            ...prev,
            quotationTo: selectedClientId,
            quotationToName: client ? (client.clientName || client.name) : '',
            addressTo: client ? client.address : '',
            phoneTo: client ? (client.phoneNumber || client.contactNumber) : '',
            gstTo: client ? client.gstNo : '',
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

    const addItem = () => {
        const defaultGst = profile?.defaultGstRate || 18;
        setItems([...items, { id: Date.now(), name: '', unit: '', gstRate: defaultGst, quantity: 1, rate: 0, amount: 0, cgst: 0, sgst: 0, total: 0 }]);
    };

    const deleteItem = (id) => items.length > 1 ? setItems(items.filter(i => i.id !== id)) : toast.error("At least one item required.");

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.projectId) return toast.error("Please select a Project.");
        if (!formData.quotationTo) return toast.error("Please select a Client.");
        
        const validItems = items.filter(i => i.name && i.total > 0);
        if (validItems.length === 0) return toast.error("Please check items (Name required, Amount > 0).");

        let profileId = profile?._id || localStorage.getItem('profileId') || localStorage.getItem('userId');
        
        setIsSaving(true);

        const mappedItems = validItems.map(item => ({
            Name: item.name,
            unit: item.unit,
            gstRate: parseFloat(item.gstRate) || 0,
            quantity: parseFloat(item.quantity) || 0,
            rate: parseFloat(item.rate) || 0,
            amount: parseFloat(item.amount) || 0,
            cgst: parseFloat(item.cgst) || 0,
            sgst: parseFloat(item.sgst) || 0,
            total: parseFloat(item.total) || 0
        }));

        const payload = {
            quotationNumber: formData.quotationNumber,
            quotationDate: formData.quotationDate,
            projectId: formData.projectId,
            quotationFrom: {
                companyName: formData.quotationFrom,
                gst: formData.gstFrom,
                address: formData.addressFrom,
                contactNumber: formData.contactNumberFrom,
                profileId: profileId
            },
            quotationTo: {
                clientId: formData.quotationTo,
                name: formData.quotationToName,
                address: formData.addressTo,
                phone: formData.phoneTo,
                gst: formData.gstTo
            },
            items: mappedItems,
            subTotal: calculations.subTotal,
            totalCGST: items.reduce((sum, item) => sum + (item.cgst || 0), 0),
            totalSGST: items.reduce((sum, item) => sum + (item.sgst || 0), 0),
            grandTotal: calculations.grandTotal,
            dueDate: formData.dueDate,
            signedDate: formData.signedDate,
            termsAndConditions: formData.termsAndConditions,
        };

        try {
            const token = localStorage.getItem('token');
            const url = currentId ? `${API_BASE_URL}/quotations/${currentId}` : `${API_BASE_URL}/quotations`;
            const method = currentId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Server Error: ${response.statusText}`);
            }

            toast.success(`Quotation ${currentId ? 'updated' : 'created'} successfully!`);
            
            setTimeout(() => {
                if (onClose) onClose();
                else navigate('/quotation');
            }, 1000);

        } catch (error) {
            console.error("Save Error:", error);
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (onClose) onClose();
        else navigate('/quotation');
    };

    if (isLoading) return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg font-medium">Loading Quotation Form...</p>
                <p className="text-gray-500 text-sm">Preparing your business document</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
                                    {currentId ? 'Edit Quotation' : 'Create New Quotation'}
                                </h1>
                                <p className="text-blue-100 text-sm mt-1">
                                    {currentId ? 'Update your business quotation' : 'Create a professional business quotation'}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <Hash className="w-4 h-4 mr-2 text-blue-500" />
                                    Quotation No
                                </label>
                                <input 
                                    type="text" 
                                    name="quotationNumber" 
                                    value={formData.quotationNumber} 
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                                    placeholder="QTN-001" 
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <Calendar className="w-4 h-4 mr-2 text-green-500" />
                                    Quotation Date
                                </label>
                                <input 
                                    type="date" 
                                    name="quotationDate" 
                                    value={formData.quotationDate} 
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                                    Due Date
                                </label>
                                <input 
                                    type="date" 
                                    name="dueDate" 
                                    value={formData.dueDate} 
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white"
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
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
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
                                        name="quotationFrom" 
                                        value={formData.quotationFrom} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                        placeholder="Company Name" 
                                    />
                                    <input 
                                        name="gstFrom" 
                                        value={formData.gstFrom} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                        placeholder="GST Number" 
                                    />
                                    <textarea 
                                        name="addressFrom" 
                                        value={formData.addressFrom} 
                                        onChange={handleChange}
                                        rows="2"
                                        className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                        placeholder="Company Address"
                                    ></textarea>
                                    <input 
                                        name="contactNumberFrom" 
                                        value={formData.contactNumberFrom} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
                                        name="quotationTo" 
                                        value={formData.quotationTo} 
                                        onChange={handleClientChange}
                                        className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        required
                                    >
                                        <option value="">-- Select Client --</option>
                                        {clients.map(c => (
                                            <option key={c._id} value={c._id}>{c.clientName}</option>
                                        ))}
                                    </select>
                                    <input 
                                        name="quotationToName" 
                                        value={formData.quotationToName} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        placeholder="Client Name" 
                                    />
                                    <textarea 
                                        name="addressTo" 
                                        value={formData.addressTo} 
                                        onChange={handleChange}
                                        rows="2"
                                        className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        placeholder="Client Address"
                                    ></textarea>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input 
                                            name="phoneTo" 
                                            value={formData.phoneTo} 
                                            onChange={handleChange}
                                            className="px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            placeholder="Phone" 
                                        />
                                        <input 
                                            name="gstTo" 
                                            value={formData.gstTo} 
                                            onChange={handleChange}
                                            className="px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                                <table className="w-full min-w-[800px]">
                                    <thead className="bg-gray-50">
                                        <tr className="text-left text-xs font-semibold text-gray-700">
                                            <th className="px-4 py-3">Item Description</th>
                                            <th className="px-2 py-3 text-center w-20">Unit</th>
                                            <th className="px-2 py-3 text-center w-16">
                                                <div className="flex items-center justify-center">
                                                    <Percent className="w-3 h-3 mr-1" />
                                                    GST%
                                                </div>
                                            </th>
                                            <th className="px-2 py-3 text-center w-16">Qty</th>
                                            <th className="px-2 py-3 text-right w-24">Rate (₹)</th>
                                            <th className="px-4 py-3 text-right w-28">Amount (₹)</th>
                                            <th className="px-4 py-3 text-right w-28">Total (₹)</th>
                                            <th className="px-2 py-3 text-center w-16">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {items.map((item) => (
                                            <tr key={item.id} className="hover:bg-blue-50/30 transition-colors duration-150">
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
                                                        value={item.unit} 
                                                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center bg-white text-sm"
                                                        placeholder="Nos" 
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <input 
                                                        type="number" 
                                                        value={item.gstRate} 
                                                        onChange={(e) => handleItemChange(item.id, 'gstRate', e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center bg-white text-sm"
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
                                                <td className="px-4 py-3 text-right font-bold text-green-600 text-sm">
                                                    ₹{safeFixed(item.total)}
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
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                                        <span className="text-gray-600 text-sm">Total GST:</span>
                                        <span className="font-semibold text-gray-800">₹{safeFixed(calculations.totalGST)}</span>
                                    </div>

                                    <div className="border-t border-gray-300 pt-2 mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-bold text-gray-800">Grand Total:</span>
                                            <span className="text-xl font-bold text-green-600 flex items-center">
                                                <IndianRupee className="w-4 h-4 mr-1" />
                                                {calculations.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Fixed at bottom of scrollable area */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-200">
                            <button 
                                type="button" 
                                onClick={handleCancel}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2 font-medium text-sm"
                            >
                                <Ban className="w-4 h-4" />
                                <span>Cancel</span>
                            </button>
                            
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none flex items-center space-x-2 font-bold text-sm"
                            >
                                {isSaving ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span>
                                    {isSaving ? 'Saving...' : (currentId ? 'Update Quotation' : 'Create Quotation')}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default QuotationForm;
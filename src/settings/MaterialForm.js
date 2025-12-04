import React, { useState, useEffect } from 'react';
import { Hash, Package, DollarSign, Layers, AlertCircle, IndianRupee } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const STATUS_ENUMS = ['Available', 'Low Stock', 'Out of Stock'];

const MaterialForm = ({ material, onClose }) => {
    const [formData, setFormData] = useState({
        materialId: 'Loading...', 
        materialNames: [],
        unitofMeasure: '',
        availableQuantity: '',
        reorderedLevel: '',
        purchasePrice: '',
        supplierName: '',
        status: 'Available' 
    });
    
    const [tagInput, setTagInput] = useState('');
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    // Fetch Next Material ID (Only for New Material)
    useEffect(() => {
        let isMounted = true;
        if (material) {
            // Edit Mode
            setFormData({
                materialId: material.materialId || '',
                materialNames: Array.isArray(material.materialNames) ? material.materialNames : (material.materialNames ? material.materialNames.split(',').map(s => s.trim()) : []),
                unitofMeasure: material.unitofMeasure || '',
                availableQuantity: material.availableQuantity || '',
                reorderedLevel: material.reorderedLevel || '',
                purchasePrice: material.purchasePrice || '',
                supplierName: material.supplierName || '',
                status: material.status || 'Available'
            });
        } else {
            // Add Mode
            const fetchNextId = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_BASE_URL}/materials/next-id`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (isMounted) setFormData(prev => ({ ...prev, materialId: data.materialId }));
                    } else {
                        if (isMounted) setFormData(prev => ({ ...prev, materialId: 'Error' }));
                    }
                } catch (error) {
                    console.error("Error fetching material ID:", error);
                    if (isMounted) setFormData(prev => ({ ...prev, materialId: 'Error' }));
                }
            };
            fetchNextId();
        }
        return () => { isMounted = false; };
    }, [material]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagInputChange = (e) => setTagInput(e.target.value);

    const handleAddTag = (e) => {
        if (e.key === 'Enter' || e.type === 'blur') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !formData.materialNames.includes(newTag)) {
                setFormData(prev => ({
                    ...prev,
                    materialNames: [...prev.materialNames, newTag]
                }));
                setTagInput('');
            }
        }
    };

    // const handleRemoveTag = (tagToRemove) => {
    //     setFormData(prev => ({
    //         ...prev,
    //         materialNames: prev.materialNames.filter(tag => tag !== tagToRemove)
    //     }));
    // };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        setSuccessMessage(null);

        const price = parseFloat(formData.purchasePrice);
        if (isNaN(price) || price <= 0) {
            setFormError("Purchase Price must be a valid positive number.");
            setSubmitting(false);
            return;
        }

        if (formData.materialNames.length === 0 || !formData.unitofMeasure) {
            setFormError("Material Name and Unit are required.");
            setSubmitting(false);
            return;
        }

        const dataToSave = {
            materialId: formData.materialId,
            materialNames: formData.materialNames,
            unitofMeasure: formData.unitofMeasure,
            purchasePrice: price,
            availableQuantity: Number(formData.availableQuantity) || 0,
            reorderedLevel: Number(formData.reorderedLevel) || 0,
            supplierName: formData.supplierName,
            status: formData.status || 'Available'
        };

        try {
            const token = localStorage.getItem('token');
            const url = material ? `${API_BASE_URL}/materials/${material._id}` : `${API_BASE_URL}/materials`;
            const method = material ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(dataToSave),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save material');
            }

            setSuccessMessage("Material saved successfully!");
            setTimeout(() => onClose(), 1500);
            
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col border-t-4 border-indigo-600">

            <h3 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
                <Package className="w-6 h-6 mr-2 text-indigo-600" />
                {material ? 'Edit Material' : 'Add New Material'}
            </h3>

            {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 flex items-center text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {formError}
                </div>
            )}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded mb-4 text-center text-sm font-medium">
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col flex-grow space-y-4 overflow-y-auto pr-1">

                {/* Material ID (Read Only) */}
                <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Material ID <span className="text-gray-400 font-normal">(Auto)</span></label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            value={formData.materialId}
                            readOnly
                            disabled
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none font-mono"
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Material Names</label>
                    <div className="border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-indigo-500 transition duration-150 bg-white">
                        {/* <div className="flex flex-wrap gap-2 mb-2">
                            {formData.materialNames.map((tag, index) => (
                                <span key={index} className="flex items-center bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full border border-indigo-100">
                                    {tag}
                                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 text-indigo-400 hover:text-indigo-600 focus:outline-none">&times;</button>
                                </span>
                            ))}
                        </div> */}
                        <input
                            type="text"
                            value={tagInput}
                            onChange={handleTagInputChange}
                            onKeyDown={handleAddTag}
                            placeholder="Type name and press Enter..."
                            className="w-full outline-none text-sm text-gray-700"
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Unit of Measure</label>
                    <input name="unitofMeasure" value={formData.unitofMeasure} onChange={handleChange} required className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" placeholder="e.g. Bags, Kg" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-semibold text-gray-700">Purchase Quantity</label>
                        <div className="relative">
                            <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input type="number" name="availableQuantity" value={formData.availableQuantity} onChange={handleChange} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-semibold text-gray-700">Reorder Level</label>
                        <input type="number" name="reorderedLevel" value={formData.reorderedLevel} onChange={handleChange} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Purchase Price</label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} required className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00" />
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Supplier Name</label>
                    <input name="supplierName" value={formData.supplierName} onChange={handleChange} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Optional" />
                </div>

                <div className="flex flex-col">
                    <label className="mb-1 text-sm font-semibold text-gray-700">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                        {STATUS_ENUMS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                    <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-70">
                        {submitting ? 'Saving...' : 'Save Material'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MaterialForm;
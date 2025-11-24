import React, { useState, useEffect } from 'react';
// The 'alert' function is being replaced by a custom message box for better UX.

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

// The allowed enum values from your MaterialSchema are:
// ['Available', 'Low Stock', 'Out of Stock']
const STATUS_ENUMS = ['Available', 'Low Stock', 'Out of Stock'];


const MaterialForm = ({ material, onClose }) => {
    // FIX 1: Set the default status to an accepted enum value: 'Available'
    const [formData, setFormData] = useState({
        materialId: '',
        materialNames: [],
        unitofMeasure: '',
        availableQuantity: '',
        reorderedLevel: '',
        purchasePrice: '',
        supplierName: '',
        status: 'Available' // Corrected default value
    });
    const [tagInput, setTagInput] = useState('');
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        if (material) {
            setFormData({
                materialId: material.materialId || '',
                materialNames: Array.isArray(material.materialNames) ? material.materialNames : (material.materialNames ? material.materialNames.split(',').map(s => s.trim()) : []),
                unitofMeasure: material.unitofMeasure || '',
                availableQuantity: material.availableQuantity || '',
                reorderedLevel: material.reorderedLevel || '',
                purchasePrice: material.purchasePrice || '',
                supplierName: material.supplierName || '',
                // Ensure status defaults to a valid enum if the existing material status is null/undefined
                status: material.status || 'Available'
            });
        } else {
            setFormData({
                materialId: '',
                materialNames: [],
                unitofMeasure: '',
                availableQuantity: '',
                reorderedLevel: '',
                purchasePrice: '',
                supplierName: '',
                // FIX 2: Corrected initial state for new material
                status: 'Available'
            });
        }
    }, [material]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagInputChange = (e) => {
        setTagInput(e.target.value);
    };

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

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            materialNames: prev.materialNames.filter(tag => tag !== tagToRemove)
        }));
    };

    // Custom Modal/Alert function
    const showMessage = (message, isSuccess = false) => {
        if (isSuccess) {
            setSuccessMessage(message);
            setTimeout(() => setSuccessMessage(null), 3000); // Hide after 3 seconds
        } else {
            setFormError(message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        setSuccessMessage(null);

        // --- 1. Client-side validation ---
        // Ensure Price is a valid number before sending
        const price = parseFloat(formData.purchasePrice);
        if (isNaN(price) || price <= 0) {
            showMessage("Purchase Price must be a valid positive number.");
            setSubmitting(false);
            return;
        }

        if (!formData.materialId || formData.materialNames.length === 0 || !formData.unitofMeasure) {
            showMessage("Material ID, Name, and Unit are required.");
            setSubmitting(false);
            return;
        }

        // --- 2. Prepare Payload ---
        const dataToSave = {
            materialId: formData.materialId,
            materialNames: formData.materialNames,
            unitofMeasure: formData.unitofMeasure,
            purchasePrice: price,
            // Convert to Number, default to 0 if empty
            availableQuantity: Number(formData.availableQuantity) || 0,
            reorderedLevel: Number(formData.reorderedLevel) || 0,
            supplierName: formData.supplierName,
            status: formData.status || 'Available'
        };

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Authentication token not found. Please log in.");
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };

            const materialsApiUrl = `${API_BASE_URL}/materials`;
            let response;

            if (material && material.id) {
                // UPDATE
                response = await fetch(`${materialsApiUrl}/${material.id}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(dataToSave),
                });
            } else {
                // CREATE
                // FIX: Removed 'createdAt'. Let Mongoose handle timestamps automatically.
                response = await fetch(materialsApiUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(dataToSave),
                });
            }

            // --- 3. Handle Response Safely ---
            // We read text first to prevent "Unexpected token <" errors if server returns HTML 500 page
            const responseText = await response.text();

            if (!response.ok) {
                let errorMessage = `Server Error (${response.status})`;
                try {
                    // Try to parse JSON error message from backend
                    const errorJson = JSON.parse(responseText);
                    errorMessage = errorJson.message || errorMessage;
                } catch (parseError) {
                    // If parsing fails, the server likely sent an HTML crash page
                    console.error("Server returned non-JSON response:", responseText);
                    errorMessage = "Internal Server Error. Check console for details.";
                }
                throw new Error(errorMessage);
            }

            // Success
            showMessage("Material saved successfully", true);
            onClose(); 
            
        } catch (err) {
            console.error("Error saving material:", err);
            showMessage(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        // Added max-h-[90vh] and flex flex-col to enable scrolling logic
        <div className="p-6 bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col">

            {/* Header (Fixed) */}
            <h3 className="text-2xl font-bold mb-4 text-indigo-700 border-b pb-2">Material / {material ? 'Edit' : 'Add'}</h3>

            {/* Message Area (Fixed) */}
            {formError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    <p className="font-semibold">Error:</p>
                    <p className="text-sm">{formError}</p>
                </div>
            )}
            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                    <p className="font-semibold">Success!</p>
                    <p className="text-sm">{successMessage}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col flex-grow">

                {/* Scrollable Content Area */}
                {/* The `overflow-y-auto` and `flex-grow` classes make this section scrollable */}
                <div className="max-h-96 overflow-y-auto flex-grow space-y-4 pr-1">

                    <div className="flex flex-col">
                        <label htmlFor="materialId" className="mb-1 text-sm font-medium text-gray-700">Material ID:</label>
                        <input
                            type="text"
                            id="materialId"
                            name="materialId"
                            value={formData.materialId}
                            onChange={handleChange}
                            required
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                            placeholder="e.g., MAT-001"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="materialName" className="mb-1 text-sm font-medium text-gray-700">Material Names (Tags):</label>
                        <div className="border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-indigo-500 transition duration-150">
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.materialNames.map((tag, index) => (
                                    <span key={index} className="flex items-center bg-indigo-50 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="ml-2 text-indigo-600 hover:text-indigo-900 focus:outline-none"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                id="materialName"
                                value={tagInput}
                                onChange={handleTagInputChange}
                                onKeyDown={handleAddTag}
                                onBlur={handleAddTag}
                                placeholder="Type name and press Enter or Tab"
                                className="w-full bg-transparent outline-none text-gray-700 mt-1"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="unitofMeasure" className="mb-1 text-sm font-medium text-gray-700">Unit of Measure:</label>
                        <input
                            type="text"
                            id="unitofMeasure"
                            name="unitofMeasure"
                            value={formData.unitofMeasure}
                            onChange={handleChange}
                            required
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                            placeholder="e.g., CFT, Bags, Ton, Nos"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label htmlFor="availableQuantity" className="mb-1 text-sm font-medium text-gray-700">Available Quantity:</label>
                            <input
                                type="number"
                                id="availableQuantity"
                                name="availableQuantity"
                                value={formData.availableQuantity}
                                onChange={handleChange}
                                required
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                                placeholder="e.g., 1000"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="reorderedLevel" className="mb-1 text-sm font-medium text-gray-700">Reordered Level:</label>
                            <input
                                type="number"
                                id="reorderedLevel"
                                name="reorderedLevel"
                                value={formData.reorderedLevel}
                                onChange={handleChange}
                                required
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                                placeholder="e.g., 200"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="purchasePrice" className="mb-1 text-sm font-medium text-gray-700">Purchase Price (per Unit):</label>
                        <input
                            type="number"
                            id="purchasePrice"
                            name="purchasePrice"
                            value={formData.purchasePrice}
                            onChange={handleChange}
                            required
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                            placeholder="e.g., 1500"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="supplierName" className="mb-1 text-sm font-medium text-gray-700">Supplier Name:</label>
                        <input
                            type="text"
                            id="supplierName"
                            name="supplierName"
                            value={formData.supplierName}
                            onChange={handleChange}
                            required
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                            placeholder="e.g., ABC Suppliers"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="status" className="mb-1 text-sm font-medium text-gray-700">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange} // Your existing state change handler
                            required // Optional: ensure the user selects one
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                        >
                            {/* FIX 3: Map the backend enum values to the select options */}
                            {STATUS_ENUMS.map(status => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>

                {/* Fixed Footer Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50"
                    >
                        {submitting ? 'Saving...' : (material ? 'Update' : 'Save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MaterialForm;
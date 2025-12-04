import React, { useState, useEffect, useMemo } from 'react';
import { XCircle, Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const ProjectMaterialMappingForm = ({ mapping, onClose, onUpdate, projectId }) => {
    // Helper function to format date for the input field
    const formatDateToInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // 1. STATE DEFINITION
    const [formData, setFormData] = useState({
        // id: mapping?._id || null, // Removed ID field from initial state as it's not used in form
        projectId: projectId,
        materialId: '',
        materialName: '',
        unit: '',
        quantityIssued: '',
        quantityUsed: '',
        unitPrice: '',
        date: formatDateToInput(new Date()), // Default to today for new entry
        vendorName: '',
        vendorAddress: '',
        purchaseDate: '',
        description: mapping?.description || '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [materialOptions, setMaterialOptions] = useState([]);
    const [materialsLoading, setMaterialsLoading] = useState(false);


    // 2. CALCULATED FIELDS using useMemo (for efficient calculation and display)
    const { totalCost, balanceQuantity } = useMemo(() => {
        const issued = parseFloat(formData.quantityIssued) || 0;
        const used = parseFloat(formData.quantityUsed) || 0;
        const price = parseFloat(formData.unitPrice) || 0;

        const calculatedTotalCost = (used * price).toFixed(2);
        const calculatedBalanceQuantity = (issued - used).toFixed(2);

        return {
            totalCost: calculatedTotalCost,
            balanceQuantity: calculatedBalanceQuantity
        };
    }, [formData.quantityIssued, formData.quantityUsed, formData.unitPrice]);

    // 3. MATERIAL FETCH EFFECT: Fetching ALL required data from Inventory
    useEffect(() => {
        const fetchMaterials = async () => {
            setMaterialsLoading(true);
            try {
                const token = localStorage.getItem('token');

                const response = await fetch(`${API_BASE_URL}/materials`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch materials: ${response.statusText}`);
                }
                const materialsList = await response.json();

                const options = materialsList.map(material => ({
                    _id: material._id, // Inventory ID
                    materialName: material.materialNames[0] || 'N/A', // First material name
                    unit: material.unitofMeasure, // unitofMeasure -> unit
                    quantityIssued: material.availableQuantity, // availableQuantity -> quantityIssued
                    unitPrice: material.purchasePrice, // purchasePrice -> unitPrice
                })).filter(m => m.materialName); // Filter out entries without a name

                setMaterialOptions(options);
            } catch (err) {
                console.error("Error fetching materials for dropdown:", err);
                setFormError("Failed to load material options. Please try again.");
            } finally {
                setMaterialsLoading(false);
            }
        };

        fetchMaterials();
    }, []);

    // 4. INITIAL/EDIT DATA EFFECT: Populating form data for editing
    useEffect(() => {
        if (mapping) {
            setFormData({
                // id: mapping._id, // Not needed in state if only used in handleSubmit (which is commented out here)
                projectId: mapping.projectId || projectId || '',
                materialId: mapping.materialId?._id || mapping.materialId || '',
                materialName: mapping.materialName || '',
                quantityIssued: mapping.quantityIssued || '',
                quantityUsed: mapping.quantityUsed || 0,
                unit: mapping.unit || '',
                unitPrice: mapping.unitPrice || '',
                date: formatDateToInput(mapping.date) || '',
                vendorName: mapping.vendorName || '',
                vendorAddress: mapping.vendorAddress || '',
                purchaseDate: formatDateToInput(mapping.purchaseDate) || '',
                description: mapping.description || '',
            });
        }
    }, [mapping, projectId]);

    // 5. HANDLE CHANGE: Handles all input changes including material selection
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'materialSelection') {
            const selectedMaterial = materialOptions.find(m => m._id === value);
            if (selectedMaterial) {
                // *** 🎯 AUTOMATIC FILLING LOGIC START 🎯 ***
                setFormData(prev => ({
                    ...prev,
                    materialId: selectedMaterial._id, // ⬅️ materialId
                    materialName: selectedMaterial.materialName, // ⬅️ materialName
                    unit: selectedMaterial.unit, // ⬅️ unit
                    unitPrice: selectedMaterial.unitPrice.toString(), // ⬅️ unitPrice
                    quantityIssued: selectedMaterial.quantityIssued.toString(), // ⬅️ quantityIssued
                    // quantityUsed should typically remain 0 or the current value
                    // Reset quantityUsed to 0 when a new material is selected
                    quantityUsed: '0',
                }));
                // *** 🎯 AUTOMATIC FILLING LOGIC END 🎯 ***
            } else {
                // Reset when selection is cleared
                setFormData(prev => ({
                    ...prev,
                    materialId: '',
                    materialName: '',
                    unit: '',
                    unitPrice: '',
                    quantityIssued: '',
                    quantityUsed: '',
                }));
            }
            return;
        }

        // Handle all other form field changes
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        // --- Validation ---
        if (!formData.projectId || !formData.materialId || formData.quantityIssued === '' || !formData.unit || formData.unitPrice === '') {
            setFormError("Material, Quantity Issued, Unit, and Unit Price are required.");
            setSubmitting(false);
            return;
        }
        const issued = Number(formData.quantityIssued);
        const used = Number(formData.quantityUsed);
        const price = Number(formData.unitPrice);

        if (isNaN(issued) || issued <= 0) {
            setFormError("Quantity Issued must be a positive number.");
            setSubmitting(false);
            return;
        }
        if (isNaN(used) || used < 0 || used > issued) {
            setFormError("Quantity Used must be non-negative and cannot exceed Quantity Issued.");
            setSubmitting(false);
            return;
        }
        if (isNaN(price) || price <= 0) {
            setFormError("Unit Price must be a positive number.");
            setSubmitting(false);
            return;
        }
        if (parseFloat(balanceQuantity) < 0) {
            setFormError("Calculated balance quantity is negative. Check Issued vs Used quantities.");
            setSubmitting(false);
            return;
        }
        // --- End Validation ---


        try {
            // Data to send to the backend. ONLY RAW INPUTS are sent. 
            const dataToSave = {
                projectId: formData.projectId,
                materialId: formData.materialId,
                materialName: formData.materialName,
                unit: formData.unit,
                quantityIssued: issued,
                quantityUsed: used,
                unitPrice: price,
                date: formData.date,
                vendorName: formData.vendorName,
                vendorAddress: formData.vendorAddress,
                purchaseDate: formData.purchaseDate,
                // totalCost and balanceQuantity ARE NOT SENT
            };

            const token = localStorage.getItem('token');
            // Assuming this is for creating a NEW mapping, since 'id' handling is commented out
            const method = 'POST';
            const url = `${API_BASE_URL}/projectMaterialMappings`;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSave),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to save material mapping: ${response.statusText}`);
            }
            onUpdate('success', `Material mapping ${mapping ? 'updated' : 'added'} successfully!`);
        } catch (err) {
            console.error("Error saving material mapping:", err);
            onUpdate('error', "Failed to save material mapping: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative p-6 bg-white rounded-lg shadow-xl">
            <button
                onClick={onClose}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close form"
            >
                <XCircle size={24} />
            </button>
            <h3 className="text-xl font-bold text-center mb-4 text-gray-800">
                {mapping ? 'Edit Material Mapping' : 'Add New Material Mapping'}
            </h3>
            <form onSubmit={handleSubmit}>
                {formError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{formError}</span>
                    </div>
                )}
                <div className="space-y-4 h-96 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


                        {/* 2. Material Name - Select Dropdown linked to Inventory */}
                        <div>
                            <label htmlFor="materialSelection" className="block text-sm font-medium text-gray-700">Material Name:</label>
                            <div className="relative">
                                <select
                                    id="materialSelection"
                                    name="materialSelection"
                                    value={formData.materialId || ''}
                                    onChange={handleChange}
                                    required
                                    disabled={materialsLoading || (mapping && mapping.materialId)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none"
                                >
                                    <option value="">{materialsLoading ? 'Loading...' : 'Select a material'}</option>
                                    {materialOptions.map((material) => (
                                        <option key={material._id} value={material._id}>
                                            {material.materialName}
                                        </option>
                                    ))}
                                </select>
                                {materialsLoading && (
                                    <Loader2 className="animate-spin absolute right-3 top-1/2 -mt-2 text-indigo-500" size={16} />
                                )}
                            </div>
                        </div>

                        {/* 4. Unit (Display - Auto-filled) */}
                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit:</label>
                            <input
                                type="text"
                                id="unit"
                                name="unit"
                                value={formData.unit}
                                disabled
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 shadow-sm sm:text-sm font-semibold"
                            />
                        </div>

                        {/* 5. Unit Price (Display - Auto-filled from Inventory) */}
                        <div>
                            <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">Purchase Unit Price:</label>
                            <input
                                type="number"
                                id="unitPrice"
                                name="unitPrice"
                                value={formData.unitPrice}
                                onChange={handleChange}
                                required
                                min="0.01"
                                step="any"
                                disabled // Keep it disabled to show it's from inventory
                                placeholder="Auto-filled (₹)"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 shadow-sm sm:text-sm font-semibold"
                            />
                        </div>

                        {/* 6. Quantity Issued (Display - Auto-filled from Inventory Available Quantity) */}
                        <div>
                            <label htmlFor="quantityIssued" className="block text-sm font-medium text-gray-700">Purchase Quantity:</label>
                            <input
                                type="number"
                                id="quantityIssued"
                                name="quantityIssued"
                                value={formData.quantityIssued}
                                // onChange={handleChange}
                                required
                                min="0.01"
                                step="any"
                                disabled // Keep it disabled to show it's from inventory
                                placeholder="Auto-filled"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 shadow-sm sm:text-sm font-semibold"
                            />
                        </div>

                        {/* 7. Quantity Used (User Input - Not Auto-filled) */}
                        <div>
                            <label htmlFor="quantityUsed" className="block text-sm font-medium text-gray-700">Quantity Used:</label>
                            <input
                                type="number"
                                id="quantityUsed"
                                name="quantityUsed"
                                value={formData.quantityUsed}
                                onChange={handleChange}
                                required
                                min="0"
                                step="any"
                                placeholder="Enter used quantity"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {/* 10. Issue Date */}
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Issue Date:</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>

                        {/* Empty space for alignment */}
                        <div></div>
                    </div>

                    {/* Calculation Display */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4 mt-4 border-gray-200">
                        {/* 8. Total Cost (Calculated) */}
                        <div className="bg-indigo-50 p-3 rounded-md">
                            <label className='block text-sm font-bold text-indigo-700'>Total Cost:</label>
                            <input
                                type="text"
                                value={`₹ ${totalCost}`}
                                disabled
                                className='mt-1 block w-full px-3 py-2 border-none rounded-md bg-indigo-100 font-semibold text-lg text-indigo-800 shadow-sm sm:text-sm'
                            />
                        </div>
                        {/* 9. Balance Quantity (Calculated) */}
                        <div className="bg-green-50 p-3 rounded-md">
                            <label className='block text-sm font-bold text-green-700'>Balance Quantity:</label>
                            <input
                                type="text"
                                value={`${balanceQuantity} ${formData.unit || ''}`}
                                disabled
                                className='mt-1 block w-full px-3 py-2 border-none rounded-md bg-green-100 font-semibold text-lg text-green-800 shadow-sm sm:text-sm'
                            />
                        </div>
                    </div>
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="flex justify-end space-x-2 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || materialsLoading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitting ? 'Saving...' : (mapping ? 'Update Mapping' : 'Add Mapping')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectMaterialMappingForm;
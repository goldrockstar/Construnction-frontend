// ProjectMaterialUsageForm.js

import React, { useState, useEffect } from 'react';
import { Edit, PlusCircle, ArrowLeft } from 'lucide-react';
import PropTypes from 'prop-types';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const ProjectMaterialUsageForm = ({ usage, onClose, projectId, onUpdate }) => {
    const [formData, setFormData] = useState({
        projectId: projectId,
        materialId: '',
        quantityUsed: '',
        unit: '',
        fromDate: '',
        toDate: '',
    });

    const [materials, setMaterials] = useState([]);
    const [availableStock, setAvailableStock] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    // Fetch all materials from the backend
    const fetchMaterials = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setFormError('Authentication token not found. Please log in again.');
                return;
            }

            // Screenshot 117-ல், `materialsusage` என்று உள்ளது.
            // உங்கள் API எண்ட்பாயிண்ட் `/api/materials` ஆக இருந்தால், அதை சரியாகப் பயன்படுத்த வேண்டும்.
            const response = await fetch('https://construction-backend-uwd8.onrender.com/api/materials', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error fetching materials: ${response.statusText}`);
            }

            const apiResponse = await response.json();
            // API response-ல் `data` என்ற கீ இருந்தால், அதை எடுப்போம்.
            // இல்லையென்றால், response-ஐ நேரடியாகப் பயன்படுத்துவோம்.
            const data = Array.isArray(apiResponse) ? apiResponse : apiResponse.data;

            // டேட்டா வருகிறதா என்பதை உறுதிப்படுத்த console.log-ஐ பயன்படுத்தவும்
            console.log('Fetched materials data:', data);

            if (Array.isArray(data)) {
                setMaterials(data); // <-- டேட்டா இங்குதான் ஸ்டேட்டில் சேமிக்கப்படுகிறது
            } else {
                console.error("API response for materials is not an array:", apiResponse);
                setFormError('Invalid data received from materials API.');
                setMaterials([]);
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
            setFormError(`Failed to load materials: ${error.message}`);
        }
    };

    // Helper function to format date for input fields
    const formatDateToInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Fetch materials on component mount
    useEffect(() => {
        fetchMaterials();
    }, []);

    // Update form data when 'usage' prop changes (for editing)
    useEffect(() => {
        if (usage) {
            setFormData({
                projectId: usage.projectId || projectId || '',
                materialId: usage.materialId || '',
                quantityUsed: usage.quantityUsed || '',
                unit: usage.unit || '',
                fromDate: formatDateToInput(usage.fromDate) || '',
                toDate: formatDateToInput(usage.toDate) || '',
            });
        } else {
            setFormData({
                projectId: projectId || '',
                materialId: '',
                quantityUsed: '',
                unit: '',
                fromDate: formatDateToInput(new Date()),
                toDate: formatDateToInput(new Date()),
            });
        }
    }, [usage, projectId]);

    // Update available stock and unit when materialId changes
    useEffect(() => {
        const selectedMaterial = materials.find(m => m._id === formData.materialId);
        if (selectedMaterial) {
            setAvailableStock(selectedMaterial.stockQuantity);
            setFormData(prev => ({
                ...prev,
                unit: selectedMaterial.unit,
            }));
        } else {
            setAvailableStock(0);
            setFormData(prev => ({ ...prev, unit: '' }));
        }
    }, [formData.materialId, materials]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        // 1. Validate required fields on the frontend
        if (!formData.projectId || !formData.materialId || formData.quantityUsed === '' || !formData.fromDate || !formData.toDate) {
            setFormError("All fields are required.");
            setSubmitting(false);
            return;
        }

        const quantity = Number(formData.quantityUsed);
        if (isNaN(quantity) || quantity <= 0) {
            setFormError("Quantity Used must be a positive number.");
            setSubmitting(false);
            return;
        }

        // 2. Find the selected material object to get its name
        const selectedMaterial = materials.find(m => m._id === formData.materialId);

        // 3. Add an explicit check to make sure a valid material was selected
        if (!selectedMaterial) {
            setFormError("Please select a valid material from the list.");
            setSubmitting(false);
            return;
        }

        // if (!selectedMaterial.materialNames) {
        //     setFormError("Material name could not be found. Please try again.");
        //     setSubmitting(false);
        //     return;
        // }

        // ... (rest of the stock check logic)
        if (!usage) {
            const currentStock = selectedMaterial.stockQuantity;
            if (quantity > currentStock) {
                setFormError(`Your stock value is less than the quantity requested. Available Stock: ${currentStock}`);
                setSubmitting(false);
                return;
            }
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                onUpdate('error', 'Authentication token not found. Please log in again.');
                setSubmitting(false);
                return;
            }

            let response;
            const dataToSave = {
                ...formData,
                quantityUsed: quantity,
                materialName: selectedMaterial.materialNames.join(', '), // Ensure materialName is correctly populated
            };

            // ... (rest of the POST/PUT logic)
            if (usage && usage._id) {
                response = await fetch(`${API_BASE_URL}/material-usage/${usage._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(dataToSave),
                });
            } else {
                response = await fetch(`${API_BASE_URL}/material-usage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(dataToSave),
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to save material usage record: ${response.statusText}`);
            }

            onUpdate('success', `Material usage record ${usage ? 'updated' : 'added'} successfully!`);
            onClose();

        } catch (err) {
            console.error("Error saving material usage record:", err);
            setFormError(err.message || 'Something went wrong.');
            onUpdate('error', `Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4">
            <h3 className="mb-4 text-xl font-semibold text-gray-800">{usage ? 'Edit Material Usage' : 'Add New Material Usage'}</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="materialId" className="block text-sm font-medium text-gray-700">Select Material:</label>
                    <select
                        id="materialId"
                        name="materialId"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        value={formData.materialId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Material</option>
                        {materials.length > 0 ? (
                            materials.map(material => (
                                // இங்கு material._id மற்றும் material.materialNames இரண்டையும் சரியாகப் பயன்படுத்த வேண்டும்.
                                <option key={material._id} value={material._id}>{material.materialNames}</option>
                            ))
                        ) : (
                            <option disabled>No materials available. Please add some.</option>
                        )}
                    </select>
                    {formData.materialId && (
                        <p className="mt-2 text-sm text-gray-500">Available Stock: {availableStock} {formData.unit}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                        <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700">From Date:</label>
                        <input
                            type="date"
                            id="fromDate"
                            name="fromDate"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            value={formData.fromDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="toDate" className="block text-sm font-medium text-gray-700">To Date:</label>
                        <input
                            type="date"
                            id="toDate"
                            name="toDate"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            value={formData.toDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                        <label htmlFor="quantityUsed" className="block text-sm font-medium text-gray-700">Quantity:</label>
                        <input
                            type="number"
                            id="quantityUsed"
                            name="quantityUsed"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            value={formData.quantityUsed}
                            onChange={handleChange}
                            required
                            min="0.01"
                            step="any"
                        />
                    </div>
                    <div>
                        <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Units:</label>
                        <input
                            type="text"
                            id="unit"
                            name="unit"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-gray-100"
                            value={formData.unit}
                            required
                            readOnly
                        />
                    </div>
                </div>

                {formError && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{formError}</div>}

                <div className="flex justify-end gap-2 mt-6">
                    <button type="button" onClick={onClose} disabled={submitting} className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                        <ArrowLeft size={16} className="mr-2" /> Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200">
                        {submitting ? 'Saving...' : usage ? <><Edit size={16} className="mr-2" /> Update</> : <><PlusCircle size={16} className="mr-2" /> Save</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

ProjectMaterialUsageForm.propTypes = {
    usage: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    projectId: PropTypes.string.isRequired,
    onUpdate: PropTypes.func.isRequired,
};

export default ProjectMaterialUsageForm;
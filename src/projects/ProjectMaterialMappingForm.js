import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const ProjectMaterialMappingForm = ({ mapping, onClose, onUpdate, projectId }) => {
    const [formData, setFormData] = useState({
        // `_id`-ஐப் பயன்படுத்த `id`-ஐ மாற்றுங்கள்
        id: mapping?._id || null,
        projectId: projectId,
        materialName: '',
        quantity: '',
        unit: '',
        dateMapped: '',
        vendorName: '',
        vendorAddress: '',
        purchaseDate: '',
        gst: '',
        amount: '',
        gstApplicable: false,
        description: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [materialOptions, setMaterialOptions] = useState([]);
    const [materialsLoading, setMaterialsLoading] = useState(false);

    const [finalAmount, setFinalAmount] = useState(0);

    // Effect to calculate the final amount whenever quantity or amount changes
    useEffect(() => {
        const calculatedFinalAmount = parseFloat(formData.quantity) * parseFloat(formData.amount);
        if (!isNaN(calculatedFinalAmount) && isFinite(calculatedFinalAmount)) {
            setFinalAmount(calculatedFinalAmount.toFixed(2));
        } else {
            setFinalAmount(0);
        }
    }, [formData.quantity, formData.amount]);

    // Function to format date for the input field
    const formatDateToInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Effect to fetch all materials for the dropdown
    useEffect(() => {
        const fetchMaterials = async () => {
            setMaterialsLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error("Authentication token not found.");
                }

                const response = await fetch(`${API_BASE_URL}/materials`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to fetch materials: ${response.statusText}`);
                }
                const materialsList = await response.json();

                // Extract all unique materialNames into a single array
                const uniqueMaterialNames = materialsList.flatMap(material =>
                    Array.isArray(material.materialNames) ? material.materialNames : [material.materialNames]
                ).filter(name => name);

                setMaterialOptions([...new Set(uniqueMaterialNames)]);
            } catch (err) {
                console.error("Error fetching materials for dropdown:", err);
                setFormError("Failed to load material options. Please try again.");
            } finally {
                setMaterialsLoading(false);
            }
        };

        fetchMaterials();
    }, []);

    // Effect to set form data when a mapping is passed or when projectId changes
    useEffect(() => {
        console.log('ProjectMaterialMappingForm received mapping prop:', mapping);
        console.log('ProjectMaterialMappingForm received projectId prop:', projectId);
        if (mapping) {
            setFormData({
                // `_id`-ஐப் பயன்படுத்த `id`-ஐ மாற்றுங்கள்
                id: mapping._id,
                projectId: mapping.projectId || projectId || '',
                materialName: mapping.materialName || '',
                quantity: mapping.quantity || '',
                unit: mapping.unit || '',
                dateMapped: formatDateToInput(mapping.dateMapped) || '',
                vendorName: mapping.vendorName || '',
                vendorAddress: mapping.vendorAddress || '',
                purchaseDate: formatDateToInput(mapping.purchaseDate) || '',
                gst: mapping.gst || '',
                amount: mapping.amount || '',
                gstApplicable: mapping.gstApplicable || false,
                description: mapping.description || '',
            });
        } else {
            setFormData({
                id: null,
                projectId: projectId || '',
                materialName: '',
                quantity: '',
                unit: '',
                dateMapped: formatDateToInput(new Date()),
                vendorName: '',
                vendorAddress: '',
                purchaseDate: '',
                gst: '',
                amount: '',
                gstApplicable: false,
                description: '',
            });
        }
    }, [mapping, projectId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        // All required fields validation
        if (!formData.projectId || !formData.materialName || formData.quantity === '' || !formData.unit || formData.amount === '') {
            setFormError("Project ID, Material Name, Quantity, Unit, and Amount are required.");
            setSubmitting(false);
            return;
        }
        if (isNaN(formData.quantity) || Number(formData.quantity) <= 0) {
            setFormError("Quantity must be a positive number.");
            setSubmitting(false);
            return;
        }
        if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
            setFormError("Amount must be a positive number.");
            setSubmitting(false);
            return;
        }

        try {
            const dataToSave = {
                ...formData,
                quantity: Number(formData.quantity),
                amount: Number(formData.amount),
                finalAmount: Number(finalAmount),
            };

            let response;
            const token = localStorage.getItem('token');
            console.log("handleSubmit: Checking formData.id for update. Value:", formData.id);
            if (formData.id) {
                // UPDATE existing mapping
                console.log("Attempting to UPDATE record with ID:", formData.id);
                response = await fetch(`${API_BASE_URL}/projectMaterialMappings/${formData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(dataToSave),
                });
            } else {
                // CREATE new mapping
                console.log("Attempting to CREATE a new record.");
                response = await fetch(`${API_BASE_URL}/projectMaterialMappings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...dataToSave,
                    }),
                });
            }

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
                {/* Scrollable container for the form fields */}
                <div className="space-y-4 h-96 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Project ID Field is now read-only and automatically filled */}
                        <div>
                            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">Project ID:</label>
                            <input
                                type="text"
                                id="projectId"
                                name="projectId"
                                value={formData.projectId}
                                disabled
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 shadow-sm sm:text-sm"
                            />
                        </div>
                        {/* Material Name - Now a Select Dropdown */}
                        <div>
                            <label htmlFor="materialName" className="block text-sm font-medium text-gray-700">Material Name:</label>
                            <select
                                id="materialName"
                                name="materialName"
                                value={formData.materialName}
                                onChange={handleChange}
                                required
                                disabled={materialsLoading}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="">{materialsLoading ? 'Loading...' : 'Select a material'}</option>
                                {materialOptions.map((material, index) => (
                                    <option key={index} value={material}>
                                        {material}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Quantity */}
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity:</label>
                            <input
                                type="number"
                                id="quantity"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                                min="0.01"
                                step="any"
                                placeholder="e.g., 50"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {/* Unit */}
                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit:</label>
                            <input
                                type="text"
                                id="unit"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                required
                                placeholder="e.g., bags, kg, meters"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {/* Amount (required by backend) */}
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (per unit):</label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                min="0.01"
                                step="any"
                                placeholder="e.g., 250 (₹)"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {/* Date Mapped */}
                        <div>
                            <label htmlFor="dateMapped" className="block text-sm font-medium text-gray-700">Date Mapped:</label>
                            <input
                                type="date"
                                id="dateMapped"
                                name="dateMapped"
                                value={formData.dateMapped}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {/* Vendor Name */}
                        <div>
                            <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">Vendor Name:</label>
                            <input
                                type="text"
                                id="vendorName"
                                name="vendorName"
                                value={formData.vendorName}
                                onChange={handleChange}
                                placeholder="e.g., ABC Suppliers"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {/* Vendor Address */}
                        <div>
                            <label htmlFor="vendorAddress" className="block text-sm font-medium text-gray-700">Vendor Address:</label>
                            <input
                                type="text"
                                id="vendorAddress"
                                name="vendorAddress"
                                value={formData.vendorAddress}
                                onChange={handleChange}
                                placeholder="e.g., 123 Main St, City"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {/* Purchase Date */}
                        <div>
                            <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">Purchase Date:</label>
                            <input
                                type="date"
                                id="purchaseDate"
                                name="purchaseDate"
                                value={formData.purchaseDate}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {/* GST */}
                        <div>
                            <label htmlFor="gst" className="block text-sm font-medium text-gray-700">GST:</label>
                            <input
                                type="text"
                                id="gst"
                                name="gst"
                                value={formData.gst}
                                onChange={handleChange}
                                placeholder="e.g., 18%"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {/* GST Applicable Checkbox */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="gstApplicable"
                                name="gstApplicable"
                                checked={formData.gstApplicable}
                                onChange={handleChange}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="gstApplicable" className="ml-2 block text-sm text-gray-900">GST Applicable</label>
                        </div>
                    </div>

                    {/* Final Amount */}
                    <div>
                        <label htmlFor='finalAmount' className='block text-sm font-medium text-gray-700'>Total Amount:</label>
                        <input
                            type="text"
                            id='finalAmount'
                            name='finalAmount'
                            value={finalAmount}
                            disabled
                            className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 shadow-sm sm:text-sm'
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description:</label>
                        <textarea
                            id="description"
                            name="description"
                            rows="3"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Add any notes or additional details here..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        ></textarea>
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
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Saving...' : (mapping ? 'Update Mapping' : 'Add Mapping')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectMaterialMappingForm;

// src/settings/MaterialForm.js
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api'; 

const MaterialForm = ({ material, onClose }) => {
    const [formData, setFormData] = useState({
        categoryName: '',
        materialNames: [],
        unit: '', 
        rate: ''    
    });
    const [tagInput, setTagInput] = useState('');
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false); 

    useEffect(() => {
        if (material) {
            setFormData({
                categoryName: material.categoryName || '',
                materialNames: Array.isArray(material.materialNames) ? material.materialNames : (material.materialNames ? material.materialNames.split(',').map(s => s.trim()) : []),
                unit: material.unit || '',  
                rate: material.rate || ''   
            });
        } else {
            setFormData({
                categoryName: '',
                materialNames: [],
                unit: '',
                rate: ''
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        // Client-side validation
        if (!formData.categoryName || formData.materialNames.length === 0 || !formData.unit || !formData.rate) {
            setFormError("Category Name, at least one Material Name, Unit, and Rate are required.");
            setSubmitting(false);
            return;
        }
        if (isNaN(parseFloat(formData.rate)) || parseFloat(formData.rate) <= 0) {
            setFormError("Rate must be a positive number.");
            setSubmitting(false);
            return;
        }

        try {
            let response;
            const materialsApiUrl = `${API_BASE_URL}/materials`;

            const dataToSave = {
                categoryName: formData.categoryName,
                materialNames: formData.materialNames,
                unit: formData.unit, 
                rate: parseFloat(formData.rate)
            };

            if (material && material.id) {
                // Material ஐ புதுப்பித்தல்
                response = await fetch(`${materialsApiUrl}/${material.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify(dataToSave),
                });
            } else {
                // புதிய Material ஐ சேர்த்தல்
                response = await fetch(materialsApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({
                        ...dataToSave,
                        createdAt: new Date().toISOString(),
                    }),
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to save material: ${response.statusText}`);
            }
            alert("Material saved successfully");
            onClose();
        } catch (err) {
            console.error("Error saving material:", err);
            setFormError("Failed to save material: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Material / {material ? 'Edit' : 'Add'}</h3>
            {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col">
                    <label htmlFor="categoryName" className="mb-1 text-sm font-medium text-gray-700">Category Name:</label>
                    <input
                        type="text"
                        id="categoryName"
                        name="categoryName"
                        value={formData.categoryName}
                        onChange={handleChange}
                        required
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Sand"
                    />
                </div>

                <div className="flex flex-col">
                    <label htmlFor="materialName" className="mb-1 text-sm font-medium text-gray-700">Material Name:</label>
                    <div className="border rounded py-2 px-3 focus-within:ring-2 focus-within:ring-indigo-500">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.materialNames.map((tag, index) => (
                                <span key={index} className="flex items-center bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="ml-1 text-indigo-800 hover:text-indigo-900 focus:outline-none"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
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
                            placeholder="e.g., m sand, river sand"
                            className="w-full bg-transparent outline-none text-gray-700"
                        />
                    </div>
                </div>

                {/* புதிய புலங்கள்: Unit மற்றும் Rate */}
                <div className="flex flex-col">
                    <label htmlFor="unit" className="mb-1 text-sm font-medium text-gray-700">Unit:</label>
                    <input
                        type="text" // இது ஒரு டிராப் டவுன் ஆகவும் இருக்கலாம் (e.g., cft, bags, kg, ton)
                        id="unit"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        required
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., CFT, Bags, Ton, Nos"
                    />
                </div>

                <div className="flex flex-col">
                    <label htmlFor="rate" className="mb-1 text-sm font-medium text-gray-700">Rate:</label>
                    <input
                        type="number" // எண்ணை மட்டும் ஏற்றுக்கொள்ள
                        id="rate"
                        name="rate"
                        value={formData.rate}
                        onChange={handleChange}
                        required
                        min="0" // எதிர்மறை எண்கள் இருக்கக்கூடாது
                        step="any" // தசம எண்களை அனுமதிக்க
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., 2500"
                    />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                        {submitting ? 'Saving...' : (material ? 'Update' : 'Save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MaterialForm;
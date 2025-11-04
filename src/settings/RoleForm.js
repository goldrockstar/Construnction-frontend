// src/settings/RoleForm.js
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api'; // உங்கள் API அடிப்படை URL

const RoleForm = ({ role, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Populate form data if a role is passed for editing
    useEffect(() => {
        if (role) {
            setFormData({
                name: role.name || '',
                description: role.description || '',
            });
        } else {
            setFormData({
                name: '',
                description: '',
            });
        }
    }, [role]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        if (!formData.name) {
            setFormError("Role Name is required.");
            setSubmitting(false);
            return;
        }

        try {
            let response;
            const rolesApiUrl = `${API_BASE_URL}/roles`;
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };

            if (role && role.id) {
                response = await fetch(`${rolesApiUrl}/${role.id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(formData),
                });
            } else {
                response = await fetch(rolesApiUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        ...formData,
                        createdAt: new Date().toISOString(),
                    }),
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to save role: ${response.statusText}`);
            }

            setSuccessMessage("Role form submitted successfully!");
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            console.error("Error saving role:", err);
            setFormError("Failed to save role: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Role / {role ? 'Edit' : 'Add'}</h3>
            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    {successMessage}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col">
                    <label htmlFor="name" className="mb-1 text-sm font-medium text-gray-700">Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., manager"
                    />
                </div>

                <div className="flex flex-col">
                    <label htmlFor="description" className="mb-1 text-sm font-medium text-gray-700">Description (Optional):</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Brief description of this role's permissions or purpose"
                    ></textarea>
                </div>

                {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}

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
                        {submitting ? 'Saving...' : (role ? 'Update' : 'Save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RoleForm;
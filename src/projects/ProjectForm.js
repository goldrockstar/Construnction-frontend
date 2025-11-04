import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

const ProjectForm = ({ project, onClose }) => {
    const [formData, setFormData] = useState({
        projectName: '',
        scope: '',
        startDate: '',
        endDate: '',
        date: '',
        gst: '',
        totalCost: '',
        description: '',
        status: 'Planning',
    });

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    const formatDateToInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        if (project) {
            setFormData({
                projectName: project.projectName || '',
                scope: project.scope || '',
                startDate: formatDateToInput(project.startDate) || '',
                endDate: formatDateToInput(project.endDate) || '',
                date: formatDateToInput(project.date) || '',
                gst: project.gst || '',
                totalCost: project.totalCost || '',
                description: project.description || '',
                status: project.status || 'Planning',
            });
        } else {
            setFormData({
                projectName: '',
                scope: '',
                startDate: '',
                endDate: '',
                date: '',
                gst: '',
                totalCost: '',
                description: '',
                status: 'Planning',
            });
        }
    }, [project]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        if (!formData.projectName || formData.totalCost === '' || isNaN(parseFloat(formData.totalCost))) {
            setFormError("Project Name and a valid Total Cost are required.");
            setSubmitting(false);
            return;
        }

        const parsedTotalCost = parseFloat(formData.totalCost);
        if (parsedTotalCost < 0) {
            setFormError("Total Cost must be a valid non-negative number.");
            setSubmitting(false);
            return;
        }

        if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
            setFormError("End Date cannot be before Start Date.");
            setSubmitting(false);
            return;
        }

        try {
            const dataToSave = {
                ...formData,
                totalCost: parsedTotalCost,
                startDate: formData.startDate || undefined,
                endDate: formData.endDate || undefined,
                date: formData.date || undefined,
            };

            const token = localStorage.getItem('token');
            if (!token) {
                setFormError("Authentication token missing. Please log in again.");
                setSubmitting(false);
                return;
            }

            const method = project && project._id ? 'PUT' : 'POST';
            const url = project && project._id ? `${API_BASE_URL}/projects/${project._id}` : `${API_BASE_URL}/projects`;

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
                throw new Error(errorData.message || `Failed to save project: ${response.statusText}`);
            }
            onClose();
        } catch (err) {
            console.error("Error saving project:", err);
            setFormError("Failed to save project: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md w-full max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Project / {project ? 'Edit' : 'Add'}</h3>
            {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="projectName" className="mb-1 text-sm font-medium text-gray-700">Project Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="projectName"
                            name="projectName"
                            value={formData.projectName}
                            onChange={handleChange}
                            required
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g., Residential Complex"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="scope" className="mb-1 text-sm font-medium text-gray-700">Scope</label>
                        <input
                            type="text"
                            id="scope"
                            name="scope"
                            value={formData.scope}
                            onChange={handleChange}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Detailed scope of the project"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="startDate" className="mb-1 text-sm font-medium text-gray-700">Start Date</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="endDate" className="mb-1 text-sm font-medium text-gray-700">End Date</label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="date" className="mb-1 text-sm font-medium text-gray-700">Date (General)</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="gst" className="mb-1 text-sm font-medium text-gray-700">GST Number</label>
                        <input
                            type="text"
                            id="gst"
                            name="gst"
                            value={formData.gst}
                            onChange={handleChange}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g., 22AAAAA0000A1Z5"
                        />
                    </div>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="totalCost" className="mb-1 text-sm font-medium text-gray-700">Total Cost <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        id="totalCost"
                        name="totalCost"
                        value={formData.totalCost}
                        onChange={handleChange}
                        required
                        min="0"
                        step="any"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Total cost of the project"
                    />
                </div>
                <div className="flex flex-col">
                    <label htmlFor="description" className="mb-1 text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Any additional notes or general description"
                    ></textarea>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="status" className="mb-1 text-sm font-medium text-gray-700">Status <span className="text-red-500">*</span></label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        required
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                        {submitting ? 'Saving...' : (project ? 'Update Project' : 'Add Project')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectForm;
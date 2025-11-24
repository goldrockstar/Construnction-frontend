import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

// Icon imports (using Lucide React alternatives via inline SVG for single file compliance)
const X = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
);
const Loader2 = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2 animate-spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);


const ProjectForm = ({ project, onClose }) => {
    // Determine initial client ID: if editing, check if client is populated (object) or just an ID (string)
    const initialClientId = project?.client?._id || project?.client || '';

    const [formData, setFormData] = useState({
        projectId: '',
        projectName: '',
        projectType: '',
        clientName: '',
        startDate: '',
        expectedEndDate: '',
        actualEndDate: '',
        projectStatus: 'OnGoing',
        location: '',
        projectManager: '',
        teamMembers: '',
        estimatedBudget: '',
        clientId: initialClientId, // New state field for the selected Client ID
    });

    const [clients, setClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [showModal, setShowModal] = useState(false); // For custom message box

    const formatDateToInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // --- Fetch Clients on mount ---
    useEffect(() => {
        const fetchClients = async () => {
            setLoadingClients(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Authentication token missing.");

                // Assuming the controller exposes an endpoint to get all clients (getAllClients)
                const response = await fetch(`${API_BASE_URL}/clients/all`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch clients: ${response.statusText}`);
                }

                const data = await response.json();
                setClients(data);

            } catch (err) {
                console.error("Error fetching clients:", err);
                // Optionally show error to user
            } finally {
                setLoadingClients(false);
            }
        };
        fetchClients();
    }, []);

    // --- Load Project Data / Initial Client ID ---
    useEffect(() => {
        if (project) {
            // Determine the current client ID correctly from the populated field or direct ID
            const currentClientId = project.client?._id || project.client || '';
            
            setFormData({
                projectId: project.projectId || '',
                projectName: project.projectName || '',
                projectType: project.projectType || '',
                clientName: project.clientName || '',
                startDate: formatDateToInput(project.startDate) || '',
                expectedEndDate: formatDateToInput(project.expectedEndDate) || '',
                actualEndDate: formatDateToInput(project.actualEndDate) || '',
                projectStatus: project.projectStatus || 'OnGoing',
                location: project.location || '',
                projectManager: project.projectManager || '',
                teamMembers: project.teamMembers || '',
                estimatedBudget: project.estimatedBudget || '',
                clientId: currentClientId,
            });
        }
    }, [project]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'clientId') {
            // 1. Update clientId
            const newFormData = { ...formData, clientId: value };

            // 2. Find the selected client to update clientName for consistency (if required by Project model)
            const selectedClient = clients.find(c => c._id === value);
            if (selectedClient) {
                newFormData.clientName = selectedClient.clientName;
            } else if (value === '') {
                // If 'Select Client' is chosen, clear clientName
                newFormData.clientName = ''; 
            }
            setFormData(newFormData);

        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        // Required field validation check
        if (!formData.projectId || !formData.projectName || formData.estimatedBudget === '' || isNaN(parseFloat(formData.estimatedBudget))) {
            setFormError("Project ID, Project Name and a valid Estimated Budget are required.");
            setSubmitting(false);
            return;
        }
        
        const parsedEstimatedBudget = parseFloat(formData.estimatedBudget);
        if (parsedEstimatedBudget < 0) {
            setFormError("Estimated Budget must be a valid non-negative number.");
            setSubmitting(false);
            return;
        }

        if (formData.expectedEndDate && formData.startDate && formData.expectedEndDate < formData.startDate) {
            setFormError("Expected End Date cannot be before Start Date.");
            setSubmitting(false);
            return;
        }

        if (!formData.location) {
            setFormError("Location is required.");
            setSubmitting(false);
            return;
        }

        try {
            const dataToSave = {
                ...formData,
                estimatedBudget: parsedEstimatedBudget,
                // Ensure dates are not empty strings if null is preferred by backend
                startDate: formData.startDate || undefined,
                expectedEndDate: formData.expectedEndDate || undefined,
                actualEndDate: formData.actualEndDate || undefined,
                
                // Use clientId for the client link
                clientId: formData.clientId || undefined,
                
                // Include clientName from the form state (for denormalization if the model needs it)
                clientName: formData.clientName || undefined,
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
            setShowModal(true); // Show success message
            // Wait a moment then close form to allow user to read success message
            setTimeout(onClose, 1500); 
            
        } catch (err) {
            console.error("Error saving project:", err);
            setFormError("Failed to save project: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };
    
    // Custom Modal/Message Box component
    const MessageModal = ({ message, onClose }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-sm w-full transform transition-all scale-100 duration-300">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-green-600">Success!</h4>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-gray-700">{message}</p>
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {showModal && (
                <MessageModal 
                    message={`Project successfully ${project ? 'updated' : 'created'}!`} 
                    onClose={() => setShowModal(false)} 
                />
            )}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto p-6 border-t-4 border-indigo-600">
                <h3 className="text-2xl font-extrabold mb-6 text-gray-900 border-b pb-2">
                    {project ? 'Edit Existing Project' : 'Add New Project'}
                </h3>
                
                {formError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                        <strong className="font-bold">Error:</strong>
                        <span className="block sm:inline ml-2">{formError}</span>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Added max-h for the scrollbar on smaller screens/modals */}
                    <div className="max-h-[70vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Project ID & Name */}
                            <div className="flex flex-col">
                                <label htmlFor="projectId" className="mb-1 text-sm font-semibold text-gray-700">Project Id <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="projectId"
                                    name="projectId"
                                    value={formData.projectId}
                                    onChange={handleChange}
                                    required
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                                    placeholder="e.g., PRJ-001"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="projectName" className="mb-1 text-sm font-semibold text-gray-700">Project Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="projectName"
                                    name="projectName"
                                    value={formData.projectName}
                                    onChange={handleChange}
                                    required
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                                    placeholder="e.g., Residential Complex"
                                />
                            </div>

                            {/* Project Type and Client Selection Dropdown */}
                            <div className="flex flex-col">
                                <label htmlFor="projectType" className="mb-1 text-sm font-semibold text-gray-700">Project Type</label>
                                <input
                                    type="text"
                                    id="projectType"
                                    name="projectType"
                                    value={formData.projectType}
                                    onChange={handleChange}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                                    placeholder="Detailed scope of the project"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="clientId" className="mb-1 text-sm font-semibold text-gray-700">Select Client</label>
                                <div className="relative">
                                    <select
                                        id="clientId"
                                        name="clientId"
                                        value={formData.clientId}
                                        onChange={handleChange}
                                        className={`appearance-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full transition duration-150 ${loadingClients ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-800'}`}
                                        disabled={loadingClients}
                                    >
                                        <option value="">{loadingClients ? 'Loading clients...' : '-- Select an Existing Client --'}</option>
                                        {clients.map(client => (
                                            <option key={client._id} value={client._id}>
                                                {client.clientName} ({client.email})
                                            </option>
                                        ))}
                                    </select>
                                    {loadingClients && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <Loader2 className="w-4 h-4 text-indigo-500" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Current clientName (denormalized for display): {formData.clientName || 'N/A'}
                                </p>
                            </div>
                            
                            {/* Dates */}
                            <div className="flex flex-col">
                                <label htmlFor="startDate" className="mb-1 text-sm font-semibold text-gray-700">Start Date</label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="expectedEndDate" className="mb-1 text-sm font-semibold text-gray-700">Expected End Date</label>
                                <input
                                    type="date"
                                    id="expectedEndDate"
                                    name="expectedEndDate"
                                    value={formData.expectedEndDate}
                                    onChange={handleChange}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="actualEndDate" className="mb-1 text-sm font-semibold text-gray-700">Actual End Date</label>
                                <input
                                    type="date"
                                    id="actualEndDate"
                                    name="actualEndDate"
                                    value={formData.actualEndDate}
                                    onChange={handleChange}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                                />
                            </div>
                            
                            {/* Status and Budget */}
                            <div className="flex flex-col">
                                <label htmlFor="projectStatus" className="mb-1 text-sm font-semibold text-gray-700">Project Status</label>
                                <select
                                    id="projectStatus"
                                    name="projectStatus"
                                    value={formData.projectStatus}
                                    onChange={handleChange}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                                >
                                    <option value="OnGoing">OnGoing</option>
                                    <option value="Completed">Completed</option>
                                    <option value="On Hold">On Hold</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="estimatedBudget" className="mb-1 text-sm font-semibold text-gray-700">Estimated Budget (USD) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    id="estimatedBudget"
                                    name="estimatedBudget"
                                    value={formData.estimatedBudget}
                                    onChange={handleChange}
                                    required
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                                    placeholder="e.g., 500000"
                                />
                            </div>
                            
                            {/* Location */}
                            <div className="flex flex-col md:col-span-2">
                                <label htmlFor="location" className="mb-1 text-sm font-semibold text-gray-700">Location <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                                    placeholder="e.g., New York City, USA"
                                />
                            </div>
                            
                            {/* Manager and Team */}
                            <div className="flex flex-col">
                                <label htmlFor="projectManager" className="mb-1 text-sm font-semibold text-gray-700">Project Manager</label>
                                <input
                                    type="text"
                                    id="projectManager"
                                    name="projectManager"
                                    value={formData.projectManager}
                                    onChange={handleChange}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                                    placeholder="e.g., Jane Smith"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="teamMembers" className="mb-1 text-sm font-semibold text-gray-700">Team Members (Comma separated)</label>
                                <input
                                    type="text"
                                    id="teamMembers"
                                    name="teamMembers"
                                    value={formData.teamMembers}
                                    onChange={handleChange}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                                    placeholder="e.g., Alice, Bob, Charlie"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Form actions */}
                    <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-full hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 shadow-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || loadingClients}
                            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 shadow-lg disabled:bg-indigo-400 flex items-center justify-center"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2" /> Saving...
                                </>
                            ) : (
                                project ? 'Update Project' : 'Add Project'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectForm;
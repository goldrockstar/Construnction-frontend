import React, { useState, useEffect } from 'react';
import { Loader2, X, } from 'lucide-react';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const ProjectForm = ({ project, onClose }) => {
    const initialClientId = project?.client?._id || project?.client || '';

    const [formData, setFormData] = useState({
        projectId: 'Loading...', 
        projectName: '',
        projectType: '',
        clientName: '',
        startDate: '',
        expectedEndDate: '',
        actualEndDate: '',
        projectStatus: 'OnGoing',
        location: '',
        projectManager: '',
        teamMembers: '', // Stores selected names as comma-separated string
        estimatedBudget: '',
        clientId: initialClientId,
    });

    const [clients, setClients] = useState([]);
    const [manpowerList, setManpowerList] = useState([]); // To store manpower data
    const [loadingClients, setLoadingClients] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const formatDateToInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // 1. Fetch Clients & Manpower
    useEffect(() => {
        const fetchData = async () => {
            setLoadingClients(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Authentication token missing.");

                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch Clients & Manpower in parallel
                const [clientsRes, manpowerRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/clients`, { headers }),
                    fetch(`${API_BASE_URL}/manpower`, { headers })
                ]);

                if (!clientsRes.ok) throw new Error(`Failed to fetch clients`);
                if (!manpowerRes.ok) throw new Error(`Failed to fetch manpower`);

                const clientsData = await clientsRes.json();
                const manpowerData = await manpowerRes.json();

                setClients(Array.isArray(clientsData) ? clientsData : (clientsData.clients || []));
                setManpowerList(Array.isArray(manpowerData) ? manpowerData : []);

            } catch (err) {
                console.error("Error fetching data:", err);
                setFormError("Could not load required data (Clients/Manpower).");
            } finally {
                setLoadingClients(false);
            }
        };
        fetchData();
    }, []);

    // 2. Load Project Data OR Fetch Next Project ID
    useEffect(() => {
        if (project) {
            // Edit Mode
            const currentClientId = project.client?._id || project.client || project.clientId || '';
            const currentClientName = project.client?.clientName || project.clientName || '';
            
            setFormData({
                projectId: project.projectId || '',
                projectName: project.projectName || '',
                projectType: project.projectType || '',
                clientName: currentClientName,
                startDate: formatDateToInput(project.startDate) || '',
                expectedEndDate: formatDateToInput(project.expectedEndDate) || '',
                actualEndDate: formatDateToInput(project.actualEndDate) || '',
                projectStatus: project.projectStatus || 'OnGoing',
                location: project.location || '',
                projectManager: project.projectManager || '',
                teamMembers: project.teamMembers || '', // Comma separated string
                estimatedBudget: project.estimatedBudget || '',
                clientId: currentClientId,
            });
        } else {
            // Add Mode
            const fetchNextId = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_BASE_URL}/projects/next-id`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setFormData(prev => ({ ...prev, projectId: data.projectId }));
                    } else {
                        setFormData(prev => ({ ...prev, projectId: 'Error' }));
                    }
                } catch (error) {
                    console.error("Error fetching project ID:", error);
                    setFormData(prev => ({ ...prev, projectId: 'Error' }));
                }
            };
            fetchNextId();
        }
    }, [project]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'clientId') {
            const newFormData = { ...formData, clientId: value };
            const selectedClient = clients.find(c => c._id === value);
            if (selectedClient) {
                newFormData.clientName = selectedClient.clientName;
            } else if (value === '') {
                newFormData.clientName = ''; 
            }
            setFormData(newFormData);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Handler for Multi-Select Team Members
    const handleTeamMemberChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        // Convert array back to comma-separated string
        setFormData(prev => ({ ...prev, teamMembers: selectedOptions.join(', ') }));
    };

    // Helper to check if a member is selected
    // const isMemberSelected = (name) => {
    //     if (!formData.teamMembers) return false;
    //     const members = formData.teamMembers.split(',').map(s => s.trim());
    //     return members.includes(name);
    // };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        if (!formData.projectId || !formData.projectName || formData.estimatedBudget === '' || isNaN(parseFloat(formData.estimatedBudget))) {
            setFormError("Project ID, Project Name and a valid Estimated Budget are required.");
            setSubmitting(false);
            return;
        }
        
        try {
            const dataToSave = {
                ...formData,
                estimatedBudget: parseFloat(formData.estimatedBudget),
                startDate: formData.startDate || undefined,
                expectedEndDate: formData.expectedEndDate || undefined,
                actualEndDate: formData.actualEndDate || undefined,
                clientId: formData.clientId || undefined,
                clientName: formData.clientName || undefined,
            };

            const token = localStorage.getItem('token');
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
                throw new Error(errorData.message || `Failed to save project.`);
            }
            setShowModal(true); 
            setTimeout(onClose, 1500); 
            
        } catch (err) {
            console.error("Error saving project:", err);
            setFormError("Failed to save project: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };
    
    const MessageModal = ({ message, onClose }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-sm w-full">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-green-600">Success!</h4>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <p className="text-gray-700">{message}</p>
            </div>
        </div>
    );

    return (
        <div className="p-7 bg-gray-50 min-h-screen">
            {showModal && <MessageModal message={`Project successfully ${project ? 'updated' : 'created'}!`} onClose={() => setShowModal(false)} />}
            
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto p-6 border-t-6 border-indigo-600">
                <h3 className="text-2xl font-extrabold mb-6 text-gray-900 border-b pb-2">
                    {project ? 'Edit Existing Project' : 'Add New Project'}
                </h3>
                
                {formError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <strong className="font-bold">Error:</strong> {formError}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="max-h-[70vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Project Id *</label>
                            <div className="relative">
                                {/* <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /> */}
                                <input 
                                    type="text" 
                                    name="projectId" 
                                    value={formData.projectId} 
                                    readOnly 
                                    disabled 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Project Name *</label>
                            <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} required className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Villa Construction" />
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Project Type</label>
                            <input type="text" name="projectType" value={formData.projectType} onChange={handleChange} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Detailed scope" />
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Select Client</label>
                            <div className="relative">
                                <select name="clientId" value={formData.clientId} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white" disabled={loadingClients}>
                                    <option value="">{loadingClients ? 'Loading clients...' : '-- Select Client --'}</option>
                                    {clients.map(client => (
                                        <option key={client._id} value={client._id}>{client.clientName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Start Date</label>
                            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="px-4 py-2 border rounded-lg" />
                        </div>
                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Expected End Date</label>
                            <input type="date" name="expectedEndDate" value={formData.expectedEndDate} onChange={handleChange} className="px-4 py-2 border rounded-lg" />
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Actual End Date</label>
                            <input type="date" name="actualEndDate" value={formData.actualEndDate} onChange={handleChange} className="px-4 py-2 border rounded-lg" />
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Project Status</label>
                            <select name="projectStatus" value={formData.projectStatus} onChange={handleChange} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                                <option value="OnGoing">OnGoing</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="flex flex-col md:col-span-2">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Location *</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} required className="px-4 py-2 border rounded-lg" placeholder="Project Location" />
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Estimated Budget *</label>
                            <input type="number" name="estimatedBudget" value={formData.estimatedBudget} onChange={handleChange} required className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g., 500000" />
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Project Manager</label>
                            <input type="text" name="projectManager" value={formData.projectManager} onChange={handleChange} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Manager Name" />
                        </div>

                        {/* Team Members Dropdown (Multi-Select) */}
                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-semibold text-gray-700">Team Members</label>
                            <select 
                                name="teamMembers" 
                                multiple // Allows multiple selection
                                value={formData.teamMembers.split(', ').filter(Boolean)} // Convert string back to array
                                onChange={handleTeamMemberChange} 
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white h-32" // Increased height for list
                            >
                                {manpowerList.map(person => (
                                    <option key={person._id} value={person.name}>
                                        {person.name} ({person.role})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-indigo-600 mt-1">Selected: {formData.teamMembers}</p>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2 border-t">
                        <button type="button" onClick={onClose} disabled={submitting} className="px-6 py-2 bg-gray-300 rounded-full hover:bg-gray-400 transition">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition flex items-center">
                            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : (project ? 'Update Project' : 'Add Project')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectForm;
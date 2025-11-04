import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../model/Modal';
import ConfirmModal from '../model/ConfirmModal';
import MessageModal from '../model/MessageModal';
import ProjectMaterialMappingForm from './ProjectMaterialMappingForm';
import { Edit, Trash2, PlusCircle, ArrowLeft } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const ProjectMaterialMapping = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [mappings, setMappings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [project, setProject] = useState(null);

    const [showFormModal, setShowFormModal] = useState(false);
    const [currentMapping, setCurrentMapping] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [mappingIdToDelete, setMappingIdToDelete] = useState(null);
    const [messageBox, setMessageBox] = useState(null);

    // useCallback memoizes the function to prevent unnecessary re-creations
    const fetchProjectAndMappings = useCallback(async () => {
        if (!projectId) {
            setError("Project ID is missing. Cannot fetch data.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // If no token, redirect to login page
                navigate('/login');
                throw new Error("Authentication token not found.");
            }

            // We fetch project details and mappings at the same time using Promise.all
            const [projectResponse, mappingsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/projects/${projectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                // The original code comment correctly identifies this call as the source of a 404 error.
                // This means the API endpoint '/projectMaterialMappings/project/${projectId}' is not
                // correctly defined on the backend server.
                fetch(`${API_BASE_URL}/projectMaterialMappings/project/${projectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!projectResponse.ok) {
                // Handle cases where the project details cannot be fetched
                throw new Error(`Failed to fetch project details. Server status: ${projectResponse.status}`);
            }
            if (!mappingsResponse.ok) {
                // The front-end code is correctly handling the 404 response from the backend.
                // The root cause is the API endpoint itself.
                throw new Error(`Failed to fetch material mappings. Server responded with: ${mappingsResponse.status}. Please check the backend API endpoint.`);
            }
            
            const projectData = await projectResponse.json();
            const mappingsData = await mappingsResponse.json();

            setProject(projectData);
            setMappings(mappingsData);
            
        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err.message || "An unexpected error occurred while fetching data.");
        } finally {
            setLoading(false);
        }
    }, [projectId, navigate]);

    useEffect(() => {
        // Fetch data when the component mounts or projectId changes
        fetchProjectAndMappings();
    }, [fetchProjectAndMappings]);

    const handleDelete = (id) => {
        setMappingIdToDelete(id);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        setShowConfirmModal(false);
        if (!mappingIdToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/projectMaterialMappings/${mappingIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete mapping.');
            }

            // Re-fetch data after a successful deletion
            fetchProjectAndMappings();
            setMessageBox({ type: 'success', message: 'Material mapping deleted successfully!' });
        } catch (err) {
            console.error("Error deleting mapping:", err);
            setMessageBox({ type: 'error', message: `Error: ${err.message}` });
        } finally {
            setMappingIdToDelete(null);
        }
    };

    const handleEdit = (mapping) => {
        setCurrentMapping(mapping);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        setCurrentMapping(null);
        setShowFormModal(true);
    };

    const handleFormUpdate = (status, message) => {
        setShowFormModal(false);
        setCurrentMapping(null);
        if (status === 'success') {
            fetchProjectAndMappings();
            setMessageBox({ type: 'success', message });
        } else if (status === 'error') {
            setMessageBox({ type: 'error', message });
        }
    };
    
    const handleBackClick = () => {
        navigate(-1);
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-600">Loading material mappings...</div>;
    }

    return (
        <div className="p-6 bg-gray-50 rounded-lg shadow-xl min-h-screen">
            {error && (
                <div className="p-4 mb-4 text-center text-red-700 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-bold">Error:</p>
                    <p>{error}</p>
                </div>
            )}
            {messageBox && (
                <MessageModal
                    message={messageBox.message}
                    type={messageBox.type}
                    onClose={() => setMessageBox(null)}
                />
            )}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={handleBackClick}
                    className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    title="Go Back"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back
                </button>
                <h2 className="text-3xl font-bold text-gray-800">
                    Materials for: {project?.projectName || 'N/A'}
                </h2>
                <div></div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="flex justify-between items-center text-gray-600">
                    <span className="font-semibold">Client:</span>
                    <span>{project?.client?.clientName || 'N/A'}</span>
                </div>
            </div>

            <button
                onClick={handleAdd}
                className="mb-6 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center shadow-lg"
                title="Add New Material"
            >
                <PlusCircle size={20} className="mr-2" /> Add New Material
            </button>

            {mappings.length === 0 ? (
                <p className="text-center text-gray-500 italic">No material mappings found for this project. Add one to begin.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg shadow-md">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {mappings.map((mapping) => (
                                <tr key={mapping._id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {mapping.materialName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {mapping.quantity} {mapping.unit}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {typeof mapping.amount === 'number' ? mapping.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {typeof mapping.quantity === 'number' && typeof mapping.amount === 'number'
                                            ? (mapping.quantity * mapping.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                                            : 'N/A'
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(mapping)}
                                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 transition duration-200"
                                                title="Edit Mapping"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(mapping._id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition duration-200"
                                                title="Delete Mapping"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showFormModal && (
                <Modal onClose={() => handleFormUpdate('cancel')}>
                    <ProjectMaterialMappingForm
                        mapping={currentMapping}
                        projectId={projectId}
                        onUpdate={handleFormUpdate}
                        onClose={() => setShowFormModal(false)}
                    />
                </Modal>
            )}

            {showConfirmModal && (
                <ConfirmModal
                    message="Are you sure you want to delete this material mapping?"
                    onConfirm={confirmDelete}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </div>
    );
};

export default ProjectMaterialMapping;

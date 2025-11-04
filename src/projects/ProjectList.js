import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectForm from './ProjectForm';
import Modal from '../model/Modal';
import ConfirmModal from '../model/ConfirmModal';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Dropdown from '../model/Dropdown';

const API_BASE_URL = 'http://localhost:5000/api';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [projectIdToDelete, setProjectIdToDelete] = useState(null);
    const navigate = useNavigate();

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
            setError("No login authentication token found. Please log in.");
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                // Try to get a more specific error message from the server
                const errorData = await response.json();
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    setError(errorData.message || "Invalid or expired token. Please log in again.");
                    navigate('/login');
                    return;
                }
                throw new Error(errorData.message || `Server responded with status: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            let projectsData = [];
            if (Array.isArray(data)) {
                projectsData = data;
            } else if (data && Array.isArray(data.projects)) {
                projectsData = data.projects;
            } else if (data && Array.isArray(data.data)) {
                projectsData = data.data;
            } else {
                console.error('API response is not an array:', data);
                throw new Error('Project data from the server is in an incorrect format.');
            }
            setProjects(projectsData);
        } catch (err) {
            console.error("Error fetching projects:", err);
            setError(err.message || "An unexpected error occurred while fetching project information.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleDelete = (projectId) => {
        setProjectIdToDelete(projectId);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!projectIdToDelete) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/projects/${projectIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete project: ${response.statusText}`);
            }
            setProjects(projects.filter(project => project._id !== projectIdToDelete));
        } catch (err) {
            console.error("Error deleting project:", err);
            setError(err.message || "An error occurred while deleting the project.");
        } finally {
            setProjectIdToDelete(null);
            setShowConfirmModal(false);
        }
    };

    const handleEdit = (project) => {
        setCurrentProject(project);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        setCurrentProject(null);
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        setCurrentProject(null);
        fetchProjects();
    };

    const navigateToTransactions = (project) => {
        navigate(`/projects/${project._id}/transactions`, {
            state: {
                totalBudget: project.totalCost,
                projectName: project.projectName,
                clientName: project.client?.clientName || 'N/A'
            }
        });
    };

    const navigateToClientInfo = (project) => {
        navigate(`/projects/${project._id}/clientinfo`, {
            state: {
                projectName: project.projectName,
                clientName: project.client?.clientName || 'N/A',
            }
        });
    };

    const navigateToMaterialMapping = (projectId) => {
        navigate(`/projects/${projectId}/materialmapping`);
    };

    const navigateToMaterialUsage = (projectId) => {
        navigate(`/projects/${projectId}/materialusage`);
    };

    const navigateToExpenditure = (projectId) => {
        navigate(`/projects/${projectId}/expenditure`);
    };

    const navigateToSalaryConfig = (projectId) => {
        navigate(`/projects/${projectId}/salary-config`);
    };

    if (loading) {
        return <div className="p-4 text-center text-gray-700">Loading projects...</div>;
    }

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Project Information</h2>
            {error && <div className="p-4 mb-4 text-center text-red-600 bg-red-100 rounded-md">{error}</div>}
            <button
                onClick={handleAdd}
                className="mb-6 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 flex items-center shadow-md"
            >
                <PlusCircle size={20} className="mr-2" /> Add New Project
            </button>
            {projects.length === 0 ? (
                <p className="text-gray-600 italic">No project information found. Click "Add New Project" to add one.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-200">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project, index) => (
                                <tr key={project._id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{project.projectName || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{project.totalCost?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(project)}
                                                className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 transition duration-200"
                                                title="Edit Project"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(project._id)}
                                                className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition duration-200"
                                                title="Delete Project"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <Dropdown>
                                                <button
                                                    onClick={() => navigateToTransactions(project)}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
                                                    role="menuitem"
                                                    tabIndex="-1"
                                                >
                                                    Transactions
                                                </button>
                                                <button
                                                    onClick={() => navigateToClientInfo(project)}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
                                                    role="menuitem"
                                                    tabIndex="-1"
                                                >
                                                    Client Info
                                                </button>
                                                <button
                                                    onClick={() => navigateToMaterialMapping(project._id)}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
                                                    role="menuitem"
                                                    tabIndex="-1"
                                                >
                                                    Material Mapping
                                                </button>
                                                <button
                                                    onClick={() => navigateToMaterialUsage(project._id)}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
                                                    role="menuitem"
                                                    tabIndex="-1"
                                                >
                                                    Material Usage
                                                </button>
                                                <button
                                                    onClick={() => navigateToExpenditure(project._id)}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
                                                    role="menuitem"
                                                    tabIndex="-1"
                                                >
                                                    Expenditure
                                                </button>
                                                <button
                                                    onClick={() => navigateToSalaryConfig(project._id)}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
                                                    role="menuitem"
                                                    tabIndex="-1"
                                                >
                                                    Salary Configuration
                                                </button>
                                            </Dropdown>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <AnimatePresence>
                {showFormModal && (
                    <Modal onClose={handleFormClose}>
                        <ProjectForm project={currentProject} onClose={handleFormClose} />
                    </Modal>
                )}
                {showConfirmModal && (
                    <ConfirmModal
                        message="Are you sure you want to delete this project?"
                        onConfirm={confirmDelete}
                        onCancel={() => setShowConfirmModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectList;
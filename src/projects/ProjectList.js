import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectForm from './ProjectForm';
import Modal from '../model/Modal';
import ConfirmModal from '../model/ConfirmModal';
import { Edit, Trash2, PlusCircle, Building2, Users, DollarSign, Calendar, MoreVertical, FileText, Package, TrendingUp, Settings } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Dropdown from '../model/Dropdown';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [projectIdToDelete, setProjectIdToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
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
                estimatedBudget: project.estimatedBudget,
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

    // const navigateToMaterialUsage = (projectId) => {
    //     navigate(`/projects/${projectId}/materialusage`);
    // };

    const navigateToExpenditure = (projectId) => {
        navigate(`/projects/${projectId}/expenditure`);
    };

    // const navigateToSalaryConfig = (projectId) => {
    //     navigate(`/projects/${projectId}/salary-config`);
    // };

    // Filter projects based on search term
    const filteredProjects = projects.filter(project =>
        project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate statistics
    const totalProjects = projects.length;
    const totalBudget = projects.reduce((sum, project) => sum + (project.estimatedBudget || 0), 0);
    const activeProjects = projects.filter(project => project.projectStatus === 'Active').length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading projects...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
                            <p className="text-gray-600 mt-1">Manage and track all your construction projects</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleAdd}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    >
                        <PlusCircle size={20} className="mr-2" />
                        Add New Project
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Projects Card */}
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Projects</p>
                                <p className="text-3xl font-bold mt-2">{totalProjects}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <Building2 size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Active Projects Card */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Active Projects</p>
                                <p className="text-3xl font-bold mt-2">{activeProjects}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Total Budget Card */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Total Budget</p>
                                <p className="text-3xl font-bold mt-2">₹{totalBudget.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <DollarSign size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search projects by name, client, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">!</span>
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Projects Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {filteredProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <Building2 className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                {searchTerm ? 'No matching projects found' : 'No projects found'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {searchTerm 
                                    ? 'Try adjusting your search terms' 
                                    : 'Get started by creating your first project'
                                }
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={handleAdd}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200"
                                >
                                    <PlusCircle size={18} className="inline mr-2" />
                                    Create First Project
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Project</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Budget</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredProjects.map((project, index) => (
                                        <tr key={project._id} className="hover:bg-indigo-50/30 transition-all duration-150 group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <Building2 className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{project.projectName || 'N/A'}</div>
                                                        <div className="text-xs text-gray-500">ID: {project.projectId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Users size={14} className="mr-2 text-gray-400" />
                                                    {project.client?.clientName || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    project.projectStatus === 'Active' 
                                                        ? 'bg-green-100 text-green-800'
                                                        : project.projectStatus === 'Completed'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {project.projectStatus || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                                                    ₹{project.estimatedBudget?.toLocaleString('en-IN') || '0'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(project)}
                                                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-xl transition-all duration-200 transform hover:scale-110"
                                                        title="Edit Project"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(project._id)}
                                                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-xl transition-all duration-200 transform hover:scale-110"
                                                        title="Delete Project"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <Dropdown>
                                                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 border-b border-gray-200">
                                                            Project Actions
                                                        </div>
                                                        <button
                                                            onClick={() => navigateToTransactions(project)}
                                                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors duration-200"
                                                        >
                                                            <DollarSign size={14} className="mr-2" />
                                                            Income & Expenses
                                                        </button>
                                                        <button
                                                            onClick={() => navigateToClientInfo(project)}
                                                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors duration-200"
                                                        >
                                                            <Users size={14} className="mr-2" />
                                                            Client Info
                                                        </button>
                                                        <button
                                                            onClick={() => navigateToMaterialMapping(project._id)}
                                                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors duration-200"
                                                        >
                                                            <Package size={14} className="mr-2" />
                                                            Material Allocation
                                                        </button>
                                                        {/* <button
                                                            onClick={() => navigateToMaterialUsage(project._id)}
                                                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors duration-200"
                                                        >
                                                            <FileText size={14} className="mr-2" />
                                                            Material Usage
                                                        </button> */}
                                                        <button
                                                            onClick={() => navigateToExpenditure(project._id)}
                                                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors duration-200"
                                                        >
                                                            <TrendingUp size={14} className="mr-2" />
                                                            ManPower Allocation
                                                        </button>
                                                        {/* <button
                                                            onClick={() => navigateToSalaryConfig(project._id)}
                                                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors duration-200"
                                                        >
                                                            <Settings size={14} className="mr-2" />
                                                            Salary Config
                                                        </button> */}
                                                    </Dropdown>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modals */}
                <AnimatePresence>
                    {showFormModal && (
                        <Modal onClose={handleFormClose}>
                            <ProjectForm project={currentProject} onClose={handleFormClose} />
                        </Modal>
                    )}
                    {showConfirmModal && (
                        <ConfirmModal
                            message="Are you sure you want to delete this project? This action cannot be undone."
                            onConfirm={confirmDelete}
                            onCancel={() => setShowConfirmModal(false)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ProjectList;
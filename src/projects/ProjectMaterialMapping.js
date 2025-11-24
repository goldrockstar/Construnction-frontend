import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../model/Modal';
import ConfirmModal from '../model/ConfirmModal';
import MessageModal from '../model/MessageModal';
import ProjectMaterialMappingForm from './ProjectMaterialMappingForm';
import { Edit, Trash2, PlusCircle, ArrowLeft, Package, Building2, Users, DollarSign, Scale, TrendingUp, Search } from 'lucide-react';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const ProjectMaterialMapping = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [mappings, setMappings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [project, setProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [showFormModal, setShowFormModal] = useState(false);
    const [currentMapping, setCurrentMapping] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [mappingIdToDelete, setMappingIdToDelete] = useState(null);
    const [messageBox, setMessageBox] = useState(null);

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
                navigate('/login');
                throw new Error("Authentication token not found.");
            }

            const [projectResponse, mappingsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/projects/${projectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/projectMaterialMappings/project/${projectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!projectResponse.ok) {
                throw new Error(`Failed to fetch project details. Server status: ${projectResponse.status}`);
            }
            if (!mappingsResponse.ok) {
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

    // Filter mappings based on search term
    const filteredMappings = mappings.filter(mapping =>
        mapping.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapping.unit?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate statistics
    const totalMaterials = mappings.length;
    const totalCost = mappings.reduce((sum, mapping) => sum + (mapping.totalCost || 0), 0);
    const totalQuantityUsed = mappings.reduce((sum, mapping) => sum + (mapping.quantityUsed || 0), 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading material mappings...</p>
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
                        <button
                            onClick={handleBackClick}
                            className="flex items-center px-4 py-3 bg-white text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md border border-indigo-100"
                        >
                            <ArrowLeft size={20} className="mr-2" /> Back
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                <Package className="h-8 w-8 mr-3 text-indigo-600" />
                                Material Mapping
                            </h1>
                            <p className="text-gray-600 mt-1">Manage materials for {project?.projectName || 'Project'}</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleAdd}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    >
                        <PlusCircle size={20} className="mr-2" />
                        Add New Material
                    </button>
                </div>

                {/* Project Info Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700">Project</h3>
                                <p className="text-lg font-bold text-gray-900">{project?.projectName || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700">Client</h3>
                                <p className="text-lg font-bold text-gray-900">{project?.client?.clientName || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Package className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700">Total Materials</h3>
                                <p className="text-lg font-bold text-gray-900">{totalMaterials}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Materials Card */}
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Materials</p>
                                <p className="text-3xl font-bold mt-2">{totalMaterials}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <Package size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Total Quantity Used Card */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Total Quantity Used</p>
                                <p className="text-3xl font-bold mt-2">{totalQuantityUsed}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Total Cost Card */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Total Material Cost</p>
                                <p className="text-3xl font-bold mt-2">₹{totalCost.toLocaleString('en-IN')}</p>
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
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search materials by name or unit..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                        />
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

                {/* Materials Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {filteredMappings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <Package className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                {searchTerm ? 'No matching materials found' : 'No material mappings found'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {searchTerm 
                                    ? 'Try adjusting your search terms' 
                                    : 'Get started by adding your first material mapping'
                                }
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={handleAdd}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200"
                                >
                                    <PlusCircle size={18} className="inline mr-2" />
                                    Add First Material
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Material</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Unit</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Available</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Used</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Balance</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Unit Price</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Cost</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredMappings.map((mapping) => (
                                        <tr key={mapping._id} className="hover:bg-indigo-50/30 transition-all duration-150">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <Package className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{mapping.materialName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <Scale size={12} className="mr-1" />
                                                    {mapping.unit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                                                    {mapping.quantityIssued}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-orange-700 bg-orange-50 px-3 py-2 rounded-lg">
                                                    {mapping.quantityUsed}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`text-sm font-bold px-3 py-2 rounded-lg ${
                                                    mapping.balanceQuantity > 0 
                                                        ? 'text-green-700 bg-green-50' 
                                                        : 'text-red-700 bg-red-50'
                                                }`}>
                                                    {mapping.balanceQuantity}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    ₹{mapping.unitPrice?.toLocaleString('en-IN') || '0'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-purple-700 bg-purple-50 px-3 py-2 rounded-lg">
                                                    ₹{mapping.totalCost?.toLocaleString('en-IN') || '0'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(mapping)}
                                                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-xl transition-all duration-200 transform hover:scale-110"
                                                        title="Edit Material"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(mapping._id)}
                                                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-xl transition-all duration-200 transform hover:scale-110"
                                                        title="Delete Material"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
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

                {messageBox && (
                    <MessageModal
                        message={messageBox.message}
                        type={messageBox.type}
                        onClose={() => setMessageBox(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default ProjectMaterialMapping;
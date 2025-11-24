import React, { useState, useEffect, useCallback } from 'react';
import MaterialForm from './MaterialForm';
import Modal from '../model/Modal';
import ConfirmModal from '../model/ConfirmModal';
import MessageModal from '../model/MessageModal';
import { Edit, Trash2, PlusCircle, Package, Search, DollarSign, Scale, TrendingUp, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const MaterialList = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentMaterial, setCurrentMaterial] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [materialIdToDelete, setMaterialIdToDelete] = useState(null);
    const [messageBox, setMessageBox] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const navigate = useNavigate();

    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                throw new Error("Authentication token not found.");
            }
            const response = await fetch(`${API_BASE_URL}/materials`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch materials: ${response.statusText}`);
            }
            const materialsList = await response.json();
            setMaterials(materialsList.map(material => ({ ...material, id: material._id || material.id })));
        } catch (err) {
            console.error("Error fetching materials:", err);
            setError("Failed to fetch materials data. Please try again: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    const handleDelete = (materialId) => {
        setMaterialIdToDelete(materialId);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        setShowConfirmModal(false);
        if (!materialIdToDelete) return;

        try {
            const response = await fetch(`${API_BASE_URL}/materials/${materialIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete material: ${response.statusText}`);
            }
            fetchMaterials();
            setMessageBox({ type: 'success', message: 'Material deleted successfully!' });
        } catch (err) {
            console.error("Error deleting material:", err);
            setMessageBox({ type: 'error', message: 'Failed to delete material: ' + err.message });
        } finally {
            setMaterialIdToDelete(null);
        }
    };

    const handleEdit = (material) => {
        setCurrentMaterial(material);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        setCurrentMaterial(null);
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        setCurrentMaterial(null);
        fetchMaterials();
    };

    // Filter materials based on search term
    const filteredMaterials = materials.filter(material =>
        material.materialNames?.some(name => 
            name?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        material.materialId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.unitofMeasure?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate statistics
    const totalMaterials = materials.length;
    const totalQuantity = materials.reduce((sum, material) => sum + (material.availableQuantity || 0), 0);
    const totalValue = materials.reduce((sum, material) => 
        sum + ((material.availableQuantity || 0) * (material.purchasePrice || 0)), 0
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                            <Package className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Material Management</h1>
                            <p className="text-gray-600 mt-1">Manage your construction materials and inventory</p>
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
                                <Box size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Total Quantity Card */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Total Quantity</p>
                                <p className="text-3xl font-bold mt-2">{totalQuantity}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Total Value Card */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Total Inventory Value</p>
                                <p className="text-3xl font-bold mt-2">₹{totalValue.toLocaleString('en-IN')}</p>
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
                            placeholder="Search materials by name, ID, or unit..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                        />
                    </div>
                </div>

                {/* Messages */}
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
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : filteredMaterials.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <Package className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                {searchTerm ? 'No matching materials found' : 'No materials found'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {searchTerm 
                                    ? 'Try adjusting your search terms' 
                                    : 'Get started by adding your first material'
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
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">S.No</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Material</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Unit</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Quantity</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredMaterials.map((material, index) => (
                                        <tr key={material.id} className="hover:bg-indigo-50/30 transition-all duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 bg-indigo-100 w-8 h-8 rounded-full flex items-center justify-center">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <Package className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {Array.isArray(material.materialNames) ? material.materialNames.join(', ') : material.materialNames || 'N/A'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            ID: {material.materialId || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <Scale size={12} className="mr-1" />
                                                    {material.unitofMeasure || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                                                    {material.availableQuantity || '0'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    ₹{material.purchasePrice?.toLocaleString('en-IN') || '0'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    material.status === 'Active' 
                                                        ? 'bg-green-100 text-green-800'
                                                        : material.status === 'Inactive'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {material.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(material)}
                                                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-xl transition-all duration-200 transform hover:scale-110"
                                                        title="Edit Material"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(material.id)}
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
                    <Modal onClose={handleFormClose}>
                        <MaterialForm material={currentMaterial} onClose={handleFormClose} />
                    </Modal>
                )}

                {showConfirmModal && (
                    <ConfirmModal
                        message="Are you sure you want to delete this material? This action cannot be undone."
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

export default MaterialList;
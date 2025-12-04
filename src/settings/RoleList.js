import React, { useState, useEffect } from 'react';
import RoleForm from './RoleForm';
import Modal from '../model/Modal'; 
import ConfirmationModal from '../model/ConfirmationModal';
import { Edit, Trash2, Plus, Users, Shield, Search } from 'lucide-react'; 

const API_BASE_URL = 'http://localhost:5000/api'; 

const RoleList = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentRole, setCurrentRole] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchRoles = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/roles`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch roles: ${response.statusText}`);
            }
            const rolesList = await response.json();
            setRoles(rolesList.map(role => ({ ...role, id: role._id || role.id })));
        } catch (err) {
            console.error("Error fetching roles:", err);
            setError("Failed to fetch roles data. Please try again: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDeleteClick = (roleId) => {
        setRoleToDelete(roleId);
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        setShowConfirmModal(false);
        if (!roleToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/roles/${roleToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete role: ${response.statusText}`);
            }
            setRoles(roles.filter(role => role.id !== roleToDelete));
            setSuccessMessage("Role deleted successfully!");
        } catch (err) {
            console.error("Error deleting role:", err);
            setError("Failed to delete role: " + err.message);
        } finally {
            setRoleToDelete(null);
        }
    };

    const handleEdit = (role) => {
        setCurrentRole(role);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        setCurrentRole(null);
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        setCurrentRole(null);
        fetchRoles();
    };

    // Filter roles based on search term
    const filteredRoles = roles.filter(role =>
        role.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                            <Shield className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">User Role Management</h1>
                            <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleAdd}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    >
                        <Plus size={20} className="mr-2" />
                        Add New Role
                    </button>
                </div>

                {/* Stats and Search Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Total Roles Card */}
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Roles</p>
                                <p className="text-3xl font-bold mt-2">{roles.length}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <Users size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search roles by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {successMessage && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">✓</span>
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-green-700 text-sm">{successMessage}</p>
                            </div>
                        </div>
                    </div>
                )}

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

                {/* Roles Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : filteredRoles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <Users className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                {searchTerm ? 'No matching roles found' : 'No roles found'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {searchTerm 
                                    ? 'Try adjusting your search terms' 
                                    : 'Get started by creating your first role'
                                }
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={handleAdd}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200"
                                >
                                    <Plus size={18} className="inline mr-2" />
                                    Add First Role
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">S.No</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Role ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Role Name</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredRoles.map((role, index) => (
                                        <tr key={role.id} className="hover:bg-indigo-50/30 transition-all duration-150 group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 bg-indigo-100 w-8 h-8 rounded-full flex items-center justify-center">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <Shield className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{role.roleId}</div>
                                                        <div className="text-xs text-gray-500">Role ID</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <Shield className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{role.name}</div>
                                                        <div className="text-xs text-gray-500">User Role</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(role)}
                                                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-xl transition-all duration-200 transform hover:scale-110"
                                                        title="Edit Role"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(role.id)}
                                                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-xl transition-all duration-200 transform hover:scale-110"
                                                        title="Delete Role"
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
                        <RoleForm role={currentRole} onClose={handleFormClose} />
                    </Modal>
                )}

                {showConfirmModal && (
                    <Modal onClose={() => setShowConfirmModal(false)}>
                        <ConfirmationModal
                            title="Delete Role"
                            message="Are you sure you want to delete this role? This action cannot be undone."
                            onConfirm={handleConfirmDelete}
                            onCancel={() => setShowConfirmModal(false)}
                        />
                    </Modal>
                )}
            </div>
        </div>
    );
};

export default RoleList;
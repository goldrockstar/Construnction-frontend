import React, { useState, useEffect } from 'react';
import RoleForm from './RoleForm';
import Modal from '../model/Modal'; 
import ConfirmationModal from '../model/ConfirmationModal';
import { Edit, Trash2 } from 'lucide-react'; 

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

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Role Management</h2>
            <button
                onClick={handleAdd}
                className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
            >
                Add New Role
            </button>

            {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{successMessage}</div>}
            {error && <p className="p-4 text-center text-red-600 font-medium border border-red-300 bg-red-50 rounded-md mb-4">{error}</p>}

            {loading ? (
                <div className="p-4 text-center text-gray-700">Loading role data...</div>
            ) : roles.length === 0 ? (
                <p className="text-gray-600 italic">No roles found. Click "Add New Role" to create one.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-200">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role, index) => {
                                return (
                                    <tr key={role.id} className="border-b border-gray-200 last:border-b-0">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{role.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEdit(role)}
                                                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 transition duration-200"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(role.id)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition duration-200"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showFormModal && (
                <Modal onClose={handleFormClose}>
                    <RoleForm role={currentRole} onClose={handleFormClose} />
                </Modal>
            )}

            {showConfirmModal && (
                <Modal onClose={() => setShowConfirmModal(false)}>
                    <ConfirmationModal
                        title="Delete Role"
                        message="Are you sure you want to delete this role?"
                        onConfirm={handleConfirmDelete}
                        onCancel={() => setShowConfirmModal(false)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default RoleList;
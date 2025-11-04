import React, { useState, useEffect, useCallback } from 'react';
import MaterialForm from './MaterialForm';
import Modal from '../model/Modal';
import ConfirmModal from '../model/ConfirmModal'; // Added ConfirmModal
import MessageModal from '../model/MessageModal'; // Added MessageModal
import { Edit, Trash2, PlusCircle } from 'lucide-react'; // Added icons
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const MaterialList = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentMaterial, setCurrentMaterial] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [materialIdToDelete, setMaterialIdToDelete] = useState(null);
    const [messageBox, setMessageBox] = useState(null);

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
            fetchMaterials(); // Refresh the list
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

  

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-7xl mx-auto my-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Materials</h2>
                <button
                    onClick={handleAdd}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center"
                >
                    <PlusCircle size={20} className="mr-2" /> Add Material
                </button>
            </div>

            {error && <p className="p-4 text-center text-red-600 font-medium border border-red-300 bg-red-50 rounded-md mb-4">{error}</p>}
            {messageBox && (
                <MessageModal
                    message={messageBox.message}
                    type={messageBox.type}
                    onClose={() => setMessageBox(null)}
                />
            )}

            {loading ? (
                <div className="p-4 text-center text-gray-700">Loading materials data...</div>
            ) : materials.length === 0 ? (
                <p className="text-gray-600 italic text-center">No Materials found</p>
            ) : (
                <div className="overflow-x-auto rounded-lg shadow-lg">
                    <table className="min-w-full bg-white divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY NAME</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MATERIAL NAME</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {materials.map((material, index) => (
                                <tr key={material.id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{material.categoryName || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {Array.isArray(material.materialNames) ? material.materialNames.join(', ') : material.materialNames || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(material)}
                                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 transition duration-200"
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(material.id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition duration-200"
                                                title="Delete"
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
        </div>
    );
};

export default MaterialList;
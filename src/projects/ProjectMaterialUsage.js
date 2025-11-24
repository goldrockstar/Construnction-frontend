import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProjectMaterialUsageForm from './ProjectMaterialUsageForm';
import Modal from '../model/Modal';
import ConfirmModal from '../model/ConfirmModal';
import MessageModal from '../model/MessageModal';
import { Edit, Trash2, PlusCircle, ArrowLeft } from 'lucide-react';

// Use a consistent API base URL
const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const ProjectMaterialUsage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [usageRecords, setUsageRecords] = useState([]);
    const [projectName, setProjectName] = useState('Loading...');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentUsage, setCurrentUsage] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [recordIdToDelete, setRecordIdToDelete] = useState(null);
    const [messageBox, setMessageBox] = useState(null);

    // Fetch all materials once and store them in a map for efficient lookup
    const [materialsMap, setMaterialsMap] = useState({});

    useEffect(() => {
        const fetchAllMaterials = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Authentication token not found.");
                const response = await fetch(`${API_BASE_URL}/materials`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch materials. Status: ${response.status}`);
                }
                const data = await response.json();
                const newMaterialsMap = data.reduce((acc, material) => {
                    // material.materialNames ஒரு அரேவாக இருந்தால், அதை ஒரு ஸ்ட்ரிங்காக மாற்றவும்
                    const materialName = Array.isArray(material.materialNames) ? material.materialNames.join(', ') : material.materialNames;
                    acc[material._id] = materialName || 'Unknown Material';
                    return acc;
                }, {});
                setMaterialsMap(newMaterialsMap);
            } catch (err) {
                console.error("Error fetching all materials:", err);
                setError(err.message || "An error occurred while fetching materials.");
            }
        };

        fetchAllMaterials();
    }, []);

    const fetchProjectAndRecords = useCallback(async () => {
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

            // 1. Fetch Project Details
            const projectResponse = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!projectResponse.ok) {
                throw new Error(`Failed to fetch project details. Status: ${projectResponse.status}`);
            }
            const projectData = await projectResponse.json();
            setProjectName(projectData.projectName);

            // 2. Fetch Material Usage Records
            const usageResponse = await fetch(`${API_BASE_URL}/material-usage/project/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!usageResponse.ok) {
                throw new Error(`Failed to fetch material usage records. Status: ${usageResponse.status}`);
            }

            const apiResponse = await usageResponse.json();
            const rawUsageRecords = Array.isArray(apiResponse) ? apiResponse : apiResponse.data;

            if (!Array.isArray(rawUsageRecords)) {
                console.error("API response for material usage is not an array:", apiResponse);
                setUsageRecords([]);
                return;
            }

            // 3. Combine usage records with material names from the pre-fetched map
            const enrichedUsageRecords = rawUsageRecords.map(record => ({
                ...record,
                // materialsMap[record.materialId] என்று பயன்படுத்துவதுதான் சரியான வழி
                materialName: materialsMap[record.materialId] || record.materialName || 'Unknown Material'
            }));

            setUsageRecords(enrichedUsageRecords);

        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err.message || "An unexpected error occurred while fetching data.");
        } finally {
            setLoading(false);
        }
    }, [projectId, navigate, materialsMap]); // Added materialsMap to dependency array

    useEffect(() => {
        if (projectId && Object.keys(materialsMap).length > 0) {
            fetchProjectAndRecords();
        }
    }, [projectId, fetchProjectAndRecords, materialsMap]);

    const handleFormClose = (status, message) => {
        setShowFormModal(false);
        setCurrentUsage(null);
        if (status && message) {
            setMessageBox({ type: status, message });
            fetchProjectAndRecords();
        }
    };

    const handleAdd = () => {
        setCurrentUsage(null);
        setShowFormModal(true);
    };

    const handleEdit = (record) => {
        setCurrentUsage(record);
        setShowFormModal(true);
    };

    const handleDeleteClick = (recordId) => {
        setRecordIdToDelete(recordId);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        setShowConfirmModal(false);
        if (!recordIdToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/material-usage/${recordIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete material usage record: ${response.statusText}`);
            }

            fetchProjectAndRecords();
            setMessageBox({ type: 'success', message: "Material usage record deleted successfully!" });
        } catch (err) {
            console.error("Error deleting material usage record:", err);
            setMessageBox({ type: 'error', message: `Failed to delete: ${err.message}` });
        } finally {
            setRecordIdToDelete(null);
        }
    };

    const handleBackClick = () => {
        navigate(-1);
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-600">Loading project data...</div>;
    }

    return (
        <div className="p-6 bg-gray-50 rounded-lg shadow-xl min-h-screen font-sans">
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
                    Materials Usage for: {projectName}
                </h2>
                <div></div>
            </div>

            <button
                onClick={handleAdd}
                className="mb-6 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center shadow-lg"
                title="Add New Material Usage"
            >
                <PlusCircle size={20} className="mr-2" /> Add New Material Usage
            </button>

            {usageRecords.length === 0 ? (
                <p className="text-center text-gray-500 italic">No material usage records found for this project. Add one to begin.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg shadow-md">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {usageRecords.map((record, index) => (
                                <tr key={record._id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {record.materialName || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {record.quantityUsed || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {record.unit || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {record.fromDate ? new Date(record.fromDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {record.toDate ? new Date(record.toDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(record)}
                                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 transition duration-200"
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(record._id)}
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
                <Modal onClose={() => handleFormClose('cancel')}>
                    <ProjectMaterialUsageForm
                        usage={currentUsage}
                        onClose={() => handleFormClose('cancel')}
                        projectId={projectId}
                        onUpdate={handleFormClose}
                    />
                </Modal>
            )}

            {showConfirmModal && (
                <ConfirmModal
                    message="Are you sure you want to delete this material usage record?"
                    onConfirm={confirmDelete}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </div>
    );
};

export default ProjectMaterialUsage;

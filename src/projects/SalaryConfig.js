import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SalaryConfigForm from './SalaryConfigForm';
// சரியான இறக்குமதி வழி இங்கே கொடுக்கப்பட்டுள்ளது.
import MessageModal from '../model/MessageModal';
import { Edit, Trash2, PlusCircle, ArrowLeft } from 'lucide-react';
import { formatInr } from '../utils/formatter';

// API_BASE_URL-ஐ உங்கள் உண்மையான backend URL-க்கு மாற்றவும்
const API_BASE_URL = 'http://localhost:5000/api';

const SalaryConfig = () => {
    const { projectId } = useParams();
    const [salaryConfigs, setSalaryConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [roleOptions, setRoleOptions] = useState([]);
    const [messageModal, setMessageModal] = useState({ show: false, message: '', type: '', onConfirm: null, onClose: null });

    const navigate = useNavigate();

    const fetchAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found. Please log in again.');
            }

            const [configsResponse, rolesResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/salary-configs/project/${projectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/roles`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const configs = configsResponse.status === 204 ? [] : await configsResponse.json();
            if (!configsResponse.ok && configsResponse.status !== 204) {
                throw new Error(`Failed to fetch salary configurations: ${configsResponse.statusText}`);
            }

            const rolesData = await rolesResponse.json();
            if (!rolesResponse.ok) {
                throw new Error('Failed to fetch role names');
            }

            setSalaryConfigs(configs);
            setRoleOptions(rolesData);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to fetch data. Please try again: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchAllData();
        }
    }, [projectId]);

    const handleDelete = (configId) => {
        setMessageModal({
            show: true,
            message: "Are you sure you want to delete this salary configuration?",
            type: 'confirm',
            onConfirm: async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        throw new Error('Token not found. Please log in again.');
                    }
                    const response = await fetch(`${API_BASE_URL}/salary-configs/${configId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (!response.ok) {
                        const contentType = response.headers.get("content-type");
                        let errorMessage = `Failed to delete salary configuration: ${response.statusText}`;
                        if (contentType && contentType.includes("application/json")) {
                            const errorData = await response.json();
                            errorMessage = errorData.message || errorMessage;
                        }
                        throw new Error(errorMessage);
                    }

                    fetchAllData();
                    setMessageModal({
                        show: true,
                        message: "Salary configuration deleted successfully!",
                        type: 'success',
                        onClose: () => setMessageModal({ show: false, message: '', type: '', onConfirm: null, onClose: null })
                    });
                } catch (err) {
                    console.error("Error deleting salary config:", err);
                    setMessageModal({
                        show: true,
                        message: "Failed to delete salary configuration: " + err.message,
                        type: 'error',
                        onClose: () => setMessageModal({ show: false, message: '', type: '', onConfirm: null, onClose: null })
                    });
                }
            },
            onClose: () => setMessageModal({ show: false, message: '', type: '', onConfirm: null, onClose: null })
        });
    };

    const handleFormOpen = () => {
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        fetchAllData();
    };

    if (showForm) {
        return (
            <SalaryConfigForm
                projectConfigs={salaryConfigs}
                roleOptions={roleOptions}
                onSaveSuccess={handleFormClose}
                onClose={handleFormClose}
                projectId={projectId}
                handleDelete={handleDelete}
            />
        );
    }

    const handleBackClick = () => {
        navigate(-1);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
                 <div className="flex items-center justify-between mb-6">
                <button
                    onClick={handleBackClick}
                    className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    title="Go Back"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back
                </button>
                <h2 className="text-3xl font-bold text-gray-800">
                    Project Salary Configurations
                </h2>
                <div></div>
            </div>
                
                <div className="flex justify-end mb-6">
                    <button
                        onClick={handleFormOpen}
                        className="px-6 py-2 bg-green-600 text-white rounded-full shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 flex items-center"
                    >
                        <PlusCircle size={20} className="mr-2" /> Add/Edit Configuration
                    </button>
                </div>

                {error && <p className="p-4 text-center text-red-600 font-medium border border-red-300 bg-red-50 rounded-md mb-4">{error}</p>}

                {loading ? (
                    <div className="p-8 text-center text-gray-700">Loading salary configurations...</div>
                ) : salaryConfigs.length === 0 ? (
                    <p className="text-gray-600 italic text-center py-8">No salary configurations found for this project. Click "Add/Edit Configuration" to add one.</p>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">S.No</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Salary Per Head</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Count</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total Salary</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">From Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">To Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {salaryConfigs.map((config, index) => (
                                    <tr key={config._id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {config.roleName || 'Unknown Role'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {formatInr(config.salaryPerHead)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {config.count || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {formatInr(config.totalSalary)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {new Date(config.fromDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {new Date(config.toDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={handleFormOpen}
                                                    className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 transition duration-200"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(config._id)}
                                                    className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition duration-200"
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
            </div>

            {messageModal.show && (
                <MessageModal
                    message={messageModal.message}
                    type={messageModal.type}
                    onClose={messageModal.onClose}
                    onConfirm={messageModal.onConfirm}
                />
            )}
        </div>
    );
};

export default SalaryConfig;

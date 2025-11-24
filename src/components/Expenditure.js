import React, { useState, useEffect } from 'react';
import Modal from '../model/Modal';
import ExpenditureForm from './ExpenditureForm';
import { Trash2, Edit, ArrowLeft, Plus, Users, Calendar, DollarSign, Filter, Download, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const Expenditure = () => {
    const [expenditures, setExpenditures] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentExpenditure, setCurrentExpenditure] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const navigate = useNavigate();

    // Calculate the total manpower cost from all expenditures
    const totalManpowerCost = expenditures.reduce((total, item) => total + (item.totalWages || 0), 0);

    // Filter expenditures based on search term
    const filteredExpenditures = expenditures.filter(item =>
        item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.payType?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Fetch projects and expenditures
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Token not found. Please log in again.");

                // Fetch projects
                const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!projectsResponse.ok) throw new Error("Failed to fetch projects.");
                const projectsData = await projectsResponse.json();
                setProjects(projectsData);

                let initialProjectId = projectsData.length > 0 ? projectsData[0]._id : '';

                const pathParts = window.location.pathname.split('/');
                const projectIdIndex = pathParts.indexOf('projects') + 1;
                if (projectIdIndex > 0 && projectIdIndex < pathParts.length) {
                    const routeProjectId = pathParts[projectIdIndex];
                    if (projectsData.some(p => p._id === routeProjectId)) {
                        initialProjectId = routeProjectId;
                    }
                }

                setSelectedProjectId(initialProjectId);
                if (initialProjectId) {
                    fetchExpendituresByProject(initialProjectId);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to fetch data: " + err.message);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchExpendituresByProject = async (projectId) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/expenditures/project/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to fetch expenditures for the project.");
            }
            const data = await response.json();
            setExpenditures(data);
        } catch (err) {
            console.error("Error fetching expenditures:", err);
            setError("Failed to fetch expenditures. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleProjectChange = (e) => {
        const projectId = e.target.value;
        setSelectedProjectId(projectId);
        if (projectId) {
            fetchExpendituresByProject(projectId);
        } else {
            setExpenditures([]);
        }
    };

    const handleCustomConfirm = (message, onConfirm) => {
        console.log(`[ACTION REQUIRED: CONFIRMATION NEEDED] ${message}`);
        onConfirm();
    };

    const handleDelete = async (id) => {
        const confirmDeletion = () => {
            performDelete(id);
        };
        handleCustomConfirm("Are you sure you want to delete this expenditure record?", confirmDeletion);
    };

    const performDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Token not found. Please log in again.");
            const response = await fetch(`${API_BASE_URL}/expenditures/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete expenditure.");
            }
            setExpenditures(expenditures.filter(item => item._id !== id));
            console.log("Expenditure deleted successfully!");
        } catch (err) {
            console.error("Error deleting expenditure:", err);
            console.error("Failed to delete expenditure: " + err.message);
        }
    };

    const handleEdit = (expenditure) => {
        setCurrentExpenditure(expenditure);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        if (!selectedProjectId) {
            console.error("Please select a project before adding an expenditure.");
            return;
        }
        setCurrentExpenditure(null);
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        if (selectedProjectId) {
            fetchExpendituresByProject(selectedProjectId);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md w-full">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">!</span>
                            </div>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-red-800 font-semibold">Error</h3>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleBackClick = () => {
        navigate(-1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 overflow-hidden">
            <div className="max-w-full mx-auto h-full flex flex-col">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleBackClick}
                            className="flex items-center px-4 py-3 bg-white text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md border border-indigo-100"
                        >
                            <ArrowLeft size={20} className="mr-2" /> Back
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                <Users className="h-7 w-7 mr-3 text-indigo-600" />
                                ManPower Allocation
                            </h1>
                            <p className="text-gray-600 text-sm mt-1">Manage and track workforce expenses</p>
                        </div>
                    </div>
                </div>

                {/* Stats and Controls Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    {/* Project Selector */}
                    <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                        <label htmlFor="project-select" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Filter size={16} className="mr-2" />
                            Select Project
                        </label>
                        <select
                            id="project-select"
                            value={selectedProjectId}
                            onChange={handleProjectChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-sm"
                        >
                            <option value="" disabled>Select a Project</option>
                            {projects.map(project => (
                                <option key={project._id} value={project._id}>{project.projectName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Total Cost Card */}
                    {selectedProjectId && (
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 shadow-lg text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-indigo-100 text-xs font-medium">Total Manpower Cost</p>
                                    <p className="text-2xl font-bold mt-1">₹{totalManpowerCost.toFixed(2)}</p>
                                </div>
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <DollarSign size={20} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Button */}
                    <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 flex items-center justify-center">
                        <button
                            onClick={handleAdd}
                            disabled={!selectedProjectId}
                            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm"
                        >
                            <Plus size={18} className="mr-2" />
                            Add ManPower Allocation
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search by employee name, designation, or pay type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-sm"
                        />
                    </div>
                </div>

                {/* Table Section - Fixed height with proper scrolling */}
                <div className="flex-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
                    {filteredExpenditures.length === 0 && selectedProjectId ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <Users className="h-12 w-12 text-gray-300 mb-3" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No ManPower Allocations</h3>
                            <p className="text-gray-500 text-sm mb-4">Get started by adding your first manpower allocation</p>
                            <button
                                onClick={handleAdd}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                            >
                                <Plus size={16} className="inline mr-2" />
                                Add Allocation
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-indigo-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">S.No</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Employee</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Designation</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Period</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Pay Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Rate</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Working Days</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Wages</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredExpenditures.map((item, index) => (
                                        <tr key={item._id} className="hover:bg-indigo-50/30 transition-all duration-150">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 bg-indigo-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">{item.employeeName}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {item.designation || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center text-xs text-gray-600">
                                                    <Calendar size={12} className="mr-1" />
                                                    {item.fromDate ? new Date(item.fromDate).toLocaleDateString() : 'N/A'} - {item.toDate ? new Date(item.toDate).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.payType === 'Daily' ? 'bg-green-100 text-green-800' :
                                                        item.payType === 'Monthly' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {item.payType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                ₹{item.payRate ? item.payRate.toFixed(2) : '0.00'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {item.WorkingDays || item.WorkingHours || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm font-bold text-green-700 bg-green-50 px-2 py-1 rounded">
                                                    ₹{item.totalWages ? item.totalWages.toFixed(2) : '0.00'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center justify-center space-x-1">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-lg transition-all duration-200"
                                                        title="Edit"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-all duration-200"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
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

                {showFormModal && (
                    <Modal onClose={handleFormClose}>
                        <ExpenditureForm
                            expenditure={currentExpenditure}
                            projectId={selectedProjectId}
                            onClose={handleFormClose}
                        />
                    </Modal>
                )}
            </div>
        </div>
    );
};

export default Expenditure;
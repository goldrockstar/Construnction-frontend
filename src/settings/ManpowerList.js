import React, { useState, useEffect } from 'react';
import ManpowerForm from './ManpowerForm';
import Modal from '../model/Modal';
import ConfirmationModal from '../model/ConfirmationModal';
import { Edit, PlusCircle, Trash2, Users, Phone, MapPin, DollarSign, Search, User, Briefcase } from 'lucide-react';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const ManpowerList = () => {
    const [manpower, setManpower] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentManpower, setCurrentManpower] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [manpowerToDelete, setManpowerToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const safeFetch = async (url, options = {}, retries = 3) => {
        let lastError = null;
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                return response;
            } catch (error) {
                lastError = error;
                if (i < retries - 1) {
                    const delay = Math.pow(2, i) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    };

    const fetchManpower = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn("Authentication token not found. Assuming anonymous access or skipping auth.");
            }
            
            const response = await safeFetch(API_BASE_URL + '/manpower', { 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            const manpowerList = await response.json();
            setManpower(manpowerList.map(entry => ({ ...entry, id: entry._id })));

        } catch (err) {
            console.error("Error fetching manpower data:", err);
            setError("Failed to fetch manpower data. Please try again: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManpower();
    }, []);

    const handleDeleteClick = (manpowerId) => {
        setManpowerToDelete(manpowerId);
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        setShowConfirmModal(false);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("token not found");
            }
            const response = await safeFetch(API_BASE_URL + '/manpower/' + manpowerToDelete, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (response.status === 204 || response.ok) {
                 setManpower(manpower.filter(entry => entry.id !== manpowerToDelete));
            } else {
                 const errorData = await response.json();
                 throw new Error(errorData.message || `Failed to delete manpower: ${response.statusText}`);
            }

        } catch (err) {
            console.error("Error deleting manpower:", err);
            setError("Failed to delete manpower: " + err.message);
        } finally {
            setManpowerToDelete(null);
        }
    };

    const handleEdit = (entry) => {
        setCurrentManpower(entry);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        setCurrentManpower(null);
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        setCurrentManpower(null);
        fetchManpower();
    };

    // Filter manpower based on search term
    const filteredManpower = manpower.filter(entry =>
        entry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.empId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.roleId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.phoneNumber?.includes(searchTerm)
    );

    // Calculate statistics
    const totalManpower = manpower.length;
    const totalPayRate = manpower.reduce((sum, entry) => sum + (entry.payRate || 0), 0);
    const averagePayRate = totalManpower > 0 ? totalPayRate / totalManpower : 0;

    const renderPhoto = (photoPath) => {
        if (!photoPath) return (
            <div className="w-12 h-12 flex items-center justify-center text-xs text-gray-500 border-2 border-dashed border-gray-300 rounded-full bg-gray-100">
                <User size={20} />
            </div>
        );
        
        const fullUrl = `https://construction-backend-uwd8.onrender.com${photoPath.startsWith('/') ? photoPath : `/${photoPath}`}`;
        
        return (
            <img 
                src={fullUrl} 
                alt="Employee" 
                className="w-12 h-12 object-cover rounded-full shadow-md border-2 border-white" 
                onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = "https://placehold.co/48x48/CCCCCC/333333?text=N/A"; 
                }}
            />
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                            <Users className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Manpower Management</h1>
                            <p className="text-gray-600 mt-1">Manage your workforce and employee details</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleAdd}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    >
                        <PlusCircle size={20} className="mr-2" />
                        Add New Employee
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Employees Card */}
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Employees</p>
                                <p className="text-3xl font-bold mt-2">{totalManpower}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <Users size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Average Pay Rate Card */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Average Pay Rate</p>
                                <p className="text-3xl font-bold mt-2">₹{averagePayRate.toFixed(2)}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <DollarSign size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Total Payroll Card */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Total Monthly Payroll</p>
                                <p className="text-3xl font-bold mt-2">₹{totalPayRate.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <Briefcase size={24} />
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
                            placeholder="Search employees by name, ID, role, or phone number..."
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

                {/* Manpower Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : filteredManpower.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <Users className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                {searchTerm ? 'No matching employees found' : 'No employees found'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {searchTerm 
                                    ? 'Try adjusting your search terms' 
                                    : 'Get started by adding your first employee'
                                }
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={handleAdd}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200"
                                >
                                    <PlusCircle size={18} className="inline mr-2" />
                                    Add First Employee
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Pay Details</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredManpower.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-indigo-50/30 transition-all duration-150 group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    {renderPhoto(entry.photo)}
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{entry.name}</div>
                                                        <div className="text-xs text-gray-500">ID: {entry.empId}</div>
                                                        <div className="text-xs text-gray-400 flex items-center mt-1">
                                                            <MapPin size={12} className="mr-1" />
                                                            {entry.address ? `${entry.address.substring(0, 30)}${entry.address.length > 30 ? '...' : ''}` : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <Briefcase size={12} className="mr-1" />
                                                    {entry.roleId ? entry.roleId.name : entry.roleName || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Phone size={14} className="mr-2 text-gray-400" />
                                                    {entry.phoneNumber || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        ₹{entry.payRate?.toLocaleString('en-IN') || '0'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        {entry.payRateType ? (entry.payRateType.name || entry.payRateType) : 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(entry)}
                                                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-xl transition-all duration-200 transform hover:scale-110"
                                                        title="Edit Employee"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(entry.id)}
                                                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-xl transition-all duration-200 transform hover:scale-110"
                                                        title="Delete Employee"
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
                        <ManpowerForm manpower={currentManpower} onClose={handleFormClose} />
                    </Modal>
                )}

                {showConfirmModal && (
                    <ConfirmationModal
                        title="Delete Employee"
                        message="Are you sure you want to delete this employee? This action cannot be undone."
                        onConfirm={handleConfirmDelete}
                        onCancel={() => setShowConfirmModal(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default ManpowerList;
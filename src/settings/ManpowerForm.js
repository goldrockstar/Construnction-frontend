import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const ManpowerForm = ({ manpower, onClose }) => {
    const [formData, setFormData] = useState({
        empId: 'Loading...',
        name: '',
        roleId: '', 
        roleName: '',
        phoneNumber: '',
        address: '',
        payRateType: '',
        payRate: '',
        photo: null, 
    });

    const [rolesList, setRolesList] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Fetch Roles
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error('Authentication token missing.');
                
                const response = await fetch(`${API_BASE_URL}/roles`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) throw new Error('Failed to fetch roles.');
                
                const data = await response.json();
                setRolesList(data);
            } catch (error) {
                console.error("Error fetching roles:", error);
                setFormError("Error loading roles.");
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchRoles();
    }, []);

    // Populate form data & Fetch Next ID
    useEffect(() => {
        if (manpower) {
            // Edit Mode
            setFormData({
                empId: manpower.empId || '',
                name: manpower.name || '',
                roleId: manpower.roleId ? manpower.roleId._id : '',
                roleName: manpower.roleId ? manpower.roleId.name : '',
                phoneNumber: manpower.phoneNumber || '',
                address: manpower.address || '',
                payRateType: manpower.payRateType || '',
                payRate: manpower.payRate || '',
                photo: null, 
            });
        } else {
            // Add Mode (Fetch Next ID)
            const fetchNextId = async () => {
                try {
                    const token = localStorage.getItem("token");
                    const response = await fetch(`${API_BASE_URL}/manpower/next-id`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        setFormData(prev => ({ ...prev, empId: data.empId }));
                    } else {
                        setFormData(prev => ({ ...prev, empId: 'Error' }));
                    }
                } catch (error) {
                    console.error("Error fetching next ID:", error);
                    setFormData(prev => ({ ...prev, empId: 'Error' }));
                }
            };
            fetchNextId();
            
            // Reset other fields for new entry
            setFormData(prev => ({
                ...prev,
                name: '',
                roleId: '',
                roleName: '',
                phoneNumber: '',
                address: '',
                payRateType: '',
                payRate: '',
                photo: null,
            }));
        }
    }, [manpower]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'roleId') {
            const selectedRole = rolesList.find(r => String(r._id) === value);
            setFormData(prev => ({
                ...prev,
                roleId: value,
                roleName: selectedRole ? selectedRole.name : ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, photo: e.target.files[0] }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        setSuccessMessage(null);

        if (!formData.name || !formData.roleId || !formData.phoneNumber) {
            setFormError("Name, Role, and Phone Number are required.");
            setSubmitting(false);
            return;
        }

        const dataToSend = new FormData();
        // Always append empId, even if backend regenerates it, to be safe
        dataToSend.append('empId', formData.empId); 
        dataToSend.append('name', formData.name);
        dataToSend.append('roleId', formData.roleId);
        dataToSend.append('roleName', formData.roleName);
        dataToSend.append('phoneNumber', formData.phoneNumber);
        dataToSend.append('address', formData.address);
        dataToSend.append('payRateType', formData.payRateType);
        dataToSend.append('payRate', formData.payRate);
        
        if (formData.photo instanceof File) {
            dataToSend.append('photo', formData.photo);
        }

        try {
            const token = localStorage.getItem("token");
            const headers = { 'Authorization': `Bearer ${token}` };
            let response;
            
            if (manpower && manpower._id) {
                response = await fetch(`${API_BASE_URL}/manpower/${manpower._id}`, {
                    method: 'PUT',
                    headers,
                    body: dataToSend,
                });
            } else {
                response = await fetch(`${API_BASE_URL}/manpower`, {
                    method: 'POST',
                    headers,
                    body: dataToSend,
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed: ${response.statusText}`);
            }

            setSuccessMessage("Saved successfully!");
            setTimeout(() => onClose(), 1000);
        } catch (err) {
            console.error("Save Error:", err);
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Manpower / {manpower ? 'Edit' : 'Add'}</h3>
            
            {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMessage}</div>}
            {formError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{formError}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Employee ID (Read Only) */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700">Employee ID *</label>
                        <input
                            type="text"
                            value={formData.empId}
                            readOnly
                            disabled
                            className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700">Name *</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="px-3 py-2 border rounded-md" required />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700">Role *</label>
                        <select name="roleId" value={formData.roleId} onChange={handleChange} className="px-3 py-2 border rounded-md" required>
                            <option value="">Select Role</option>
                            {rolesList.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                    </div>
                    
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700">Phone *</label>
                        <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="px-3 py-2 border rounded-md" required />
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">Address</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} className="px-3 py-2 border rounded-md" rows="2"></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700">Pay Type</label>
                        <select name="payRateType" value={formData.payRateType} onChange={handleChange} className="px-3 py-2 border rounded-md">
                            <option value="">Select Type</option>
                            <option value="Hourly">Hourly</option>
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-gray-700">Pay Rate</label>
                        <input type="number" name="payRate" value={formData.payRate} onChange={handleChange} className="px-3 py-2 border rounded-md" />
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">Photo</label>
                    <input type="file" onChange={handleFileChange} className="px-3 py-2 border rounded-md" />
                </div>

                <div className="flex justify-end space-x-3 mt-4 pt-2 border-t">
                    <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center">
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitting ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ManpowerForm;
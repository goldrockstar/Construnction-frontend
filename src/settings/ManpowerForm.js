import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

const ManpowerForm = ({ manpower, onClose }) => {
    // மாநில நிர்வாகம் (State management)
    const [formData, setFormData] = useState({
        name: '',
        roleId: '', 
        roleName: '',
        phoneNumber: '',
        address: '',
        description: '',
        photo: null, // புதிய புகைப்பட கோப்பிற்கான பொருள் (File object)
    });

    const [rolesList, setRolesList] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // ரோல் பட்டியலைப் பெறுதல்
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error('அங்கீகார டோக்கன் இல்லை.');
                }
                const response = await fetch(API_BASE_URL + '/roles', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });
                if (!response.ok) {
                    throw new Error('ரோல்களைப் பெறுவதில் தோல்வி.');
                }
                const data = await response.json();
                setRolesList(data);
            } catch (error) {
                console.error("ரோல்களைப் பெறுவதில் பிழை:", error);
                setFormError("ரோல்களைப் பெறுவதில் சிக்கல். உங்கள் சர்வர் API ஐ சரிபார்க்கவும்.");
            } finally {
                setLoadingRoles(false);
            }
        };

        fetchRoles();
    }, []);

    // படிவத் தரவை நிரப்புதல் (திருத்துவதற்கு)
    useEffect(() => {
        if (manpower) {
            setFormData({
                name: manpower.name || '',
                roleId: manpower.roleId ? manpower.roleId._id : '',
                roleName: manpower.roleId ? manpower.roleId.name : '',
                phoneNumber: manpower.phoneNumber || '',
                address: manpower.address || '',
                description: manpower.description || '',
                photo: null, // திருத்தத்தின் போது கோப்புப் புலத்தை மீட்டமைக்கவும்
            });
        } else {
            // புதிய பதிவைச் சேர்ப்பதற்கான படிவத்தை மீட்டமைத்தல்
            setFormData({
                name: '',
                roleId: '',
                roleName: '',
                phoneNumber: '',
                address: '',
                description: '',
                photo: null,
            });
        }
    }, [manpower]);

    // உள்ளீட்டுப் புலங்களை புதுப்பித்தல்
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

    // கோப்புப் புலத்தைக் கையாளுதல்
    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, photo: e.target.files[0] }));
    };

    // படிவச் சமர்ப்பிப்பை கையாளுதல்
    const handleSubmit = async (e) => {
        e.preventDefault();

        setSubmitting(true);
        setFormError(null);
        setSuccessMessage(null);

        // அடிப்படை சரிபார்ப்பு
        if (!formData.name || !formData.roleId || !formData.phoneNumber) {
            setFormError("பெயர், ரோல் மற்றும் தொலைபேசி எண் கட்டாயமானது.");
            setSubmitting(false);
            return;
        }

        // FormData ஐப் பயன்படுத்தி கோப்பு மற்றும் பிற படிவத் தரவை ஒன்றாக அனுப்புதல்.
        // இந்த வடிவத்திற்கு, சர்வரில் 'multer' போன்ற ஒரு middleware தேவை.
        const dataToSend = new FormData();
        dataToSend.append('name', formData.name);
        dataToSend.append('roleId', formData.roleId);
        dataToSend.append('roleName', formData.roleName);
        dataToSend.append('phoneNumber', formData.phoneNumber);
        dataToSend.append('address', formData.address);
        dataToSend.append('description', formData.description);
        
        // கோப்பு இருப்பின், அதை இணைக்கவும்
        if (formData.photo instanceof File) {
            dataToSend.append('photo', formData.photo);
        } else if (manpower && manpower.photo && formData.photo === '') {
            dataToSend.append('photo', '');
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("அங்கீகார டோக்கன் இல்லை.");
            }

            // FormData ஐப் பயன்படுத்தும் போது, 'Content-Type' தலைப்பை அமைக்க வேண்டாம்.
            // இது browser-ஆல் தானாக அமைக்கப்படும்.
            const headers = { 'Authorization': `Bearer ${token}` };

            let response;
            if (manpower && manpower._id) {
                response = await fetch(API_BASE_URL + '/manpower/' + manpower._id, {
                    method: 'PUT',
                    headers,
                    body: dataToSend,
                });
            } else {
                response = await fetch(API_BASE_URL + '/manpower', {
                    method: 'POST',
                    headers,
                    body: dataToSend,
                });
            }

            // பிழை பதிலைக் கையாளுதல்
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `மனிதவள பதிவை சேமிப்பதில் தோல்வி: ${response.statusText}`);
            }

            setSuccessMessage("படிவம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!");
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err) {
            console.error("மனிதவள பதிவை சேமிப்பதில் பிழை:", err);
            setFormError(err.message || "மனிதவள பதிவை சேமிப்பதில் தோல்வி.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Manpower / {manpower ? 'Edit' : 'Add'}</h3>
            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    {successMessage}
                    <button onClick={() => setSuccessMessage(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                        <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                    </button>
                </div>
            )}
            {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
            {/* FormData பயன்படுத்தப்படுவதால் 'encType' பண்பு தேவையில்லை, அதை நீக்கவும். */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="name" className="mb-1 text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g., Siva"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="roleId" className="mb-1 text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
                        <select
                            id="roleId"
                            name="roleId"
                            value={formData.roleId}
                            onChange={handleChange}
                            required
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="" disabled>ரோலைத் தேர்ந்தெடுக்கவும்</option>
                            {loadingRoles ? (
                                <option disabled>ஏற்றுகிறது...</option>
                            ) : (
                                rolesList.map((role) => (
                                    <option key={role._id} value={role._id}>{role.name}</option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="phoneNumber" className="mb-1 text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g., 1234512345"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="address" className="mb-1 text-sm font-medium text-gray-700">Address</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows="2"
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g., 123 Main St, City"
                        ></textarea>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="description" className="mb-1 text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="2"
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Any additional notes"
                        ></textarea>
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="photo" className="mb-1 text-sm font-medium text-gray-700">Photo</label>
                        <input
                            type="file"
                            id="photo"
                            name="photo"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {manpower && manpower.photo && (
                            <div className="relative mt-2 w-24 h-24">
                                <img src={`http://localhost:5000${manpower.photo}`} alt="Manpower Photo" className="w-full h-full object-cover rounded-md" />
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={submitting} 
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={submitting || loadingRoles}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                        {submitting ? 'சேமிக்கிறது...' : (manpower ? 'Manpower ஐப் புதுப்பிக்கவும்' : 'Manpower ஐச் சேர்க்கவும்')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ManpowerForm;

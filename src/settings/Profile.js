import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Loader2, User, Building, Phone, Mail, MapPin, FileText, Image, Save, Shield } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';

const Profile = () => {
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        companyName: '',
        contactNumber: '',
        gst: '',
        email: '',
        tinNumber: '',
        address: '',
        natureOfWork: '',
        logo: '',
        username: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:5000/api/users/profile`, {
                    headers: getAuthHeaders()
                });

                if (response.status === 404) {
                    console.log("Profile not found. Creating a new profile.");
                    toast.info("Starting to create a new profile.");
                    setProfileData({
                        firstName: '', lastName: '', companyName: '', contactNumber: '',
                        gst: '', email: '', tinNumber: '', address: '', natureOfWork: '', logo: '', username: ''
                    });
                } else if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to get profile: ${response.statusText}`);
                } else {
                    const data = await response.json();
                    const { profile, email, username, ...rest } = data;
                    setProfileData({ ...profile, email, username, id: rest._id });
                    toast.success("Profile data retrieved successfully!");
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                toast.error("An error occurred while fetching the profile: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        if (!profileData.firstName || !profileData.lastName) {
            toast.error("First name and last name are required.");
            setSaving(false);
            return;
        }

        try {
            const method = profileData.id ? 'PUT' : 'POST';
            const url = profileData.id ? `http://localhost:5000/api/users/profile` : `http://localhost:5000/api/users`;

            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to save profile: ${response.statusText}`);
            }

            const savedProfile = await response.json();
            setProfileData({ ...savedProfile.profile, email: savedProfile.email, username: savedProfile.username, id: savedProfile._id });

            toast.success("Profile saved successfully!");
        } catch (err) {
            console.error("Error saving profile:", err);
            toast.error("An error occurred while saving the profile: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const response = await fetch(`http://localhost:5000/api/users/${profileData.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete profile: ${response.statusText}`);
            }

            toast.success("Profile deleted successfully!");
            setProfileData({
                firstName: '', lastName: '', companyName: '', contactNumber: '',
                gst: '', email: '', tinNumber: '', address: '', natureOfWork: '', logo: '', username: ''
            });

        } catch (err) {
            console.error("Error deleting profile:", err);
            toast.error("An error occurred while deleting the profile: " + err.message);
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };
    
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            <ToastContainer position="bottom-right" autoClose={3000} />
            
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                        <User className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {profileData.id ? 'Update Profile' : 'Create Profile'}
                    </h1>
                    <p className="text-gray-600">
                        {profileData.id 
                            ? 'Manage your personal and company information' 
                            : 'Set up your profile to get started'
                        }
                    </p>
                </div>

                {/* Profile Form */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        {/* Personal Information Section */}
                        <div className="p-8 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                <User className="h-5 w-5 mr-2 text-indigo-600" />
                                Personal Information
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <Shield className="h-4 w-4 mr-2 text-gray-500" />
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.username || 'User'}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                        disabled
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={profileData.email || 'user@example.com'}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                        disabled
                                    />
                                </div>

                                {/* First Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={profileData.firstName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={profileData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                </div>

                                {/* Contact Number */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                                        Contact Number
                                    </label>
                                    <input
                                        type="text"
                                        name="contactNumber"
                                        value={profileData.contactNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                {/* Address */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                                        Address
                                    </label>
                                    <textarea
                                        name="address"
                                        value={profileData.address}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Company Information Section */}
                        <div className="p-8 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                <Building className="h-5 w-5 mr-2 text-indigo-600" />
                                Company Information
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Company Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={profileData.companyName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                {/* Nature of Work */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                        Nature of Work
                                    </label>
                                    <input
                                        type="text"
                                        name="natureOfWork"
                                        value={profileData.natureOfWork}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                {/* GST Number */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        GST Number
                                    </label>
                                    <input
                                        type="text"
                                        name="gst"
                                        value={profileData.gst}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                {/* TIN Number */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        TIN Number
                                    </label>
                                    <input
                                        type="text"
                                        name="tinNumber"
                                        value={profileData.tinNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                {/* Logo URL */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <Image className="h-4 w-4 mr-2 text-gray-500" />
                                        Logo URL
                                    </label>
                                    <input
                                        type="url"
                                        name="logo"
                                        value={profileData.logo}
                                        onChange={handleChange}
                                        placeholder="https://example.com/logo.png"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                {/* Logo Preview */}
                                {profileData.logo && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Logo Preview
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 flex justify-center">
                                            <img
                                                src={profileData.logo}
                                                alt="Company Logo Preview"
                                                className="max-h-32 object-contain rounded-lg"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://placehold.co/200x100?text=Logo+Not+Found";
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-8 bg-gray-50">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                {profileData.id && (
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(true)}
                                        disabled={deleting}
                                        className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                                    >
                                        {deleting ? (
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        ) : (
                                            <Trash2 className="h-5 w-5 mr-2" />
                                        )}
                                        {deleting ? 'Deleting...' : 'Delete Profile'}
                                    </button>
                                )}
                                
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                                >
                                    {saving ? (
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    ) : (
                                        <Save className="h-5 w-5 mr-2" />
                                    )}
                                    {saving ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Profile</h3>
                            <p className="text-gray-600">
                                Are you sure you want to delete your profile? This action cannot be undone.
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {deleting ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : null}
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
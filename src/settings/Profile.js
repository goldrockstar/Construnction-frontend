import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Loader2 } from 'lucide-react';
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
                    // Destructure profile and user data
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
    }, []); // Empty dependency array to run only once when mounted

    // Function to handle changes in input fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    // Function to handle form submission (save/update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        // Validate required fields
        if (!profileData.firstName || !profileData.lastName) {
            toast.error("First name and last name are required.");
            setSaving(false);
            return;
        }

        try {
            
            // Determine the HTTP method based on whether a profile exists
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
            console.log("Profile saved successfully!");
        } catch (err) {
            console.error("Error saving profile:", err);
            toast.error("An error occurred while saving the profile: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Function to handle profile deletion
    const handleDelete = async () => {
        setDeleting(true);
        try {
            // Make a DELETE request to the API
            const response = await fetch(`http://localhost:5000/api/users/${profileData.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete profile: ${response.statusText}`);
            }

            toast.success("Profile deleted successfully!");
            console.log("Profile deleted successfully!");

            // Reset the form state to clear all data after successful deletion
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
    
    // Render the loading state
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center bg-light min-vh-100 p-4">
                <p className="text-secondary d-flex align-items-center">
                    <Loader2 size={24} className="me-2 spin-animation" />
                    Loading profile...
                </p>
            </div>
        );
    }

    return (
        <div className="bg-light min-vh-100 p-4">
            {/* Bootstrap & Custom CSS for self-contained preview */}
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                @import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
                @import url('https://cdnjs.cloudflare.com/ajax/libs/react-toastify/9.1.1/ReactToastify.min.css');
                * { font-family: 'Inter', sans-serif; }
                .card.shadow { box-shadow: 0 0.5rem 1rem rgba(0,0,0,.15)!important; }
                .form-control:focus { box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25); }
                .btn:focus { box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25); }
                .modal-content { animation: fadeInScale 0.3s ease-in-out; }
                .spin-animation { animation: spin 1s linear infinite; }
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .cursor-not-allowed {
                    cursor: not-allowed;
                }
                `}
            </style>
            <ToastContainer position="bottom-right" autoClose={3000} />
            <div className="container py-4">
                <div className="card shadow border-0 rounded-4 p-4">
                    <div className="card-body">
                        <h2 className="card-title fw-bold text-dark mb-4">
                            {profileData.firstName ? 'Update Profile' : 'Create New Profile'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                {/* Static User Info - using mock data since no authentication is provided */}
                                <div className="col-md-6">
                                    <label htmlFor="username" className="form-label text-dark fw-semibold">
                                        Username
                                    </label>
                                    <input
                                        type="text" id="username" name="username" value={profileData.username || 'User'}
                                        className="form-control bg-light text-secondary border-0"
                                        disabled
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="email" className="form-label text-dark fw-semibold">
                                        Email
                                    </label>
                                    <input
                                        type="email" id="email" name="email" value={profileData.email || 'mockuser@example.com'}
                                        className="form-control bg-light text-secondary border-0"
                                        disabled
                                    />
                                </div>
                                {/* Other editable profile fields */}
                                <div className="col-md-6">
                                    <label htmlFor="firstName" className="form-label text-dark fw-semibold">
                                        First Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text" id="firstName" name="firstName" value={profileData.firstName || ''} onChange={handleChange}
                                        className="form-control" required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="lastName" className="form-label text-dark fw-semibold">
                                        Last Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text" id="lastName" name="lastName" value={profileData.lastName || ''} onChange={handleChange}
                                        className="form-control" required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="companyName" className="form-label text-dark fw-semibold">
                                        Company Name
                                    </label>
                                    <input
                                        type="text" id="companyName" name="companyName" value={profileData.companyName || ''} onChange={handleChange}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="contactNumber" className="form-label text-dark fw-semibold">
                                        Contact Number
                                    </label>
                                    <input
                                        type="text" id="contactNumber" name="contactNumber" value={profileData.contactNumber || ''} onChange={handleChange}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="gst" className="form-label text-dark fw-semibold">
                                        GST Number
                                    </label>
                                    <input
                                        type="text" id="gst" name="gst" value={profileData.gst || ''} onChange={handleChange}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="tinNumber" className="form-label text-dark fw-semibold">
                                        TIN Number
                                    </label>
                                    <input
                                        type="text" id="tinNumber" name="tinNumber" value={profileData.tinNumber || ''} onChange={handleChange}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-12">
                                    <label htmlFor="address" className="form-label text-dark fw-semibold">
                                        Address
                                    </label>
                                    <textarea
                                        id="address" name="address" value={profileData.address || ''} onChange={handleChange}
                                        className="form-control"
                                        rows="3"
                                    ></textarea>
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="natureOfWork" className="form-label text-dark fw-semibold">
                                        Nature of Work
                                    </label>
                                    <input
                                        type="text" id="natureOfWork" name="natureOfWork" value={profileData.natureOfWork || ''} onChange={handleChange}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="logo" className="form-label text-dark fw-semibold">
                                        Logo URL
                                    </label>
                                    <input
                                        type="url" id="logo" name="logo" value={profileData.logo || ''} onChange={handleChange}
                                        className="form-control"
                                        placeholder="Enter Logo URL"
                                    />
                                </div>
                                {/* Logo Preview Section */}
                                {profileData.logo && (
                                    <div className="col-12 text-center my-3">
                                        <h4 className="fw-semibold text-secondary mb-2">Logo Preview</h4>
                                        <div className="border rounded p-3 d-inline-block bg-white shadow-sm">
                                            <img
                                                src={profileData.logo}
                                                alt="Company Logo Preview"
                                                className="img-fluid rounded"
                                                style={{ maxHeight: '100px' }}
                                                onError={(e) => {
                                                    e.target.onerror = null; // prevents infinite loop
                                                    e.target.src = "https://placehold.co/100x100?text=Logo+Error";
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="d-flex justify-content-end align-items-center mt-4 pt-3 border-top">
                                {/* Show delete button only if a profile exists */}
                                {profileData.id && (
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(true)}
                                        className="btn btn-danger me-2 d-flex align-items-center"
                                        disabled={deleting}
                                    >
                                        <Trash2 size={18} className="me-2" />
                                        {deleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="btn btn-primary d-flex align-items-center"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="me-2 spin-animation" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Edit size={18} className="me-2" />
                                            Save
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content rounded-4 border-0 shadow-lg">
                            <div className="modal-body text-center p-4">
                                <div className="text-danger mb-3">
                                    <Trash2 size={48} />
                                </div>
                                <h5 className="modal-title fw-bold mb-2">Confirmation</h5>
                                <p className="text-muted small">
                                    Are you sure you want to delete this profile? This action cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer d-flex justify-content-center border-0 pt-0">
                                <button
                                    onClick={handleDelete}
                                    type="button"
                                    className="btn btn-danger me-2"
                                    disabled={deleting}
                                >
                                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    type="button"
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;

import React, { useState, useEffect } from 'react';


const API_BASE_URL = 'http://localhost:5000/api';

const AdminUserForm = ({ user, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'user',
       
    });

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                role: user.role || 'user',
            });
        } else {
            
            setFormData({
                name: '',
                email: '',
                role: 'user',
            });
        }
    }, [user]); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); 

        setSubmitting(true); 
        setFormError(null);

        if (!formData.name || !formData.email || !formData.role) {
            setFormError("All fields are required.");
            setSubmitting(false);
            return;
        }

        try {
            if (user && user.id) {
                
                const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
                    method: 'PUT', 
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify(formData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to update user: ${response.statusText}`);
                }
                alert("User updated successfully!");
            } else {
                const response = await fetch(`${API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify(formData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to add user: ${response.statusText}`);
                }
                alert("User added successfully!");
            }
            onClose();
        } catch (err) {
            console.error("Error saving user:", err);
            setFormError("Failed to save user: " + err.message);
        } finally {
            setSubmitting(false); 
        }
    };

    return (
        <div className="admin-user-form-container">
            <h3>{user ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSubmit} className="data-form">
               
                <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter user's name"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter user's email"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="role">Role:</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                    </select>
                </div>

                
                {formError && <p className="error-message">{formError}</p>}

                <div className="form-actions">
                    <button type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : (user ? 'Update User' : 'Add User')}
                    </button>
                    <button type="button" onClick={onClose} disabled={submitting} className="cancel-button">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminUserForm;
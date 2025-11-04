import React, { useState, useEffect } from 'react';

import AdminUserForm from './AdminUserForm'; 
import Modal from '../model/Modal';

const API_BASE_URL = 'http://localhost:5000/api'; 

const AdminUserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); 

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch users: ${response.statusText}`);
            }
            const usersList = await response.json();
            setUsers(usersList);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Failed to fetch users. Please try again: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(); 
    }, []); 

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) {
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete user: ${response.statusText}`);
            }
            setUsers(users.filter(user => user.id !== id));
            alert("User deleted successfully!");
        } catch (err) {
            console.error("Error deleting user:", err);
            alert("Failed to delete user. Please try again: " + err.message);
        }
    };

    const handleEdit = (user) => {
        setCurrentUser(user);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        setCurrentUser(null); 
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        setCurrentUser(null);
        fetchUsers(); 
    };

    if (loading) {
        return <div className="loading-message">Loading users...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="admin-user-list-container">
            <h2>Admin User List</h2>
            <button onClick={handleAdd} className="add-button">Add New User</button>

            {users.length === 0 ? (
                <p>No users found. Click "Add New User" to create one.</p>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.role}</td>
                                <td className="actions-cell">
                                    <button onClick={() => handleEdit(user)} className="edit-button">Edit</button>
                                    <button onClick={() => handleDelete(user.id)} className="delete-button">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {showFormModal && (
                <Modal onClose={handleFormClose}>
                    <AdminUserForm user={currentUser} onClose={handleFormClose} />
                </Modal>
            )}
        </div>
    );
};

export default AdminUserList;
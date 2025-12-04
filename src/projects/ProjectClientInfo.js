import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, PlusCircle, User, Phone, Mail, MapPin, FileText, Users, Trash2 } from 'lucide-react';

import Modal from '../model/Modal';
import ProjectClientForm from '../projects/ProjectClientForm';
import MessageModal from '../model/MessageModal';
import ConfirmModal from '../model/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import authenticatedFetch from '../utils/api';

const ClientList = () => {
    const navigate = useNavigate();

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showFormModal, setShowFormModal] = useState(false);
    const [currentClient, setCurrentClient] = useState(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [clientIdToDelete, setClientIdToDelete] = useState(null);
    const [message, setMessage] = useState(null);

    // 1. Fetch All Clients
    const fetchClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Correct endpoint: /clients (no /all)
            const response = await authenticatedFetch('/clients');

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    navigate('/login');
                    return;
                }
                throw new Error(`Failed to fetch clients: ${response.statusText}`);
            }

            const data = await response.json();
            setClients(data);
        } catch (err) {
            console.error("Error fetching clients:", err);
            setError(err.message || "Failed to load clients.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // Handlers
    const handleAdd = () => {
        setCurrentClient(null);
        setShowFormModal(true);
    };

    const handleEdit = (client) => {
        setCurrentClient(client);
        setShowFormModal(true);
    };

    const handleDeleteClick = (id) => {
        setClientIdToDelete(id);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!clientIdToDelete) return;

        try {
            const response = await authenticatedFetch(`/clients/${clientIdToDelete}`, {
                method: 'DELETE',
            });

            // 404 வந்தால், அது ஏற்கனவே நீக்கப்பட்டுவிட்டது என்று அர்த்தம்.
            // எனவே எரர் காட்டாமல், பட்டியலை ரிப்ரெஷ் செய்தால் போதும்.
            if (response.status === 404) {
                setMessage("Client already deleted. Refreshing list...");
                fetchClients(); // பட்டியலை புதுப்பிக்கவும்
                setShowConfirmModal(false);
                setClientIdToDelete(null);
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete client');
            }

            setMessage("Client deleted successfully!");
            fetchClients(); // Refresh list

        } catch (err) {
            console.error("Delete Error:", err);
            setMessage("Error deleting client: " + err.message);
        } finally {
            setShowConfirmModal(false);
            setClientIdToDelete(null);
        }
    };

    const handleFormClose = () => {
        setShowFormModal(false);
    };

    const handleSaveSuccess = () => {
        setShowFormModal(false);
        fetchClients();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                            <Users className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
                            <p className="text-gray-500 text-sm">Manage your client details here</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                    >
                        <PlusCircle size={20} className="mr-2" />
                        Add New Client
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 shadow-sm text-red-700">
                        <span className="font-bold mr-2">Error:</span> {error}
                    </div>
                )}

                {/* Clients Grid */}
                {clients.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600">No Clients Found</h3>
                        <p className="text-gray-500 mt-2">Start by adding your first client.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clients.map((client) => (
                            <div key={client._id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden flex flex-col">
                                {/* Client Header */}
                                <div className="p-6 flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        {client.photo ? (
                                            <img
                                                src={client.photo}
                                                alt={client.clientName}
                                                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100"
                                                onError={(e) => { e.target.src = "https://placehold.co/64x64?text=User"; }}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center border-2 border-indigo-100">
                                                <User className="h-8 w-8 text-indigo-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-gray-900 truncate">{client.clientId}</h3>
                                        <h3 className="text-lg font-bold text-gray-900 truncate">{client.clientName}</h3>
                                        <p className="text-sm text-gray-500 truncate">{client.email || 'No Email'}</p>
                                        {client.gstNo && (
                                            <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">
                                                GST: {client.gstNo}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Client Details Body */}
                                <div className="px-6 py-4 bg-gray-50 flex-grow space-y-3 border-t border-gray-100">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone className="h-4 w-4 mr-3 text-gray-400" />
                                        {client.phoneNumber}
                                    </div>
                                    <div className="flex items-start text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 mr-3 text-gray-400 mt-0.5" />
                                        <span className="line-clamp-2">{client.address || 'No Address'}</span>
                                    </div>
                                    {client.description && (
                                        <div className="flex items-start text-sm text-gray-600">
                                            <FileText className="h-4 w-4 mr-3 text-gray-400 mt-0.5" />
                                            <span className="line-clamp-2">{client.description}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Footer */}
                                <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-2">
                                    <button
                                        onClick={() => handleEdit(client)}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(client._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modals */}
                {showFormModal && (
                    <Modal onClose={handleFormClose}>
                        <ProjectClientForm
                            client={currentClient}
                            onClose={handleFormClose}
                            onSaveSuccess={handleSaveSuccess}
                        />
                    </Modal>
                )}

                {showConfirmModal && (
                    <ConfirmModal
                        message="Are you sure you want to delete this client? This action cannot be undone."
                        onConfirm={confirmDelete}
                        onCancel={() => setShowConfirmModal(false)}
                    />
                )}

                {message && (
                    <MessageModal
                        message={message}
                        onClose={() => setMessage(null)}
                    />
                )}

            </div>
        </div>
    );
};

export default ClientList;
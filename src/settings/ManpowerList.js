import React, { useState, useEffect } from 'react';
import ManpowerForm from './ManpowerForm';
import Modal from '../model/Modal';
import ConfirmationModal from '../model/ConfirmationModal';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const ManpowerList = () => {
    const [manpower, setManpower] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentManpower, setCurrentManpower] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [manpowerToDelete, setManpowerToDelete] = useState(null);

    const fetchManpower = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("token not found");
            }
            const response = await fetch(API_BASE_URL + '/manpower', { 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `மனிதவள தரவை எடுக்கத் தோல்வி: ${response.statusText}`);
            }
            const manpowerList = await response.json();
            // MongoDB-யின் _id-யை React key-க்காக id ஆக பயன்படுத்துகிறது.
            setManpower(manpowerList.map(entry => ({ ...entry, id: entry._id })));

        } catch (err) {
            console.error("மனிதவள தரவை எடுப்பதில் பிழை:", err);
            setError("மனிதவள தரவை எடுக்கத் தோல்வி. மீண்டும் முயற்சிக்கவும்: " + err.message);
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
            const response = await fetch(API_BASE_URL + '/manpower/' + manpowerToDelete, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `மனிதவள பதிவை நீக்கத் தோல்வி: ${response.statusText}`);
            }
            setManpower(manpower.filter(entry => entry.id !== manpowerToDelete));
            // Success message can be shown here
        } catch (err) {
            console.error("மனிதவள பதிவை நீக்குவதில் பிழை:", err);
            setError("மனிதவள பதிவை நீக்கத் தோல்வி: " + err.message);
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
        fetchManpower(); // Refresh list after form is closed
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Manpower Management</h2>
            <button
                onClick={handleAdd}
                className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
            >
                <PlusCircle className="h-5 w-5 mr-2" /> Add New Manpower
            </button>

            {error && <p className="p-4 text-center text-red-600 font-medium border border-red-300 bg-red-50 rounded-md mb-4">{error}</p>}

            {loading ? (
                <div className="p-4 text-center text-gray-700">மனிதவள தரவு ஏற்றப்படுகிறது...</div>
            ) : manpower.length === 0 ? (
                <p className="text-gray-600 italic">மனிதவள பதிவுகள் எதுவும் இல்லை. ஒன்றை உருவாக்க "Add New Manpower" என்பதைக் கிளிக் செய்யவும்.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-200">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">phoneNumber</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {manpower.map((entry) => (
                                <tr key={entry.id} className="border-b border-gray-200 last:border-b-0">
                                    {/* roleId இப்போது ஒரு object-ஐக் கொண்டுள்ளதால், roleId.name-ஐப் பயன்படுத்துகிறோம் */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.roleId ? entry.roleId.name : entry.roleName || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.phoneNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.description}</td>
                                    <td className="px-4 py-2">
                                        {entry.photo && (
                                            <img src={`http://localhost:5000${entry.photo}`} alt="Manpower" className="w-12 h-12 object-cover" />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(entry)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4 p-1 rounded-full hover:bg-indigo-100 transition duration-200"
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(entry.id)}
                                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition duration-200"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showFormModal && (
                <Modal onClose={handleFormClose}>
                    <ManpowerForm manpower={currentManpower} onClose={handleFormClose} />
                </Modal>
            )}

            {showConfirmModal && (
                <Modal onClose={() => setShowConfirmModal(false)}>
                    <ConfirmationModal
                        title="Delete Manpower"
                        message="நீங்கள் இந்த மனிதவள பதிவை நீக்க விரும்புகிறீர்களா?"
                        onConfirm={handleConfirmDelete}
                        onCancel={() => setShowConfirmModal(false)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ManpowerList;
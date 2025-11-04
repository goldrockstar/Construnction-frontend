import React, { useState, useEffect } from 'react';
import Modal from '../model/Modal';
import ExpenditureForm from './ExpenditureForm';
import { Trash2, Edit, ArrowLeft } from 'lucide-react';
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

    const navigate = useNavigate();

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
                // Set the default selected project ID from the fetched data
                if (projectsData.length > 0) {
                    setSelectedProjectId(projectsData[0]._id);
                    fetchExpendituresByProject(projectsData[0]._id);
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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expenditure record?")) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Token not found. Please log in again.");
            const response = await fetch(`${API_BASE_URL}/expenditures/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to delete expenditure.");
            setExpenditures(expenditures.filter(item => item._id !== id));
            alert("Expenditure deleted successfully!");
        } catch (err) {
            console.error("Error deleting expenditure:", err);
            alert("Failed to delete expenditure: " + err.message);
        }
    };

    const handleEdit = (expenditure) => {
        setCurrentExpenditure(expenditure);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        if (!selectedProjectId) {
            alert("Please select a project before adding an expenditure.");
            return;
        }
        setCurrentExpenditure(null);
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        if (selectedProjectId) {
            fetchExpendituresByProject(selectedProjectId); // Refresh the list
        }
    };

    if (loading) {
        return <div className="loading-message">Loading...</div>;
    }

    if (error) {
        return <div className="error-message text-red-500 text-center mt-8">{error}</div>;
    }

    const handleBackClick = () => {
        navigate(-1);
    };

    return (
        <div className="expenditure-container p-6">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={handleBackClick}
                    className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    title="Go Back"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back
                </button>
                <h2 className="text-3xl font-bold text-gray-800">
                    Expenditures
                </h2>
                <div></div>
            </div>
            <div className="flex justify-between items-center mb-4">
                <select
                    value={selectedProjectId}
                    onChange={handleProjectChange}
                    className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                    <option key="default-project" value="">Select a Project</option>
                    {projects.map(project => (
                        <option key={project._id} value={project._id}>{project.projectName}</option>
                    ))}
                </select>
                <button
                    onClick={handleAdd}
                    className="add-button bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    disabled={!selectedProjectId}
                >
                 Add New Expenditure
                </button>
            </div>

            {expenditures.length === 0 && selectedProjectId ? (
                <p className="no-data-message text-gray-500">No expenditures found for the selected project.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="data-table min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">S.No</th>
                                <th className="py-2 px-4 border-b">Expenditure Type</th>
                                <th className="py-2 px-4 border-b">Name / Manpower</th>
                                <th className="py-2 px-4 border-b">From Date</th>
                                <th className="py-2 px-4 border-b">To Date</th>
                                <th className="py-2 px-4 border-b">Amount</th>
                                {/* <th className="py-2 px-4 border-b">Description</th> */}
                                <th className="py-2 px-4 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenditures.map(item => (
                                <tr key={item._id} className="hover:bg-gray-100">
                                    <td className="py-2 px-4 border-b">{expenditures.indexOf(item) + 1}</td>
                                    <td className="py-2 px-4 border-b">{item.expenditureType}</td>
                                    <td className="py-2 px-4 border-b">{item.expenditureType === 'Salary' ? item.manpowerName : item.expenditureName || 'N/A'}</td>
                                    <td className="py-2 px-4 border-b">{item.fromDate ? new Date(item.fromDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="py-2 px-4 border-b">{item.toDate ? new Date(item.toDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="py-2 px-4 border-b">₹{item.amount.toFixed(2)}</td>
                                    {/* <td className="py-2 px-4 border-b">{item.description || 'N/A'}</td> */}
                                    <td className="actions-cell py-2 px-4 border-b">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="edit-button bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded mr-2"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="delete-button bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                                        >
                                            <Trash2 size={16} />
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
                    <ExpenditureForm
                        expenditure={currentExpenditure}
                        projectId={selectedProjectId}
                        onClose={handleFormClose}
                    />
                </Modal>
            )}
        </div>
    );
};

export default Expenditure;
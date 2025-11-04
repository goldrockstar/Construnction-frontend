// ProjectClientInfo.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Edit, PlusCircle, ArrowLeft, DollarSign } from 'lucide-react';

import Modal from '../model/Modal';
import ProjectClientForm from '../projects/ProjectClientForm';
import MessageModal from '../model/MessageModal';
import LoadingSpinner from '../components/LoadingSpinner';
import authenticatedFetch from '../utils/api';

const ProjectClientInfo = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [clientProjectData, setClientProjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentClient, setCurrentClient] = useState(null);
    const [message, setMessage] = useState(null);

    const initialProjectName = location.state?.projectName || 'Loading Project...';

    const fetchClientProjectData = useCallback(async () => {
        if (!projectId) {
            setError("URL-இல் திட்ட ஐடி இல்லை. கிளையன்ட் தகவலைப் பெற முடியாது.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const response = await authenticatedFetch(`/projects/${projectId}/clients/info`);

            if (response.status === 404) {
                setClientProjectData({ projectName: initialProjectName, client: null });
                setCurrentClient(null);
            } else if (!response.ok) {
                let errorMessage = `கிளையன்ட் தகவலைப் பெற முடியவில்லை: ${response.statusText}`;
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    navigate('/login');
                } else {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) {
                        console.error('பதிலைக் (response) கையாளத் தவறிவிட்டது:', e);
                        errorMessage = `பதிலைக் கையாளத் தவறிவிட்டது: ${response.status}.`;
                    }
                }
                throw new Error(errorMessage);
            } else {
                const data = await response.json();
                setClientProjectData({
                    projectName: initialProjectName,
                    client: data,
                    totalCost: null 
                });
                setCurrentClient(data);
            }

        } catch (err) {
            console.error("கிளையன்ட் தகவலைப் பெறும்போது பிழை:", err);
            setError(err.message || "கிளையன்ட் தகவலைப் பெறும்போது எதிர்பாராத பிழை ஏற்பட்டது.");
        } finally {
            setLoading(false);
        }
    }, [projectId, navigate, initialProjectName]);
    useEffect(() => {
        fetchClientProjectData();
    }, [fetchClientProjectData]);

    const handleEdit = () => {
        if (clientProjectData && clientProjectData.client) {
            setCurrentClient(clientProjectData.client);
            setShowFormModal(true);
        } else {
            setMessage("கிளையன்டைத் திருத்த முடியாது. கிளையன்ட் தகவல் இல்லை.");
        }
    };

    const handleAdd = () => {
        setCurrentClient(null); 
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
    };

    const handleSaveSuccess = () => {
        setShowFormModal(false);
        fetchClientProjectData(); 
    }

    const navigateToTransaction = () => {
        if (projectId && clientProjectData?.client) {
            navigate(`/projects/${projectId}/transactions`, {
                state: {
                    clientName: clientProjectData.client.clientName || 'N/A',
                    projectName: clientProjectData.projectName || initialProjectName,
                    totalBudget: clientProjectData?.totalCost || 0
                }
            });
        } else {
            setMessage("பரிவர்த்தனைகளுக்கு செல்ல முடியாது: கிளையன்ட் அல்லது திட்ட ஐடி கிடைக்கவில்லை.");
        }
    };

    const handleBackClick = () => {
        navigate(-1);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500 font-semibold">பிழை: {error}</div>;
    }

    const displayClient = clientProjectData?.client || null;

    return (
        <div className="p-6 bg-white rounded-lg shadow-md min-h-screen">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={handleBackClick}
                    className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                    <ArrowLeft size={20} className="mr-2" /> திட்டங்களுக்குத் திரும்பு
                </button>
                <h2 className="text-2xl font-semibold text-gray-800">திட்டத்திற்கான கிளையன்ட் தகவல்: {clientProjectData?.projectName || initialProjectName}</h2>
                <div></div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                    <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setError(null)}>
                        <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" /></svg>
                    </span>
                </div>
            )}
            {!displayClient ? (
                <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                    <p className="text-gray-600 italic">இந்த திட்டத்திற்கு கிளையன்ட் தகவல் இல்லை. கீழே ஒரு கிளையன்ட்டைச் சேர்க்கவும்.</p>
                    <button
                        onClick={handleAdd}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                    >
                        <PlusCircle size={16} className="mr-1" /> Add Client
                    </button>
                </div>
            ) : (
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-6 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                    {displayClient.photo && (
                        <div className="flex-shrink-0">
                            <img
                                src={displayClient.photo}
                                alt={`${displayClient.clientName} இன் படம்`}
                                className="w-24 h-24 object-cover rounded-full shadow-md"
                            />
                        </div>
                    )}
                    <div className="flex-grow text-center md:text-left">
                        <h3 className="text-xl font-medium text-gray-800 mb-2">விவரங்கள்:</h3>
                        <p className="text-gray-700"><strong>Client Name:</strong> {displayClient.clientName || 'N/A'}</p>
                        <p className="text-gray-700"><strong>Phone Number:</strong> {displayClient.phoneNumber || 'N/A'}</p>
                        <p className="text-gray-700"><strong>Email:</strong> {displayClient.email || 'N/A'}</p>
                        <p className="text-gray-700"><strong>Address:</strong> {displayClient.address || 'N/A'}</p>
                        <p className="text-gray-700"><strong>Description:</strong> {displayClient.description || 'N/A'}</p>
                        <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <button
                                onClick={handleEdit}
                                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center"
                            >
                                <Edit size={16} className="mr-1" /> Edit
                            </button>
                            <button
                                onClick={navigateToTransaction}
                                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center"
                            >
                                <DollarSign size={16} className="mr-1" /> Transactions
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showFormModal && (
                <Modal onClose={handleFormClose}>
                    <ProjectClientForm
                        client={currentClient}
                        projectId={projectId}
                        onClose={handleFormClose}
                        onSaveSuccess={handleSaveSuccess}
                    />
                </Modal>
            )}
            {message && (
                <MessageModal
                    message={message}
                    onClose={() => setMessage(null)}
                />
            )}
        </div>
    );
};

export default ProjectClientInfo;

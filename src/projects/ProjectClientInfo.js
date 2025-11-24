import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Edit, PlusCircle, ArrowLeft, DollarSign, User, Phone, Mail, MapPin, FileText, Building2, Users } from 'lucide-react';

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
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md w-full">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">!</span>
                            </div>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-red-800 font-semibold">Error</h3>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const displayClient = clientProjectData?.client || null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleBackClick}
                            className="flex items-center px-4 py-3 bg-white text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md border border-indigo-100"
                        >
                            <ArrowLeft size={20} className="mr-2" /> Back to Projects
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                <Users className="h-8 w-8 mr-3 text-indigo-600" />
                                Client Information
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Project: {clientProjectData?.projectName || initialProjectName}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Client Information Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {!displayClient ? (
                        <div className="p-12 text-center">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                <User className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-3">No Client Information</h3>
                            <p className="text-gray-500 mb-6">This project doesn't have any client information yet.</p>
                            <button
                                onClick={handleAdd}
                                className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl mx-auto"
                            >
                                <PlusCircle size={20} className="mr-2" />
                                Add Client Information
                            </button>
                        </div>
                    ) : (
                        <div className="p-8">
                            {/* Client Header with Photo */}
                            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-8">
                                {displayClient.photo && (
                                    <div className="flex-shrink-0">
                                        <img
                                            src={displayClient.photo}
                                            alt={`${displayClient.clientName}'s photo`}
                                            className="w-32 h-32 object-cover rounded-2xl shadow-lg border-4 border-white"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://placehold.co/128x128?text=No+Photo";
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center md:justify-start">
                                        <User className="h-6 w-6 mr-2 text-indigo-600" />
                                        {displayClient.clientName || 'N/A'}
                                    </h2>
                                    {displayClient.description && (
                                        <p className="text-gray-600 italic mb-4">{displayClient.description}</p>
                                    )}
                                    
                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                                        <button
                                            onClick={handleEdit}
                                            className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                                        >
                                            <Edit size={18} className="mr-2" />
                                            Edit Client
                                        </button>
                                        <button
                                            onClick={navigateToTransaction}
                                            className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                                        >
                                            <DollarSign size={18} className="mr-2" />
                                            View Transactions
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Client Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contact Information */}
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Phone className="h-5 w-5 mr-2 text-blue-600" />
                                        Contact Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center text-gray-700">
                                            <Phone className="h-4 w-4 mr-3 text-gray-500" />
                                            <span className="font-medium">Phone:</span>
                                            <span className="ml-2">{displayClient.phoneNumber || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center text-gray-700">
                                            <User className="h-4 w-4 mr-3 text-gray-500" />
                                            <span className="font-medium">Gst No:</span>
                                            <span className="ml-2">{displayClient.gstNo || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center text-gray-700">
                                            <Mail className="h-4 w-4 mr-3 text-gray-500" />
                                            <span className="font-medium">Email:</span>
                                            <span className="ml-2">{displayClient.email || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Address Information */}
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <MapPin className="h-5 w-5 mr-2 text-green-600" />
                                        Address
                                    </h3>
                                    <div className="flex items-start text-gray-700">
                                        <MapPin className="h-4 w-4 mr-3 text-gray-500 mt-1 flex-shrink-0" />
                                        <span>{displayClient.address || 'No address provided'}</span>
                                    </div>
                                </div>

                                {/* Additional Information */}
                                {displayClient.description && (
                                    <div className="md:col-span-2 bg-gray-50 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <FileText className="h-5 w-5 mr-2 text-purple-600" />
                                            Additional Information
                                        </h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            {displayClient.description}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Project Summary */}
                            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                    <Building2 className="h-5 w-5 mr-2 text-indigo-600" />
                                    Project Summary
                                </h3>
                                <div className="flex items-center text-gray-700">
                                    <span className="font-medium">Project Name:</span>
                                    <span className="ml-2 text-gray-900 font-semibold">
                                        {clientProjectData?.projectName || initialProjectName}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modals */}
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
        </div>
    );
};

export default ProjectClientInfo;
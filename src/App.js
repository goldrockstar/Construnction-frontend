import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

// Component Imports
// FIX: Added .jsx extension to all local component imports
import Sidebar from './components/Sidebar.js';
import TopBar from './components/Topbar.js'; 
import Login from './components/Login.js';
import DashboardContent from './components/Dashboard.js';

// Settings
import RoleList from './settings/RoleList.js';
import RoleForm from './settings/RoleForm.js';
import MaterialList from './settings/MaterialList.js';
import MaterialForm from './settings/MaterialForm.js';
import ManpowerList from './settings/ManpowerList.js';
import ManpowerForm from './settings/ManpowerForm.js';
import Profile from './settings/Profile.js';

// Projects
import ProjectList from './projects/ProjectList.js';
import ProjectForm from './projects/ProjectForm.js';
import ProjectClientInfo from './projects/ProjectClientInfo.js';
import SalaryConfig from './projects/SalaryConfig.js';
import ProjectMaterialMapping from './projects/ProjectMaterialMapping.js';
import ProjectMaterialUsage from './projects/ProjectMaterialUsage.js';
import Expenditure from './components/Expenditure.js';
import ProjectAmountTransaction from './projects/ProjectAmountTransaction.js';
import Quotation from './projects/Quotation.js';
import Invoice from './projects/Invoice.js';
import PersonalExpenditure from './components/PersonalExpenditure.js';

import SalaryReport from './reports/SalaryReport.js';
import StockReport from './reports/StockReport.js';
import ProfitLossReport from './reports/ProfitLossReport.js';

import Receipt from './components/Receipt.js';
import PrintReceipt from './components/PrintReceipt.jsx';
import InvoicePrint from './components/InvoicePrintPage';
import QuotationPrint from './components/QuotationPrintPage.js';

// API base URL
const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [hasProfile, setHasProfile] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState({ name: 'User', role: 'Administrator' });

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        const userName = localStorage.getItem('userName') || 'User';
        
        if (token && role) {
            setIsLoggedIn(true);
            setCurrentUserRole(role);
            setCurrentUser(prev => ({ ...prev, name: userName, role: role }));
            checkProfileStatus(token);
        } else {
            navigate('/login');
        }
    }, []);

    const checkProfileStatus = async (token) => {
        // NOTE: In a real app, ensure API call handles exponential backoff/retries.
        try {
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 404) {
                setHasProfile(false);
                navigate('/create-profile');
            } else if (response.ok) {
                setHasProfile(true);
                // Only navigate to dashboard if we are currently on login or create-profile page
                if (['/login', '/create-profile'].includes(window.location.pathname)) {
                    navigate('/dashboard');
                }
            } else {
                handleLogout();
            }
        } catch (error) {
            // console.error("Profile check error:", error);
            handleLogout();
        }
    };

    const handleLoginSuccess = (role, userName) => {
        setIsLoggedIn(true);
        setCurrentUserRole(role);
        setCurrentUser({ name: userName || 'User', role: role });
        const token = localStorage.getItem('token');
        if (token) {
            checkProfileStatus(token);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        setIsLoggedIn(false);
        setCurrentUserRole(null);
        setHasProfile(null);
        setSidebarOpen(false);
        navigate('/login');
    };

    const handleProfileSaved = () => {
        setHasProfile(true);
        navigate('/dashboard');
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex min-h-screen w-full bg-gray-100">
            {/* Sidebar Container: Removed onLogout prop */}
            {isLoggedIn && hasProfile && (
                <div className={`fixed inset-y-0 left-0 transform ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 lg:static transition-transform duration-300 z-50`}>
                    
                    <Sidebar
                        // onLogout={handleLogout} // REMOVED: Logout is now in TopBar
                        currentUserRole={currentUserRole}
                    />
                </div>
            )}
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen">
                
                {/* TopBar - Added onLogout prop here */}
                {isLoggedIn && hasProfile && (
                    <TopBar 
                        onToggleSidebar={toggleSidebar}
                        currentUser={currentUser}
                        onLogout={handleLogout} // ADDED: Logout is now handled by the TopBar
                    />
                )}
                
                {/* Main Content */}
                <main className={`flex-1 overflow-auto ${isLoggedIn && hasProfile ? 'p-6' : ''}`}>
                    {/* Overlay to close sidebar on mobile */}
                    {isLoggedIn && hasProfile && sidebarOpen && (
                        <div 
                            className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden"
                            onClick={toggleSidebar}
                        ></div>
                    )}

                    <Routes>
                        {/* Public routes - always accessible */}
                        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
                        <Route path="/create-profile" element={<Profile onProfileSaved={handleProfileSaved} />} />
                        <Route path="/print-receipt/:id" element={<PrintReceipt />} />

                        {/* Protected routes */}
                        {isLoggedIn && hasProfile ? (
                            <>
                                <Route path="/dashboard" element={<DashboardContent currentUserRole={currentUserRole} />} />
                                <Route path="/roles" element={<RoleList />} />
                                <Route path="/roles/add" element={<RoleForm />} />
                                <Route path="/roles/edit/:id" element={<RoleForm />} />
                                <Route path="/materials" element={<MaterialList />} />
                                <Route path="/materials/add" element={<MaterialForm />} />
                                <Route path="/materials/edit/:id" element={<MaterialForm />} />
                                <Route path="/manpower" element={<ManpowerList />} />
                                <Route path="/manpower/add" element={<ManpowerForm />} />
                                <Route path="/manpower/edit/:id" element={<ManpowerForm />} />
                                <Route path="/projects" element={<ProjectList />} />
                                <Route path="/projects/add" element={<ProjectForm />} />
                                <Route path="/projects/edit/:id" element={<ProjectForm />} />
                                <Route path="/clientinfo" element={<ProjectClientInfo />} />
                                <Route path="/materialmapping" element={<ProjectMaterialMapping />} />
                                <Route path="/materialusage" element={<ProjectMaterialUsage />} />
                                <Route path="/expenditure" element={<Expenditure />} />
                                <Route path="/salary-config" element={<SalaryConfig />} />
                                <Route path="/transactions" element={<ProjectAmountTransaction />} />
                                <Route path="/quotation" element={<Quotation />} />
                                <Route path="/quotations/print/:id" element={<QuotationPrint />} />
                                <Route path="/invoices/:invoiceId" element={<Invoice />} />
                                <Route path="/invoices/print/:id" element={<InvoicePrint />} />
                                <Route path="/personal-expenditure" element={<PersonalExpenditure />} />
                                <Route path="/salary-report" element={<SalaryReport />} />
                                <Route path="/stock-report" element={<StockReport />} />
                                <Route path="/profit-loss-report" element={<ProfitLossReport />} />
                                <Route path="/receipt" element={<Receipt />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/" element={<DashboardContent currentUserRole={currentUserRole} />} />
                            </>
                        ) : (
                            <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
                        )}
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const RootApp = () => (
    <BrowserRouter>
        <App />
    </BrowserRouter>
);

export default RootApp;
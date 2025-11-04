import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Login from './components/Login';
import DashboardContent from './components/Dashboard';

// Settings
import RoleList from './settings/RoleList';
import RoleForm from './settings/RoleForm';
import MaterialList from './settings/MaterialList';
import MaterialForm from './settings/MaterialForm';
import ManpowerList from './settings/ManpowerList';
import ManpowerForm from './settings/ManpowerForm';
import Profile from './settings/Profile';

// Projects
import ProjectList from './projects/ProjectList';
import ProjectForm from './projects/ProjectForm';
import ProjectClientInfo from './projects/ProjectClientInfo';
import SalaryConfig from './projects/SalaryConfig';
import ProjectMaterialMapping from './projects/ProjectMaterialMapping';
import ProjectMaterialUsage from './projects/ProjectMaterialUsage';
import Expenditure from './components/Expenditure';
import ProjectAmountTransaction from './projects/ProjectAmountTransaction';
import Quotation from './projects/Quotation';
import Invoice from './projects/Invoice';
import PersonalExpenditure from './components/PersonalExpenditure';

import SalaryReport from './reports/SalaryReport';
import StockReport from './reports/StockReport';
import ProfitLossReport from './reports/ProfitLossReport';

import Receipt from './components/Receipt';
import PrintReceipt from './components/PrintReceipt';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [hasProfile, setHasProfile] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (token && role) {
            setIsLoggedIn(true);
            setCurrentUserRole(role);
            checkProfileStatus(token);
        } else {
            navigate('/login');
        }
    }, []);

    const checkProfileStatus = async (token) => {
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
                navigate('/dashboard');
            } else {
                handleLogout();
            }
        } catch (error) {
            handleLogout();
        }
    };

    const handleLoginSuccess = (role) => {
        setIsLoggedIn(true);
        setCurrentUserRole(role);
        const token = localStorage.getItem('token');
        if (token) {
            checkProfileStatus(token);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        setIsLoggedIn(false);
        setCurrentUserRole(null);
        setHasProfile(null);
        navigate('/login');
    };

    const handleProfileSaved = () => {
        setHasProfile(true);
        navigate('/dashboard');
    };

    return (
        <div className="flex min-h-screen w-full bg-gray-100">
            {isLoggedIn && hasProfile && (
                <Sidebar
                    onLogout={handleLogout}
                    currentUserRole={currentUserRole}
                />
            )}
            <main className="flex-1 flex flex-col">
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
                            <Route path="/projects/:projectId/clientinfo" element={<ProjectClientInfo />} />
                            <Route path="/projects/:projectId/materialmapping" element={<ProjectMaterialMapping />} />
                            <Route path="/projects/:projectId/materialusage" element={<ProjectMaterialUsage />} />
                            <Route path="/projects/:projectId/expenditure" element={<Expenditure />} />
                            <Route path="/projects/:projectId/salary-config" element={<SalaryConfig />} />
                            <Route path="/projects/:projectId/transactions" element={<ProjectAmountTransaction />} />
                            <Route path="/clients/:projectId/transactions" element={<ProjectAmountTransaction />} />
                            <Route path="/quotation" element={<Quotation />} />
                            <Route path="/invoices/:invoiceId" element={<Invoice />} />
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
    );
};

const RootApp = () => (
    <BrowserRouter>
        <App />
    </BrowserRouter>
);

export default RootApp;

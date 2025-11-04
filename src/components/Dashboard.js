import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FolderOpen, CheckCircle, PiggyBank, TrendingUp } from 'lucide-react';

import AdminUserList from '../admin/AdminUserList';

import RoleList from '../settings/RoleList';
import MaterialList from '../settings/MaterialList';
import ManpowerList from '../settings/ManpowerList';
import ProjectList from '../projects/ProjectList';
import ProjectClientInfo from '../projects/ProjectClientInfo';
import ProjectAmountTransaction from '../projects/ProjectAmountTransaction';
import ProjectMaterialMapping from '../projects/ProjectMaterialMapping';
import ProjectMaterialUsage from '../projects/ProjectMaterialUsage';
import Expenditure from './Expenditure';
import PersonalExpenditure from './PersonalExpenditure';

import Receipt from './Receipt';
import Quotation from '../projects/Quotation';
import Invoice from '../projects/Invoice';
import SalaryConfig from '../projects/SalaryConfig';

import Profile from '../settings/Profile';
import SalaryReport from '../reports/SalaryReport';
import StockReport from '../reports/StockReport';
import ProfitLossReport from '../reports/ProfitLossReport';


const chartData = [
    { name: 'ஜனவரி', value: 65 },
    { name: 'பிப்ரவரி', value: 59 },
    { name: 'மார்ச்', value: 80 },
    { name: 'ஏப்ரல்', value: 81 },
    { name: 'மെയ്', value: 56 },
    { name: 'ஜூன்', value: 55 },
    { name: 'ஜூலை', value: 40 },
    { name: 'ஆகஸ்ட்', value: 60 },
    { name: 'செப்டம்பர்', value: 70 },
    { name: 'ஒக்டோபர்', value: 75 },
    { name: 'நவம்பர்', value: 68 },
    { name: 'டிசம்பர்', value: 72 },
];

const Dashboard = ({ activeSection, setActiveSection }) => {
    const [selectedYear, setSelectedYear] = useState('2024');
    const [showProfile, setShowProfile] = useState(false);
    
    useEffect(() => {
    }, []);

    const renderSectionContent = () => {
        if (showProfile) {
            return <Profile />;
        }

        switch (activeSection) {
            case 'overview':
                return (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-800">டேஷ்போர்டு</h1>
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-600">கலாவணி டி</span>
                                <div 
                                    className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold cursor-pointer"
                                    onClick={() => setShowProfile(true)}
                                >
                                    <img
                                        src="https://placehold.co/40x40/cccccc/333333?text=KT"
                                        alt="User Avatar"
                                        className="rounded-full"
                                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/cccccc/333333?text=KT"; }}
                                    />
                                </div>
                            </div>
                        </div>

                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            
                            <div className="bg-card-bg p-6 rounded-lg shadow-custom flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">புரொஜெக்ட்ஸ்</p>
                                    <h2 className="text-3xl font-bold text-gray-800">0</h2>
                                </div>
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                    <FolderOpen size={28} />
                                </div>
                            </div>

                            
                            <div className="bg-card-bg p-6 rounded-lg shadow-custom flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">முடிந்த புரொஜெக்ட்ஸ்</p>
                                    <h2 className="text-3xl font-bold text-gray-800">0</h2>
                                </div>
                                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                                    <CheckCircle size={28} />
                                </div>
                            </div>

                            
                            <div className="bg-card-bg p-6 rounded-lg shadow-custom flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">மொத்த வருமானம்</p>
                                    <h2 className="text-3xl font-bold text-gray-800">₹ 0</h2>
                                </div>
                                <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
                                    <PiggyBank size={28} />
                                </div>
                            </div>

                            
                            <div className="bg-card-bg p-6 rounded-lg shadow-custom flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">மொத்த பயன்பாடு</p>
                                    <h2 className="text-3xl font-bold text-gray-800">₹ 0</h2>
                                </div>
                                <div className="p-3 bg-red-100 text-red-600 rounded-full">
                                    <TrendingUp size={28} />
                                </div>
                            </div>
                        </div>

                        
                        <div className="bg-card-bg p-6 rounded-lg shadow-custom">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">எனது முதல் தரவுத்தொகுப்பு</h3>
                                <div className="flex items-center space-x-2">
                                    <label htmlFor="year-select" className="text-gray-600 text-sm">ஆண்டைத் தேர்ந்தெடுக்கவும்</label>
                                    <select
                                        id="year-select"
                                        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                    >
                                        <option value="2024">2024</option>
                                        <option value="2023">2023</option>
                                        <option value="2022">2022</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={chartData}
                                        margin={{
                                            top: 5,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis dataKey="name" stroke="#6b7280" />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }}
                                            labelStyle={{ color: '#333', fontWeight: 'bold' }}
                                            itemStyle={{ color: '#555' }}
                                        />
                                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                );
            case 'settings-roles':
                return <RoleList />;
            case 'settings-materials':
                return <MaterialList />;
            case 'settings-manpower':
                return <ManpowerList />;
            case 'settings-profile':
                return <Profile />;
            case 'projects-list':
                return <ProjectList />;
            case 'projects-client-info':
                return <ProjectClientInfo />;
            case 'projects-amount-transaction':
                return <ProjectAmountTransaction />;
            case 'projects-material-mapping':
                return <ProjectMaterialMapping />;
            case 'projects-material-usage':
                return <ProjectMaterialUsage />;
            case 'projects-salary-config':
                return <SalaryConfig />;
            case 'projects-quotation':
                return <Quotation />;
            case 'projects-invoice':
                return <Invoice />;
            case 'expenditure':
                return <Expenditure />;
            case 'personal-expenditure':
                return <PersonalExpenditure />;
            case 'reports-SalaryReport':
                return <SalaryReport />;
            case 'reports-StockReport':
                return <StockReport />;
            case 'reports-ProfitLossReport':
                return <ProfitLossReport />;
            case 'receipt':
                return <Receipt />;
            case 'admin-users':
                return <AdminUserList />;
            default:
                return (
                    <div className="flex-1 p-8 bg-dashboard-bg flex items-center justify-center text-gray-600 text-xl">
                        <p>பிரிவு காணப்படவில்லை: {activeSection}</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex-1 p-8 bg-dashboard-bg overflow-y-auto">
            {renderSectionContent()}
        </div>
    );
};

export default Dashboard;
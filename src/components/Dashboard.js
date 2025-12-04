import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, } from 'recharts';
import {
    FolderOpen, CheckCircle, TrendingUp, TrendingDown, RefreshCw,
    ChevronDown, ChevronUp, DollarSign, FileText,Target, Award, Clock,
    Download, Eye, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

// Helper function to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch {
        return 'Invalid Date';
    }
};

// Tamil Month Names
const tamilMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Dashboard = ({ activeSection = 'overview', setActiveSection }) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [timeRange, setTimeRange] = useState('monthly');

    // --- Dashboard States ---
    const [stats, setStats] = useState({
        totalProjects: 0,
        completedProjects: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        totalBudget: 0,
        totalProfitLoss: 0,
        activeProjects: 0,
        pendingInvoices: 0
    });

    const [chartData, setChartData] = useState([]);
    const [ setRevenueData] = useState([]);

    // --- Dropdown List States ---
    const [projectsDetailList, setProjectsDetailList] = useState([]);
    const [incomesDetailList, setIncomesDetailList] = useState([]);
    const [expensesDetailList, setExpensesDetailList] = useState([]);

    // --- Dropdown Toggle States ---
    const [isProjectsDropdownOpen, setIsProjectsDropdownOpen] = useState(false);
    const [isIncomesDropdownOpen, setIsIncomesDropdownOpen] = useState(false);
    const [isExpensesDropdownOpen, setIsExpensesDropdownOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    // --- Data Fetching Logic ---
    useEffect(() => {
        if (!activeSection || activeSection === 'overview' || activeSection === 'dashboard') {
            fetchDashboardData();
        }
    }, [activeSection, selectedYear, timeRange]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

            // Fetch Projects
            const projectsRes = await fetch(`${API_BASE_URL}/projects`, { headers });
            const projectsData = await projectsRes.json();

            let projectsList = [];
            if (Array.isArray(projectsData)) projectsList = projectsData;
            else if (projectsData.projects) projectsList = projectsData.projects;

            const totalProjects = projectsList.length;
            const completedProjects = projectsList.filter(p => p.projectStatus === 'Completed').length;
            const activeProjects = projectsList.filter(p => p.projectStatus === 'In Progress').length;
            const totalBudget = projectsList.reduce((sum, p) => sum + (parseFloat(p.estimatedBudget) || 0), 0);

            setProjectsDetailList(projectsList);

            // Fetch Invoices
            const invoicesRes = await fetch(`${API_BASE_URL}/invoices`, { headers });
            const invoicesData = await invoicesRes.json();
            const pendingInvoices = invoicesData.filter(inv => new Date(inv.dueDate) > new Date()).length;

            // Fetch Transactions
            let totalExpenses = 0;
            let totalIncomeFromTransactions = 0;
            let allExpenses = [];
            let allIncomes = [];

            const transactionPromises = projectsList.map(project =>
                fetch(`${API_BASE_URL}/transactions/summary/${project._id}`, { headers })
                    .then(res => res.json())
                    .catch(err => ({ summary: { totalExpense: 0, totalIncome: 0 }, allTransactions: [] }))
            );

            const summaries = await Promise.all(transactionPromises);

            summaries.forEach((data, index) => {
                if (data && data.summary) {
                    totalExpenses += (parseFloat(data.summary.totalExpense) || 0);
                    totalIncomeFromTransactions += (parseFloat(data.summary.totalIncome) || 0);
                }

                if (data && data.allTransactions && Array.isArray(data.allTransactions)) {
                    const projectExpenses = data.allTransactions
                        .filter(t => t.type === 'Expense')
                        .map(t => ({
                            ...t,
                            projectName: projectsList[index]?.projectName || 'Unknown Project'
                        }));
                    allExpenses = [...allExpenses, ...projectExpenses];

                    const projectIncomes = data.allTransactions
                        .filter(t => t.type === 'Income')
                        .map(t => ({
                            ...t,
                            projectName: projectsList[index]?.projectName || 'Unknown Project'
                        }));
                    allIncomes = [...allIncomes, ...projectIncomes];
                }
            });

            allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
            allIncomes.sort((a, b) => new Date(b.date) - new Date(a.date));

            setExpensesDetailList(allExpenses);
            setIncomesDetailList(allIncomes);

            const totalRevenue = totalIncomeFromTransactions;
            const totalProfitLoss = totalRevenue - totalExpenses;

            setStats({
                totalProjects,
                completedProjects,
                totalRevenue,
                totalExpenses,
                totalBudget,
                totalProfitLoss,
                activeProjects,
                pendingInvoices
            });

            // Generate Chart Data
            generateChartData(allIncomes, allExpenses, selectedYear);
            generateRevenueData(allIncomes, timeRange);

        } catch (error) {
            console.error("Error loading dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (incomes, expenses, year) => {
        let monthlyStats = tamilMonths.map(name => ({
            name,
            income: 0,
            expense: 0,
            profit: 0
        }));

        incomes.forEach(income => {
            const d = new Date(income.date);
            if (!isNaN(d) && d.getFullYear().toString() === year) {
                monthlyStats[d.getMonth()].income += (parseFloat(income.amount) || 0);
            }
        });

        expenses.forEach(exp => {
            const d = new Date(exp.date);
            if (!isNaN(d) && d.getFullYear().toString() === year) {
                monthlyStats[d.getMonth()].expense += (parseFloat(exp.amount) || 0);
            }
        });

        monthlyStats = monthlyStats.map(month => ({
            ...month,
            profit: month.income - month.expense
        }));

        setChartData(monthlyStats);
    };

    const generateRevenueData = (incomes, range) => {
        const data = [
            { name: 'Q1', revenue: 450000, target: 500000 },
            { name: 'Q2', revenue: 620000, target: 600000 },
            { name: 'Q3', revenue: 580000, target: 650000 },
            { name: 'Q4', revenue: 710000, target: 700000 },
        ];
        setRevenueData(data);
    };

    const toggleDropdown = (dropdown) => {
        setIsProjectsDropdownOpen(dropdown === 'projects' ? !isProjectsDropdownOpen : false);
        setIsIncomesDropdownOpen(dropdown === 'incomes' ? !isIncomesDropdownOpen : false);
        setIsExpensesDropdownOpen(dropdown === 'expenses' ? !isExpensesDropdownOpen : false);
    };

    // Stylish Stat Card Component
    const StatCard = ({ title, value, icon: Icon, color, change, onClick, isDropdownOpen }) => (
        <div
            onClick={onClick}
            className={`bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${isDropdownOpen ? 'ring-2 ring-blue-500' : ''
                }`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider">{title}</p>
                    <h2 className="text-3xl font-bold text-gray-800 mt-2">{value}</h2>
                    {change && (
                        <div className={`flex items-center mt-2 text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {change > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            <span className="ml-1">{Math.abs(change)}%</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${color} shadow-lg`}>
                    <Icon size={24} className="text-white" />
                </div>
            </div>
            {onClick && (
                <div className="flex items-center justify-between text-xs text-blue-600 font-semibold mt-4 pt-3 border-t border-gray-100">
                    <span>View Details</span>
                    {isDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
            )}
        </div>
    );

    const renderSectionContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center h-96">
                    <div className="text-center">
                        <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg font-medium">Loading Dashboard...</p>
                        <p className="text-gray-500 text-sm">Crunching the numbers</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Business Overview</h1>
                        <p className="text-gray-600 mt-2">Welcome to your construction business dashboard</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select
                            className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                            <option value="2025">2025</option>
                        </select>
                        <select
                            className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                        >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Projects"
                        value={stats.totalProjects}
                        icon={FolderOpen}
                        color="bg-blue-500"
                        change={12}
                        onClick={() => toggleDropdown('projects')}
                        isDropdownOpen={isProjectsDropdownOpen}
                    />

                    <StatCard
                        title="Total Revenue"
                        value={`₹${stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                        icon={TrendingUp}
                        color="bg-green-500"
                        change={8}
                        onClick={() => toggleDropdown('incomes')}
                        isDropdownOpen={isIncomesDropdownOpen}
                    />

                    <StatCard
                        title="Total Expenses"
                        value={`₹${stats.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                        icon={TrendingDown}
                        color="bg-red-500"
                        change={-5}
                        onClick={() => toggleDropdown('expenses')}
                        isDropdownOpen={isExpensesDropdownOpen}
                    />

                    <StatCard
                        title={stats.totalProfitLoss >= 0 ? 'Net Profit' : 'Net Loss'}
                        value={`₹${Math.abs(stats.totalProfitLoss).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                        icon={stats.totalProfitLoss >= 0 ? Award : Target}
                        color={stats.totalProfitLoss >= 0 ? 'bg-emerald-500' : 'bg-orange-500'}
                        change={stats.totalProfitLoss >= 0 ? 15 : -10}
                    />
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Active Projects"
                        value={stats.activeProjects}
                        icon={Clock}
                        color="bg-purple-500"
                        change={5}
                    />

                    <StatCard
                        title="Completed"
                        value={stats.completedProjects}
                        icon={CheckCircle}
                        color="bg-teal-500"
                        change={20}
                    />

                    <StatCard
                        title="Total Budget"
                        value={`₹${stats.totalBudget.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                        icon={DollarSign}
                        color="bg-indigo-500"
                        change={10}
                    />

                    <StatCard
                        title="Pending Invoices"
                        value={stats.pendingInvoices}
                        icon={FileText}
                        color="bg-amber-500"
                        change={-3}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                    {/* Financial Performance Chart */}
                    <div className="bg-white/100 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                                Financial Performance
                            </h3>
                            <div className="flex items-center space-x-2">
                                <Eye className="w-4 h-4 text-gray-400 cursor-pointer" />
                                <Download className="w-4 h-4 text-gray-400 cursor-pointer" />
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                                    <YAxis stroke="#6b7280" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                            padding: '12px'
                                        }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="income"
                                        name="Income"
                                        stroke="#10b981"
                                        fill="#10b981"
                                        fillOpacity={0.1}
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expense"
                                        name="Expense"
                                        stroke="#ef4444"
                                        fill="#ef4444"
                                        fillOpacity={0.1}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenue vs Target Chart */}
                    {/* <div className="bg-white/100 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center mb-6">
                            <Target className="w-5 h-5 mr-2 text-orange-600" />
                            Revenue vs Target
                        </h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" stroke="#6b7280" />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="revenue" name="Actual Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="target" name="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div> */}
                </div>

                {/* Dropdown Sections */}
                {isProjectsDropdownOpen && (
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden animate-fade-in">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                            <h3 className="text-lg font-bold flex items-center">
                                <FolderOpen className="w-5 h-5 mr-2" />
                                Project Details
                            </h3>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Budget</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {projectsDetailList.slice(0, 8).map((project) => (
                                        <tr key={project._id} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{project.projectName}</td>
                                            <td className="px-6 py-4 text-gray-600">{project.client?.clientName || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${project.projectStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                                                        project.projectStatus === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {project.projectStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-600">
                                                ₹{parseFloat(project.estimatedBudget || 0).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {isIncomesDropdownOpen && (
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden animate-fade-in">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-white">
                            <h3 className="text-lg font-bold flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2" />
                                Income Transactions
                            </h3>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {incomesDetailList.slice(0, 8).map((inc, index) => (
                                        <tr key={inc.id || index} className="hover:bg-green-50/50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600">{formatDate(inc.date)}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{inc.projectName}</td>
                                            <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{inc.description || inc.source}</td>
                                            <td className="px-6 py-4 text-right font-bold text-green-600">
                                                ₹{parseFloat(inc.amount || 0).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {isExpensesDropdownOpen && (
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden animate-fade-in">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white">
                            <h3 className="text-lg font-bold flex items-center">
                                <TrendingDown className="w-5 h-5 mr-2" />
                                Expense Details
                            </h3>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {expensesDetailList.slice(0, 8).map((exp, index) => (
                                        <tr key={exp.id || index} className="hover:bg-red-50/50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600">{formatDate(exp.date)}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{exp.projectName}</td>
                                            <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{exp.description || exp.source}</td>
                                            <td className="px-6 py-4 text-right font-bold text-red-600">
                                                ₹{parseFloat(exp.amount || 0).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-y-auto">
            {renderSectionContent()}
        </div>
    );
};

export default Dashboard;
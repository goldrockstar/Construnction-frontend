import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Calendar, Briefcase, ArrowUpCircle, ArrowDownCircle, ChevronDown, ChevronUp, Download, Filter, PieChart, BarChart3, Target, Award, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const safeParseFloat = (value) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
};

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

const useDataFetcher = (url, dependencies, runCondition = true) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!runCondition) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Token not found. Please log in.');

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch data from ${url}. Status: ${response.statusText}`);
                }
                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error(`Error fetching data from ${url}:`, err);
                setError(`Error fetching data: ${err.message}. Check if server is running.`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, dependencies);

    return { data, loading, error, setError };
};

const ProfitLossReport = () => {
    const { data: projectsList, error: projectError, setError: setProjectError } = useDataFetcher(
        `${API_BASE_URL}/projects`, []
    );

    const [selectedProject, setSelectedProject] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    
    const [reportData, setReportData] = useState({
        history: [],
        totalBudget: 0,
        totalRevenue: 0,
        totalExpenditures: 0,
        remainingBudget: 0,
        profitLoss: 0,
    });
    
    const [loadingReport, setLoadingReport] = useState(false);
    const [reportError, setReportError] = useState(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const loadingDotsStyle = `
        @keyframes loading-dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }
        .loading-dots::after {
            content: '';
            animation: loading-dots 1s infinite;
        }
    `;

    useEffect(() => {
        if (projectError) {
            setReportError(projectError);
            setProjectError(null);
        }
    }, [projectError, setProjectError]);

    const handleSearch = async () => {
        if (!selectedProject) {
            setReportError("Please select a project to generate the report.");
            return;
        }
        if (!fromDate) {
            setReportError("Please select a start date for the report.");
            return;
        }
        if (!toDate) {
            setReportError("Please select an end date for the report.");
            return;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            setReportError("The start date cannot be after the end date.");
            return;
        }

        setLoadingReport(true);
        setReportError(null);
        setIsHistoryOpen(true);
        
        setReportData({
            history: [],
            totalBudget: 0, totalRevenue: 0, totalExpenditures: 0, remainingBudget: 0, profitLoss: 0,
        });

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Token not found. Please log in.');
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

            const [invoiceRes, transactionRes] = await Promise.all([
                fetch(`${API_BASE_URL}/invoices`, { headers }),
                fetch(`${API_BASE_URL}/transactions/summary/${selectedProject}`, { headers }) 
            ]);

            if (!invoiceRes.ok) throw new Error(`Failed to fetch invoices: ${invoiceRes.statusText}`);
            
            const allInvoices = await invoiceRes.json();
            
            let allTransactions = [];
            if (transactionRes.ok) {
                const transactionData = await transactionRes.json();
                allTransactions = transactionData.allTransactions || [];
            }

            const projectDetails = projectsList.find(p => p._id === selectedProject);
            const totalBudget = safeParseFloat(projectDetails?.estimatedBudget || 0);

            const filteredInvoices = allInvoices.filter(invoice => {
                const invProjectId = invoice.projectId?._id || invoice.projectId;
                const matchesProject = invProjectId === selectedProject;

                const invDate = new Date(invoice.invoiceDate);
                const start = new Date(fromDate);
                const end = new Date(toDate);
                end.setHours(23, 59, 59, 999);

                const matchesDate = invDate >= start && invDate <= end;
                return matchesProject && matchesDate;
            });

            const filteredExpenses = allTransactions.filter(t => {
                const tDate = new Date(t.date);
                const start = new Date(fromDate);
                const end = new Date(toDate);
                end.setHours(23, 59, 59, 999);

                const isExpense = t.type === 'Expense';
                const matchesDate = tDate >= start && tDate <= end;

                return isExpense && matchesDate;
            });

            const incomeList = filteredInvoices.map(inv => ({
                _id: inv._id,
                date: inv.invoiceDate,
                refNo: inv.invoiceNumber || 'N/A',
                description: `Invoice - ${inv.invoiceTo?.clientName || inv.invoiceTo?.name || 'Unknown Client'}`,
                type: 'Income',
                amount: safeParseFloat(inv.grandTotal || inv.totalAmount || 0)
            }));

            const expenseList = filteredExpenses.map(exp => ({
                _id: exp._id || exp.id,
                date: exp.date,
                refNo: 'EXP',
                description: exp.description || exp.source || 'General Expense',
                type: 'Expense',
                amount: safeParseFloat(exp.amount || 0)
            }));

            const combinedHistory = [...incomeList, ...expenseList].sort((a, b) => new Date(b.date) - new Date(a.date));

            const totalRevenue = filteredInvoices.reduce((sum, item) => sum + safeParseFloat(item.grandTotal || item.totalAmount || 0), 0);
            const totalExpenditures = filteredExpenses.reduce((sum, t) => sum + safeParseFloat(t.amount || 0), 0);

            const remainingBudget = totalBudget - totalExpenditures;
            const profitLoss = totalRevenue - totalExpenditures;

            setReportData({
                history: combinedHistory,
                totalBudget,
                totalRevenue,
                totalExpenditures,
                remainingBudget,
                profitLoss,
            });

        } catch (err) {
            console.error("Error generating report:", err);
            setReportError("Error generating report: " + err.message);
        } finally {
            setLoadingReport(false);
        }
    };

    const isProfit = reportData.profitLoss >= 0;
    const profitPercentage = reportData.totalRevenue > 0 ? (Math.abs(reportData.profitLoss) / reportData.totalRevenue) * 100 : 0;

    const StatCard = ({ title, value, icon: Icon, color, change, subtitle }) => (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                        ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    {subtitle && (
                        <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${color} shadow-lg`}>
                    <Icon size={24} className="text-white" />
                </div>
            </div>
        </div>
    );

    const TransactionHistoryTable = () => (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <button 
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
            >
                <div className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-3 text-indigo-600" />
                    <h3 className="text-xl font-semibold text-gray-800">
                        Detailed Transaction History
                    </h3>
                    <span className="ml-3 text-xs font-semibold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                        {reportData.history.length} Records
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                        {isHistoryOpen ? 'Hide' : 'Show'} Details
                    </span>
                    {isHistoryOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </button>

            {isHistoryOpen && (
                <div className="border-t border-gray-100">
                    <div className="max-h-96 overflow-y-auto">
                        {reportData.history.length === 0 ? (
                            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No transactions found</p>
                                <p className="text-gray-400 text-sm mt-1">Try adjusting your date range or project selection</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {reportData.history.map((item, index) => (
                                        <tr key={item._id || index} className="hover:bg-blue-50/50 transition-colors duration-150 group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{formatDate(item.date)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                                    {item.refNo}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-700 max-w-xs truncate group-hover:max-w-none transition-all duration-200">
                                                    {item.description}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                    item.type === 'Income' 
                                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                                        : 'bg-red-100 text-red-800 border border-red-200'
                                                }`}>
                                                    {item.type === 'Income' ? 
                                                        <ArrowUpCircle className="w-3 h-3 mr-1"/> : 
                                                        <ArrowDownCircle className="w-3 h-3 mr-1"/>
                                                    }
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${
                                                item.type === 'Income' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {item.type === 'Income' ? '+' : '-'} 
                                                ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
            <style>{loadingDotsStyle}</style>
            
            {/* Header Section */}
            <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <PieChart className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Profit & Loss Analytics</h1>
                                <p className="text-blue-100 mt-2">Comprehensive financial analysis for your projects</p>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                                <Target className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
                            Select Project
                        </label>
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        >
                            <option value="">Choose a project...</option>
                            {Array.isArray(projectsList) && projectsList.map(project => (
                                <option key={project._id} value={project._id}>
                                    {project.projectName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-green-500" />
                            From Date
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                            To Date
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleSearch}
                            disabled={loadingReport}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none flex items-center justify-center font-semibold"
                        >
                            {loadingReport ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                                    <span>Analyzing<span className="loading-dots"></span></span>
                                </>
                            ) : (
                                <>
                                    <Filter className="w-5 h-5 mr-2" />
                                    Generate Report
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {reportError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-medium">{reportError}</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Budget"
                    value={reportData.totalBudget}
                    icon={DollarSign}
                    color="bg-blue-500"
                    subtitle="Estimated project budget"
                />
                
                <StatCard
                    title="Total Revenue"
                    value={reportData.totalRevenue}
                    icon={TrendingUp}
                    color="bg-green-500"
                    subtitle="Income from invoices"
                />
                
                <StatCard
                    title="Total Expenses"
                    value={reportData.totalExpenditures}
                    icon={TrendingDown}
                    color="bg-red-500"
                    subtitle="Project expenditures"
                />
                
                <StatCard
                    title="Remaining Budget"
                    value={reportData.remainingBudget}
                    icon={Briefcase}
                    color="bg-purple-500"
                    subtitle="Available funds"
                />
            </div>

            {/* Profit/Loss Highlight */}
            {(selectedProject && !loadingReport) && (
                <div className={`mb-8 p-8 rounded-2xl shadow-2xl border-2 transition-all duration-300 ${
                    isProfit 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-100 border-green-300' 
                        : 'bg-gradient-to-r from-red-50 to-orange-100 border-red-300'
                }`}>
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-4">
                            <div className={`p-3 rounded-xl ${
                                isProfit ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                                {isProfit ? 
                                    <Award className="w-8 h-8 text-white" /> : 
                                    <AlertCircle className="w-8 h-8 text-white" />
                                }
                            </div>
                        </div>
                        <h2 className={`text-2xl font-bold mb-2 ${
                            isProfit ? 'text-green-700' : 'text-red-700'
                        }`}>
                            {isProfit ? '🎉 NET PROFIT' : '⚠️ NET LOSS'}
                        </h2>
                        <p className={`text-5xl font-black mb-2 ${
                            isProfit ? 'text-green-800' : 'text-red-800'
                        }`}>
                            {isProfit ? '+' : '-'}₹{Math.abs(reportData.profitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-lg font-semibold ${
                            isProfit ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {profitPercentage.toFixed(1)}% {isProfit ? 'profit' : 'loss'} margin
                        </p>
                    </div>
                </div>
            )}

            {/* Transaction History */}
            {(selectedProject && !loadingReport) && <TransactionHistoryTable />}
        </div>
    );
};

export default ProfitLossReport;
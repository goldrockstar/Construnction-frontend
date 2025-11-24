import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, Briefcase, Calendar, FileText, IndianRupee, TrendingUp, TrendingDown, Download, Filter, PieChart } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const SalaryReport = () => {
    // State variables
    const [projectsList, setProjectsList] = useState([]);
    const [selectedProject, setSelectedProject] = useState('All');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalExpense, setTotalExpense] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [showFilters, setShowFilters] = useState(true);

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        } catch (e) {
            console.error("Date formatting error:", e);
            return 'Format Error';
        }
    };

    // Helper to safely extract ID
    const getResourceId = (resource) => {
        if (!resource) return null;
        if (typeof resource === 'object') return resource._id || resource.id;
        return String(resource);
    };

    // Function to fetch dropdown data
    const fetchDropdownData = useCallback(async () => {
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found. Please log in.');
            }

            const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });

            if (!projectsResponse.ok) {
                throw new Error(`Failed to fetch projects: ${projectsResponse.statusText}`);
            }
            const projectList = await projectsResponse.json();
            setProjectsList(projectList);

        } catch (err) {
            console.error("Error fetching dropdown data:", err);
            setError("Error fetching initial data: " + err.message);
        }
    }, []);

    // Function to fetch report data
    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        setReportData([]);
        setTotalExpense(0);
        setTotalIncome(0);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Token not found. Please log in.');

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const baseQueryParams = new URLSearchParams({
                ...(selectedProject !== 'All' && { projectId: selectedProject }),
                ...(fromDate && { fromDate: fromDate }),
                ...(toDate && { toDate: toDate }),
            });

            const transactionsResponse = await fetch(`${API_BASE_URL}/transactions?${baseQueryParams.toString()}`, { headers });

            if (!transactionsResponse.ok) {
                const errorData = await transactionsResponse.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to fetch transactions: ${transactionsResponse.statusText}`);
            }

            const fetchedTransactions = await transactionsResponse.json();

            const normalizedTransactions = (Array.isArray(fetchedTransactions) ? fetchedTransactions : [])
                .filter(item => {
                    const type = String(item.type).toLowerCase();
                    return ['income', 'expense'].includes(type);
                })
                .map(item => ({
                    id: item._id || item.id,
                    projectId: getResourceId(item.project || item.projectId),
                    amount: parseFloat(item.amount || 0),
                    transactionDate: item.transactionDate,
                    category: item.category || item.description || 'General',
                    type: String(item.type).toLowerCase(),
                    isExpense: String(item.type).toLowerCase() === 'expense',
                    source: 'Transaction',
                }));

            let mergedData = [...normalizedTransactions];

            if (selectedProject !== 'All') {
                mergedData = mergedData.filter(item => String(item.projectId) === String(selectedProject));
            }

            mergedData.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
            setReportData(mergedData);

            const expenses = mergedData
                .filter(item => item.isExpense)
                .reduce((sum, item) => sum + item.amount, 0);

            const incomes = mergedData
                .filter(item => !item.isExpense)
                .reduce((sum, item) => sum + item.amount, 0);

            setTotalExpense(expenses);
            setTotalIncome(incomes);

        } catch (err) {
            console.error("Error searching report:", err);
            setError("Error fetching data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    const netProfit = totalIncome - totalExpense;
    const profitPercentage = totalIncome > 0 ? ((netProfit / totalIncome) * 100) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
            <div className="container mx-auto px-4 py-8">
                

                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                    
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 p-8 text-white">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <PieChart className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold">Business Dashboard</h2>
                                    <p className="text-blue-100 mt-1">Real-time business performance metrics</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-3">
                                <button 
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center space-x-2 px-6 py-3 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
                                >
                                    <Filter className="w-5 h-5" />
                                    <span>Filters</span>
                                </button>
                                {/* <button className="flex items-center space-x-2 px-6 py-3 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-300 backdrop-blur-sm">
                                    <Download className="w-5 h-5" />
                                    <span>Export PDF</span>
                                </button> */}
                            </div>
                        </div>
                    </div>

                    {/* Filters Section */}
                    {showFilters && (
                        <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                
                                {/* Project Select */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                        <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
                                        Project Filter
                                    </label>
                                    <select 
                                        value={selectedProject} 
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm"
                                    >
                                        <option value="All">All Projects</option>
                                        {projectsList.map((proj, index) => (
                                            <option 
                                                key={proj._id || proj.id || index} 
                                                value={proj._id || proj.id}
                                            >
                                                {proj.name || proj.projectName || `Project ${index + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* From Date */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-green-500" />
                                        Start Date
                                    </label>
                                    <input 
                                        type="date" 
                                        value={fromDate} 
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm"
                                    />
                                </div>

                                {/* To Date */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                                        End Date
                                    </label>
                                    <input 
                                        type="date" 
                                        value={toDate} 
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm"
                                    />
                                </div>

                                {/* Search Button */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 opacity-0">
                                        Action
                                    </label>
                                    <button 
                                        onClick={handleSearch} 
                                        disabled={loading}
                                        className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2"
                                    >
                                        {loading ? (
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Search className="w-5 h-5" />
                                        )}
                                        <span>{loading ? 'Analyzing...' : 'Generate Report'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-2xl backdrop-blur-sm">
                            <p className="text-red-700 font-medium text-center">{error}</p>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="py-20 text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium text-lg">Crunching numbers...</p>
                            <p className="text-gray-500 text-sm mt-2">Analyzing financial data across all transactions</p>
                        </div>
                    )}

                    {/* Results Section */}
                    {!loading && reportData.length > 0 && (
                        <div className="p-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* Income Card */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border border-green-200 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-600 font-semibold mb-2 flex items-center">
                                                <TrendingUp className="w-4 h-4 mr-2" />
                                                TOTAL INCOME
                                            </p>
                                            <p className="text-3xl font-bold text-green-700">
                                                ₹{totalIncome.toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-green-600 text-sm mt-2">All revenue streams</p>
                                        </div>
                                        <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                                            <IndianRupee className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Expense Card */}
                                <div className="bg-gradient-to-br from-red-50 to-pink-100 p-6 rounded-2xl border border-red-200 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-red-600 font-semibold mb-2 flex items-center">
                                                <TrendingDown className="w-4 h-4 mr-2" />
                                                TOTAL EXPENSES
                                            </p>
                                            <p className="text-3xl font-bold text-red-700">
                                                ₹{totalExpense.toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-red-600 text-sm mt-2">Operational costs</p>
                                        </div>
                                        <div className="p-3 bg-red-500 rounded-xl shadow-lg">
                                            <IndianRupee className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Net Profit Card */}
                                <div className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-blue-50 to-cyan-100 border-blue-200' : 'from-orange-50 to-red-100 border-orange-200'} p-6 rounded-2xl border shadow-lg`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'} font-semibold mb-2 flex items-center`}>
                                                <PieChart className="w-4 h-4 mr-2" />
                                                NET {netProfit >= 0 ? 'PROFIT' : 'LOSS'}
                                            </p>
                                            <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                                {netProfit >= 0 ? '+' : '-'}₹{Math.abs(netProfit).toLocaleString('en-IN')}
                                            </p>
                                            <p className={`${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'} text-sm mt-2`}>
                                                {profitPercentage.toFixed(1)}% {netProfit >= 0 ? 'margin' : 'loss'}
                                            </p>
                                        </div>
                                        <div className={`p-3 rounded-xl shadow-lg ${netProfit >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}>
                                            <IndianRupee className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Transactions Table */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                        <FileText className="w-5 h-5 mr-2 text-blue-500" />
                                        Transaction Details
                                        <span className="ml-2 text-sm text-gray-500 font-normal">
                                            ({reportData.length} records)
                                        </span>
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Project</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {reportData.map((item, index) => {
                                                const projectId = getResourceId(item.projectId);
                                                const project = projectsList.find(p => String(p.id || p._id) === String(projectId));
                                                const projectName = project ? (project.name || project.projectName) : 'Unknown Project';

                                                return (
                                                    <tr key={item.id || index} className="hover:bg-blue-50/50 transition-all duration-200 group">
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                                                                {projectName}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                                                                item.isExpense 
                                                                    ? 'bg-red-100 text-red-800 border border-red-200' 
                                                                    : 'bg-green-100 text-green-800 border border-green-200'
                                                            }`}>
                                                                {item.isExpense ? 'EXPENSE' : 'INCOME'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm text-gray-700 font-medium">{item.category}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm text-gray-600 font-mono">{formatDate(item.transactionDate)}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className={`text-sm font-bold ${
                                                                item.isExpense ? 'text-red-600' : 'text-green-600'
                                                            }`}>
                                                                {item.isExpense ? '- ' : '+ '}
                                                                ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && reportData.length === 0 && !error && (
                        <div className="py-20 text-center">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center">
                                <FileText className="w-10 h-10 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-600 mb-3">No Transactions Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">
                                {selectedProject === 'All' && !fromDate && !toDate
                                    ? 'Start by selecting filters and generating your first financial report'
                                    : 'Try adjusting your filters or date range to see transaction data'
                                }
                            </p>
                            <button 
                                onClick={() => setShowFilters(true)}
                                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center space-x-2"
                            >
                                <Filter className="w-5 h-5" />
                                <span>Adjust Filters</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalaryReport;
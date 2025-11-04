import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

const ProfitLossReport = () => {
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState({
    materialExpenditure: [],
    salaryExpenditure: [],
    otherExpenditure: [],
    totalBudget: 0,
    totalExpenditures: 0,
    remainingBudget: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Styles for the loading dots animation
  const loadingDotsStyle = `
    @keyframes loading-dots {
      0%, 20% {
        content: '.';
      }
      40% {
        content: '..';
      }
      60%, 100% {
        content: '...';
      }
    }

    .loading-dots::after {
      content: '';
      animation: loading-dots 1s infinite;
    }
  `;

  useEffect(() => {
    const fetchProjectsForDropdown = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Token not found. Please log in.');
          return;
        }
        const response = await fetch(`${API_BASE_URL}/projects`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        const data = await response.json();
        setProjectsList(data);
      } catch (err) {
        console.error("Error fetching projects (dropdown):", err);
        setError("Error fetching projects. Please check your server and ensure it is running.");
      }
    };
    fetchProjectsForDropdown();
  }, []);

  const handleSearch = async () => {
    if (!selectedProject || !fromDate || !toDate) {
      setError("Please select a project, from date, and to date.");
      return;
    }

    setLoading(true);
    setError(null);
    setReportData({
      materialExpenditure: [],
      salaryExpenditure: [],
      otherExpenditure: [],
      totalBudget: 0,
      totalExpenditures: 0,
      remainingBudget: 0,
    });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found. Please log in.');
      }
      // Fetch project details including the budget
      const projectResponse = await fetch(`${API_BASE_URL}/projects/${selectedProject}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      if (!projectResponse.ok) {
        throw new Error(`Failed to fetch project budget: ${projectResponse.statusText}`);
      }
      const projectData = await projectResponse.json();
      const totalBudget = parseFloat(projectData.totalCost || 0);

      // Fetch all expenditures for the project within the date range
      const allExpenditureResponse = await fetch(`${API_BASE_URL}/expenditures?projectId=${selectedProject}&fromDate=${fromDate}&toDate=${toDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      if (!allExpenditureResponse.ok) {
        throw new Error(`Failed to fetch expenditures: ${allExpenditureResponse.statusText}`);
      }
      const fetchedExpenditures = await allExpenditureResponse.json();

      // Filter expenditures into their respective types
      const fetchedSalaries = fetchedExpenditures.filter(item => item.expenditureType === 'Salary');
      const fetchedOthers = fetchedExpenditures.filter(item => item.expenditureType === 'Other');

      // Fetch material expenditure separately
      const materialResponse = await fetch(`${API_BASE_URL}/projectMaterialMappings?projectId=${selectedProject}&fromDate=${fromDate}&toDate=${toDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      if (!materialResponse.ok) {
        throw new Error(`Failed to fetch material expenditure: ${materialResponse.statusText}`);
      }
      const fetchedMaterials = await materialResponse.json();

      // Calculate totals
      const totalMaterialExpenditure = fetchedMaterials.reduce((sum, item) => sum + parseFloat(item.totalCost || item.finalAmount || (item.quantity * item.unitPrice) || 0), 0);
      const totalSalaryExpenditure = fetchedSalaries.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const totalOtherExpenditure = fetchedOthers.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

      const totalExpenditures = totalMaterialExpenditure + totalSalaryExpenditure + totalOtherExpenditure;
      const remainingBudget = totalBudget - totalExpenditures;

      setReportData({
        materialExpenditure: fetchedMaterials,
        salaryExpenditure: fetchedSalaries,
        otherExpenditure: fetchedOthers,
        totalBudget: totalBudget,
        totalExpenditures: totalExpenditures,
        remainingBudget: remainingBudget,
      });

      setLoading(false);
    } catch (err) {
      console.error("Error searching profit/loss report:", err);
      setError("Error searching profit/loss report: " + err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <style>{loadingDotsStyle}</style>
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex flex-col items-center font-sans">
        <div className="w-full max-w-5xl bg-white rounded-lg shadow-xl p-6 sm:p-8 transition-transform duration-300">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">Profit and Loss Report</h1>

          {/* Search Inputs Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* Select Project */}
            <div className="flex flex-col">
              <label htmlFor="selectProject" className="text-sm font-semibold text-gray-700 mb-2">
                Select Project <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="selectProject"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors duration-200"
                  required
                >
                  <option value="">Select Project</option>
                  {projectsList.map(proj => (
                    <option key={proj._id} value={proj._id}>{proj.name || proj.projectName}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.5 8.5L10 13l4.5-4.5H5.5z" /></svg>
                </div>
              </div>
            </div>

            {/* From Date */}
            <div className="flex flex-col">
              <label htmlFor="fromDate" className="text-sm font-semibold text-gray-700 mb-2">
                From Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="fromDate"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
              />
            </div>

            {/* To Date */}
            <div className="flex flex-col">
              <label htmlFor="toDate" className="text-sm font-semibold text-gray-700 mb-2">
                To Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="toDate"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
              />
            </div>

            {/* Generate Report Button */}
            <div className="flex items-end justify-center">
              <button
                onClick={handleSearch}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-medium">Generating Report<span className="loading-dots"></span></p>
            </div>
          ) : error ? (
            <p className="text-red-500 text-center py-6 font-medium">{error}</p>
          ) : reportData.totalBudget > 0 ? (
            <div className="mt-6 bg-white rounded-lg shadow-inner p-4">
              {/* Report Summary Section */}
              <div className="flex flex-wrap justify-center sm:justify-between items-center text-center font-bold text-gray-800 border-b border-gray-200 pb-4 mb-4">
                <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                  <p className="text-sm text-gray-500">Total Budget:</p>
                  <p className="text-lg text-green-600">₹{reportData.totalBudget.toLocaleString('en-IN')}</p>
                </div>
                <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                  <p className="text-sm text-gray-500">Total Expenditure:</p>
                  <p className="text-lg text-red-600">₹{reportData.totalExpenditures.toLocaleString('en-IN')}</p>
                </div>
                <div className="w-full sm:w-1/3">
                  <p className="text-sm text-gray-500">Remaining Budget:</p>
                  <p className="text-lg text-blue-600">₹{reportData.remainingBudget.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Report Details Section */}
              <h3 className="text-xl font-bold text-gray-800 p-4 border-b border-gray-200">Report Details</h3>

              {/* Material Expenditure Table */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">Material Expenditure</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Material Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.materialExpenditure.length > 0 ? (
                        reportData.materialExpenditure.map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{new Date(item.dateMapped || item.purchaseDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.materialName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">₹{parseFloat(item.totalCost || item.finalAmount || (item.quantity * item.unitPrice) || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">No material expenditure found</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2" className="px-6 py-3 text-right text-sm font-bold text-gray-800">Total Material Expenditure:</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-800">
                          ₹{reportData.materialExpenditure.reduce((sum, item) => sum + parseFloat(item.totalCost || item.finalAmount || (item.quantity * item.unitPrice) || 0), 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Salary Expenditure Table */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">Salary Expenditure</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Manpower Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">From Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">To Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.salaryExpenditure.length > 0 ? (
                        reportData.salaryExpenditure.map((item, index) => (
                          <tr key={item.id || index}>
                            {/* Display the manpowerName directly from the API data */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {item.manpowerName || 'Unknown Manpower'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{new Date(item.fromDate || item.paymentDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.toDate ? new Date(item.toDate).toLocaleDateString() : 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">₹{parseFloat(item.amount || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No salary expenditure found</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="px-6 py-3 text-right text-sm font-bold text-gray-800">Total Salary Expenditure:</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-800">
                          ₹{reportData.salaryExpenditure.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Other Expenditures Table */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">Other Expenditures</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.otherExpenditure.length > 0 ? (
                        reportData.otherExpenditure.map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{new Date(item.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.expenditureName || item.category}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">₹{parseFloat(item.amount || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">No other expenditures found</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2" className="px-6 py-3 text-right text-sm font-bold text-gray-800">Total Other Expenditure:</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-800">
                          ₹{reportData.otherExpenditure.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">Click 'Generate Report' to view the report.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfitLossReport;

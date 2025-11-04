import React, { useState, useEffect } from 'react';

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

const SalaryReport = () => {
  // State variables
  const [projectsList, setProjectsList] = useState([]);
  const [manpowerList, setManpowerList] = useState([]);
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedManpower, setSelectedManpower] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State variables for total salaries
  const [totalProjectSalary, setTotalProjectSalary] = useState(0);
  const [totalManpowerSalary, setTotalManpowerSalary] = useState(0);

  // State variable for filtered manpower list
  const [filteredManpowerList, setFilteredManpowerList] = useState([]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Function to fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem('token');
      // If token is not found, throw an error
      if (!token) {
        throw new Error('Token not found. Please log in.');
      }
      
      // Fetching the list of projects
      const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!projectsResponse.ok) {
        throw new Error(`Failed to fetch projects: ${projectsResponse.statusText}`);
      }
      const projectList = await projectsResponse.json();
      setProjectsList(projectList);
      console.log('Fetched projects:', projectList);

      // Fetching the list of manpower
      const manpowerResponse = await fetch(`${API_BASE_URL}/manpower`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!manpowerResponse.ok) {
        throw new Error(`Failed to fetch manpower: ${manpowerResponse.statusText}`);
      }
      const fetchedManpower = await manpowerResponse.json();
      setManpowerList(fetchedManpower);
      setFilteredManpowerList(fetchedManpower); // Initially, set filtered list to all manpower
      console.log('Fetched manpower:', fetchedManpower);

    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      setError("Error fetching dropdown data. Please try again later. " + err.message);
    }
  };

  // Filter manpower list based on selected project
  useEffect(() => {
    console.log("Selected project has changed:", selectedProject);
    if (selectedProject === 'All') {
      setFilteredManpowerList(manpowerList);
      setSelectedManpower(''); // When project is 'All', reset manpower selection
    } else {
      const projectId = typeof selectedProject === 'object' ? selectedProject._id : selectedProject;
      const filtered = manpowerList.filter(mp => {
        // Check both possible fields for the project ID from the API response
        const associatedProjectId = (mp.project && typeof mp.project === 'object') ? mp.project._id : mp.projectId;
        return associatedProjectId === projectId;
      });
      setFilteredManpowerList(filtered);
      // Auto-select first manpower in filtered list, otherwise reset
      if (filtered.length > 0) {
        setSelectedManpower(filtered[0].id || filtered[0]._id);
      } else {
        setSelectedManpower('');
      }
    }
  }, [selectedProject, manpowerList]);


  // Function to fetch report data on search button click
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setReportData([]);
    setTotalProjectSalary(0);
    setTotalManpowerSalary(0);

    try {
      console.log("Search initiated. Selected manpower:", selectedManpower);
      // Constructing API query parameters
      const queryParams = new URLSearchParams({
        expenditureType: 'Salary',
        // Add projectId only if a project is selected
        ...(selectedProject !== 'All' && { projectId: selectedProject }),
        // Add manpowerId only if a manpower is selected
        ...(selectedManpower && { manpowerId: selectedManpower }),
        ...(fromDate && { fromDate: fromDate }),
        ...(toDate && { toDate: toDate }),
      }).toString();

      console.log("Query Parameters for API call:", queryParams);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found. Please log in.');
      }
      
      // API call to get the expenditure report
      const response = await fetch(`${API_BASE_URL}/expenditures?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch salary report: ${response.statusText}`);
      }
      const fetchedSalaries = await response.json();

      // Filter the data based on selected manpower if it is not an empty string
      const filteredSalaries = selectedManpower
        ? fetchedSalaries.filter(item => (item.manpowerId && typeof item.manpowerId === 'object' ? item.manpowerId._id : item.manpowerId) === selectedManpower)
        : fetchedSalaries;

      setReportData(filteredSalaries);
      console.log('Fetched report data:', filteredSalaries);

      // Calculate total salaries
      const totalAmount = filteredSalaries.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      setTotalProjectSalary(totalAmount);
      setTotalManpowerSalary(totalAmount);

    } catch (err) {
      console.error("Error searching for salary report:", err);
      setError("Error searching for salary report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dropdown data on initial load
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // JSX rendering
  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Salary Report</h2>

        {/* Filter Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 items-end">
          {/* Select Project */}
          <div>
            <label htmlFor="selectProject" className="block text-sm font-medium text-gray-700 mb-1">
              Select Project
            </label>
            <select
              id="selectProject"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm transition duration-150 ease-in-out"
            >
              <option value="All">All Projects</option>
              {projectsList.map((proj, index) => (
                <option key={proj.id || proj._id || index} value={proj.id || proj._id}>
                  {proj.name || proj.projectName}
                </option>
              ))}
            </select>
          </div>

          {/* Select Manpower */}
          <div>
            <label htmlFor="selectManpower" className="block text-sm font-medium text-gray-700 mb-1">
              Select Manpower
            </label>
            <select
              id="selectManpower"
              value={selectedManpower}
              onChange={(e) => setSelectedManpower(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm transition duration-150 ease-in-out"
            >
              {/* First option when manpower list is empty */}
              {filteredManpowerList.length === 0 && <option value="">No Manpower</option>}
              {filteredManpowerList.map((mp, index) => (
                <option key={mp.id || mp._id || index} value={mp.id || mp._id}>
                  {mp.name} ({mp.role})
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              id="fromDate"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
            />
          </div>

          {/* To Date */}
          <div>
            <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              id="toDate"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
            />
          </div>

          {/* Search Button */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-center mt-4">
            <button
              onClick={handleSearch}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {/* Loading spinner */}
        {loading && (
          <div className="text-center py-12">
            <svg className="animate-spin h-10 w-10 text-gray-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.964l3-2.673z"></path>
            </svg>
            <p className="mt-4 text-lg text-gray-500">Loading...</p>
          </div>
        )}

        {/* Report section */}
        {!loading && reportData.length > 0 ? (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Report Details</h3>
            <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Project Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Manpower Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">From Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">To Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((item, index) => {
                    // Get the project and manpower IDs correctly
                    const projectId = item.projectId && typeof item.projectId === 'object' ? item.projectId._id : item.projectId;
                    const manpowerId = item.manpowerId && typeof item.manpowerId === 'object' ? item.manpowerId._id : item.manpowerId;

                    // Find the project and manpower objects
                    const project = projectsList.find(p => (p.id || p._id) === projectId);
                    const manpower = manpowerList.find(mp => (mp.id || mp._id) === manpowerId);
                    
                    // Conditionally get the names, defaulting to 'N/A'
                    const projectName = project ? (project.name || project.projectName) : 'N/A';
                    const manpowerName = manpower ? manpower.name : 'N/A';
                    
                    return (
                      <tr key={item.id || item._id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{projectName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{manpowerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.fromDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.toDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{parseFloat(item.amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total salary section */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Total Project Salary:</span>
                <span className="text-xl font-bold text-gray-900">₹{totalProjectSalary.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Total Manpower Salary:</span>
                <span className="text-xl font-bold text-gray-900">₹{totalManpowerSalary.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        ) : (
          !loading && <p className="text-gray-500 text-center py-8">No report data found. Please adjust your search criteria.</p>
        )}
      </div>
    </div>
  );
};

export default SalaryReport;

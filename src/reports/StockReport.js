import React, { useState, useEffect } from 'react';

const StockReport = () => {
  const [projectsList, setProjectsList] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedMaterial, setSelectedMaterial] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState(null); // Single object for the complete report
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch data from the server
  const fetchData = async (url) => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');

    // Add Authorization header only if a token exists.
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch data: ${response.statusText}`);
      } else {
        throw new Error(`Failed to fetch data. Server returned non-JSON response: ${response.status}`);
      }
    }
    return response.json();
  };

  // This hook is for loading the dropdown data.
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const projects = await fetchData('http://localhost:5000/api/projects');
        setProjectsList(projects);
        console.log('Fetched projects:', projects);

        const materials = await fetchData('http://localhost:5000/api/materials');
        console.log('Fetched materials:', materials);
        setMaterialsList(materials);
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
        setError("Error fetching dropdown data. Please check your server and ensure it is running.");
      }
    };
    fetchDropdownData();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setReportData(null); // Resetting the report object

    try {
      // First, get the material name for the selected materialId
      const selectedMaterialObj = materialsList.find(mat => mat._id === selectedMaterial);
      const selectedMaterialName = selectedMaterialObj?.materialNames?.[0] || 'All';
      
      const mappingQueryParams = new URLSearchParams({
        ...(selectedProject !== 'All' && { projectId: selectedProject }),
        ...(selectedMaterialName !== 'All' && { materialName: selectedMaterialName }),
        ...(fromDate && { fromDate: fromDate }),
        ...(toDate && { toDate: toDate }),
      }).toString();
      
      const usageQueryParams = new URLSearchParams({
        ...(selectedProject !== 'All' && { projectId: selectedProject }),
        ...(selectedMaterial !== 'All' && { materialId: selectedMaterial }),
        ...(fromDate && { fromDate: fromDate }),
        ...(toDate && { toDate: toDate }),
      }).toString();

      // Fetching both data sets at once
      const [fetchedMappings, fetchedUsages] = await Promise.all([ 
        fetchData(`http://localhost:5000/api/projectMaterialMappings?${mappingQueryParams}`), 
        fetchData(`http://localhost:5000/api/material-usage?${usageQueryParams}`) 
      ]);

      console.log('Fetched Mappings:', fetchedMappings);
      console.log('Fetched Usages:', fetchedUsages);

      // Aggregating data from both sources
      const aggregatedData = {};
      let totalStockIn = 0;
      let totalStockOut = 0;

      // First, get quantity from mappings
      fetchedMappings.forEach(mapping => {
        const material = materialsList.find(mat => mat.materialNames?.includes(mapping.materialName));
        const materialId = material?._id || 'unknown_' + mapping.materialName.replace(/\s+/g, '-');
        
        if (!aggregatedData[materialId]) {
          aggregatedData[materialId] = {
            materialId,
            stockIn: 0,
            stockOut: 0,
            materialName: material?.materialNames?.[0] || mapping.materialName || 'Unknown Material',
            unit: material?.unit || mapping.unit || 'Units'
          };
        }
        aggregatedData[materialId].stockIn += mapping.quantity || 0;
        totalStockIn += mapping.quantity || 0;
      });

      // Then, update with quantityUsed from usages
      fetchedUsages.forEach(usage => {
        const materialId = usage.materialId;
        if (!aggregatedData[materialId]) {
          // This case should ideally not happen if data is consistent, but for safety
          const material = materialsList.find(mat => mat._id === materialId);
          aggregatedData[materialId] = {
            materialId,
            stockIn: 0,
            stockOut: 0,
            materialName: material?.materialNames?.[0] || 'Unknown Material',
            unit: material?.unit || 'Units'
          };
        }
        aggregatedData[materialId].stockOut += usage.quantityUsed || 0;
        totalStockOut += usage.quantityUsed || 0;
      });

      let stockDetails = Object.values(aggregatedData);
      
      // Filter the report data if a specific material is selected
      if (selectedMaterial !== 'All') {
        stockDetails = stockDetails.filter(item => item.materialId === selectedMaterial);
      }
      
      const remainingStock = totalStockIn - totalStockOut;

      const finalReport = {
        totalStockIn,
        totalStockOut,
        remainingStock,
        stockDetails
      };

      setReportData(finalReport);
      setLoading(false);

    } catch (err) {
      console.error("Error searching stock report:", err);
      setError("Error searching stock report: " + err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center font-sans">
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
            }
            .loading-dots:after {
              content: '...';
              animation: loading-dots 1s infinite;
            }
            @keyframes loading-dots {
              0%, 20% { content: '.'; }
              40% { content: '..'; }
              60% { content: '...'; }
              80%, 100% { content: ''; }
            }
          `}
        </style>
        <div className="w-full max-w-5xl bg-white rounded-lg shadow-xl p-8 transition-transform duration-300">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Stock Report</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Select Project */}
            <div className="flex flex-col">
              <label htmlFor="selectProject" className="text-sm font-semibold text-gray-700 mb-2">
                Select Project
              </label>
              <div className="relative">
                <select
                  id="selectProject"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors duration-200"
                >
                  <option value="All">All Projects</option>
                  {projectsList.map(proj => (
                    <option key={proj._id || proj.id} value={proj._id || proj.id}>{proj.projectName || proj.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.5 8.5L10 13l4.5-4.5H5.5z" /></svg>
                </div>
              </div>
            </div>

            {/* Select Material */}
            <div className="flex flex-col">
              <label htmlFor="selectMaterial" className="text-sm font-semibold text-gray-700 mb-2">
                Select Material
              </label>
              <div className="relative">
                <select
                  id="selectMaterial"
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors duration-200"
                >
                  <option value="All">All Materials</option>
                  {materialsList.map(mat => (
                    <option key={mat._id || mat.id} value={mat._id || mat.id}>{mat.materialNames?.[0]}</option>
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
                From Date
              </label>
              <input
                type="date"
                id="fromDate"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>

            {/* To Date */}
            <div className="flex flex-col">
              <label htmlFor="toDate" className="text-sm font-semibold text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                id="toDate"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="ml-4 text-gray-600 font-medium">Searching Report<span className="loading-dots"></span></p>
            </div>
          ) : error ? (
            <p className="text-red-500 text-center py-6 font-medium">{error}</p>
          ) : reportData ? (
            // New UI section to display overall report totals
            <div className="bg-white rounded-lg shadow-inner mt-6 p-4">
              {/* <div className="flex flex-wrap justify-center sm:justify-between items-center text-center font-bold text-gray-800 border-b border-gray-200 pb-4 mb-4">
                <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                  <p className="text-sm text-gray-500">Stock-In</p>
                  <p className="text-lg text-green-600">{reportData.totalStockIn}</p>
                </div>
                <div className="w-full sm:w-1/3 mb-2 sm:mb-0">
                  <p className="text-sm text-gray-500">Stock-Out:</p>
                  <p className="text-lg text-red-600">{reportData.totalStockOut}</p>
                </div>
                <div className="w-full sm:w-1/3">
                  <p className="text-sm text-gray-500">Remaining Stock:</p>
                  <p className="text-lg text-blue-600">{reportData.remainingStock}</p>
                </div>
              </div> */}
              <h3 className="text-xl font-bold text-gray-800 p-4 border-b border-gray-200">Report Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Stock-In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Stock-Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Remaining Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Render the stockDetails from the single report object */}
                    {reportData.stockDetails && reportData.stockDetails.map((item) => {
                      const remaining = item.unit - item.stockOut;
                      return (
                        <tr key={item.materialId} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{item.materialName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"> {item.unit}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.stockOut} </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{remaining}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

export default StockReport;

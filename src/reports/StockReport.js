import React, { useState, useEffect } from 'react';
import { Search, Building2, Package, Calendar, Download, TrendingUp, TrendingDown, Box } from 'lucide-react';

const StockReport = () => {
  const [projectsList, setProjectsList] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedMaterial, setSelectedMaterial] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper fetch
  const fetchData = async (url) => {
    let attempt = 0;
    const maxRetries = 3;

    while (attempt < maxRetries) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem("token");
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(url, { method: "GET", headers });
        if (!res.ok) {
          let msg = `Error: ${res.status}`;
          try {
            const body = await res.json();
            msg = body.message || msg;
          } catch { }
          throw new Error(msg);
        }
        return res.json();
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) throw err;
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  };

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const projects = await fetchData("http://localhost:5000/api/projects");
        const materials = await fetchData("http://localhost:5000/api/materials");
        console.log("MATERIALS API RESULT:", materials);
        setProjectsList(projects);
        setMaterialsList(materials);
      } catch (err) {
        setError("Failed loading dropdown data.");
      }
    };
    loadDropdowns();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const mappingQueryParams = new URLSearchParams({
        ...(selectedProject !== "All" && { projectId: selectedProject }),
        ...(selectedMaterial !== "All" && { materialId: selectedMaterial }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate })
      }).toString();

      const fetchedUsages = await fetchData(
        `http://localhost:5000/api/projectMaterialMappings?${mappingQueryParams}`
      );

      const aggregatedData = {};
      let totalStockIn = 0;
      let totalStockOut = 0;

      materialsList.forEach(mat => {
        if (selectedMaterial !== "All" && mat._id !== selectedMaterial) return;

        aggregatedData[mat._id] = {
          materialId: mat._id,
          materialName: mat.materialNames?.[0] || "Unknown",
          unit: mat.unitofMeasure || "Unit",
          stockIn: mat.availableQuantity || 0,
          stockOut: 0
        };
        totalStockIn += mat.availableQuantity || 0;
      });

      fetchedUsages.forEach(u => {
        const matId = u.materialId?._id || u.materialId;
        if (!aggregatedData[matId]) return;

        const qty = u.quantityUsed || 0;
        aggregatedData[matId].stockOut += qty;
        totalStockOut += qty;
      });

      const stockDetails = Object.values(aggregatedData);

      const finalReport = {
        totalStockIn,
        totalStockOut,
        remainingStock: totalStockIn - totalStockOut,
        stockDetails
      };

      setReportData(finalReport);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed generating report.");
    }

    setLoading(false);
  };

  const ReportCard = ({ title, value, colorClass, icon: Icon, subtitle }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${colorClass} mb-1`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass.replace('text-', 'bg-').replace('-600', '-100')} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} className={colorClass} />
        </div>
      </div>
    </div>
  );

  const handleExport = () => {
    // Simple export functionality - can be enhanced with proper CSV/PDF generation
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Package className="h-8 w-8 mr-3 text-indigo-600" />
                Material Stock Report
              </h1>
              <p className="text-gray-600 mt-1">Track and analyze material inventory movements</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              disabled={!reportData}
              className="flex items-center px-4 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} className="mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Project Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Building2 size={16} className="mr-2 text-indigo-600" />
                Project
              </label>
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50"
              >
                <option value="All">All Projects</option>
                {projectsList.map(p => (
                  <option key={p._id} value={p._id}>{p.projectName}</option>
                ))}
              </select>
            </div>

            {/* Material Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Package size={16} className="mr-2 text-green-600" />
                Material
              </label>
              <select
                value={selectedMaterial}
                onChange={e => setSelectedMaterial(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50"
              >
                <option value="All">All Materials</option>
                {materialsList.map(m => (
                  <option key={m._id} value={m._id}>{m.materialNames?.[0]}</option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Calendar size={16} className="mr-2 text-blue-600" />
                From Date
              </label>
              <input 
                type="date" 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)} 
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Calendar size={16} className="mr-2 text-purple-600" />
                To Date
              </label>
              <input 
                type="date" 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                value={toDate} 
                onChange={e => setToDate(e.target.value)} 
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="text-center mt-6">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center justify-center mx-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating Report...
                </>
              ) : (
                <>
                  <Search size={20} className="mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Section */}
        {reportData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ReportCard 
                title="Total Stock In" 
                value={reportData.totalStockIn} 
                colorClass="text-green-600" 
                icon={TrendingUp}
                subtitle="Initial inventory"
              />
              <ReportCard 
                title="Total Stock Out" 
                value={reportData.totalStockOut} 
                colorClass="text-red-600" 
                icon={TrendingDown}
                subtitle="Materials used"
              />
              <ReportCard 
                title="Remaining Stock" 
                value={reportData.remainingStock} 
                colorClass="text-blue-600" 
                icon={Box}
                subtitle="Current balance"
              />
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-indigo-600" />
                  Material Stock Details
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Material Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Stock In</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Stock Out</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Remaining</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {reportData.stockDetails.map((row, index) => {
                      const remaining = row.stockIn - row.stockOut;
                      return (
                        <tr key={row.materialId} className="hover:bg-gray-50 transition-all duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{row.materialName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                              {row.stockIn}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                              {row.stockOut}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-bold px-3 py-2 rounded-lg ${
                              remaining > 0 
                                ? 'text-blue-700 bg-blue-50' 
                                : 'text-orange-700 bg-orange-50'
                            }`}>
                              {remaining}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {row.unit}
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
      </div>
    </div>
  );
};

export default StockReport;
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Trash2, PlusCircle, Save, Ban } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// Base URL for the API
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to calculate the total amount for a section
const calculateTotalAmount = (items) => {
  return (Array.isArray(items) ? items : []).reduce((total, item) => {
    // If quantity is not defined, just add the amount (for manpower/expenditures)
    if (item.quantity === undefined) {
      return total + (parseFloat(item.amount) || 0);
    }
    // For materials, calculate quantity * amount
    const quantity = parseFloat(item.quantity) || 1;
    const amount = parseFloat(item.amount) || 0;
    return total + (quantity * amount);
  }, 0);
};

// Component for a table section (Materials, Manpower, Expenditures)
const InvoiceSectionTable = ({ category, items, handleItemChange, handleAddItem, handleRemoveItem }) => {
  // Column configurations for different categories
  const columnConfigs = {
    materials: [
      { field: 'materialName', label: 'Material Name', placeholder: 'Enter material name', type: 'text' },
      { field: 'quantity', label: 'Quantity', type: 'number' },
      { field: 'unit', label: 'Unit', placeholder: 'e.g., Nos, Kg', type: 'text' },
      { field: 'amount', label: 'Amount', type: 'number' },
      { field: 'gst', label: 'GST', type: 'text' },
    ],
    manpowers: [
      { field: 'manpowerName', label: 'Name', placeholder: 'Manpower name', type: 'text' },
      { field: 'role', label: 'Role', placeholder: 'e.g., driver', type: 'text' },
      { field: 'amount', label: 'Amount', type: 'number' },
    ],
    expenditures: [
      { field: 'expenditureName', label: 'Expenditure Name', placeholder: 'e.g., food', type: 'text' },
      { field: 'description', label: 'Description', placeholder: 'e.g., description', type: 'text' },
      { field: 'amount', label: 'Amount', type: 'number' },
    ],
  };

  const columns = columnConfigs[category];
  const title = category.charAt(0).toUpperCase() + category.slice(1).replace('s', '');
  const addButtonText = `Add New`;

  return (
    <div className="space-y-4">
      <h4 className="text-2xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
        {title}
      </h4>
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-blue-100">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="py-3 px-4 text-left text-sm font-semibold text-blue-700">
                  {col.label}
                </th>
              ))}
              <th className="py-3 px-4 text-left text-sm font-semibold text-blue-700">Total</th>
              <th className="py-3 px-4 text-center text-sm font-semibold text-blue-700 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(items) && items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="p-2">
                    <input
                      type={col.type}
                      name={col.field}
                      value={item[col.field] || (col.type === 'number' ? 0 : '')}
                      onChange={(e) => handleItemChange(category, index, e)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                      placeholder={col.placeholder || ''}
                    />
                  </td>
                ))}
                <td className="p-2 text-sm font-medium text-gray-700">
                  ₹{((parseFloat(item.quantity) || 1) * (parseFloat(item.amount) || 0)).toFixed(2)}
                </td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(category, index)}
                    className="p-2 text-red-600 hover:text-red-800 transition-colors duration-200 rounded-full hover:bg-red-100"
                    aria-label={`Remove item`}
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => handleAddItem(category)}
        className="mt-4 px-6 py-2 bg-blue-100 text-blue-700 rounded-full shadow-sm hover:bg-blue-200 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
      >
        <PlusCircle size={16} />
        {addButtonText}
      </button>
    </div>
  );
};

// Main Invoice Form component
const InvoiceForm = ({ formTitle, onSubmit, initialData, submitButtonText, onClose }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);
  
  // Initialize state with default values to prevent "uncontrolled to controlled" warning
  const [formData, setFormData] = useState(initialData || {
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    invoiceNumber: '',
    invoiceFrom: '', 
    gstFrom: '',
    addressFrom: '',
    contactNumberFrom: '',
    invoiceTo: '',
    invoiceToName: '',
    clientNameTo: '',
    gstTo: '',
    addressTo: '',
    phoneTo: '',
    totalAmount: 0,
    signedDate: '',
    termsAndConditions: '',
    projectId: '',
    profileId: '',
    materials: [],
    manpowers: [],
    expenditures: [],
  });

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);

  const updateCalculations = useCallback((data) => {
    const materialTotal = calculateTotalAmount(data.materials);
    const manpowerTotal = calculateTotalAmount(data.manpowers);
    const expenditureTotal = calculateTotalAmount(data.expenditures);
    return materialTotal + manpowerTotal + expenditureTotal;
  }, []);

  const updateFormWithProjectData = useCallback((project, client, projectItems, prevData) => {
    let updatedClientDetails = {};
    if (client && project) {
        updatedClientDetails = {
        invoiceTo: client._id || '',
        invoiceToName: client.clientName || '',
        gstTo: project.gst || '',
        addressTo: client.address || '',
        phoneTo: client.phoneNumber || '',
      };
    }

    const materials = (projectItems?.materials || []).map(item => ({
      materialName: item.materialName || '',
      quantity: item.quantity || 0,
      unit: item.unit || 'Nos',
      amount: item.amount || 0,
      gst: item.gst || 0,
    }));

    const manpowers = (projectItems?.expenditures || []).filter(item => item.type === 'salary').map(item => ({
      manpowerName: item.expenditureName || '',
      role: item.role || '',
      amount: item.amount || 0,
    }));

    const expenditures = (projectItems?.expenditures || []).filter(item => item.type === 'other').map(item => ({
      expenditureName: item.expenditureName || '',
      description: item.description || '',
      amount: item.amount || 0,
    }));

    const newFormData = {
      ...prevData,
      ...updatedClientDetails,
      materials,
      manpowers,
      expenditures,
    };
    return { ...newFormData, totalAmount: updateCalculations(newFormData) };
  }, [updateCalculations]);

  // Main effect hook to fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setIsFormReady(false);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication is required. Please log in.');
        navigate('/login');
        return;
      }

      const [projectsRes, clientsRes, profileRes] = await Promise.all([
        fetch(`${API_BASE_URL}/projects`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/clients`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/users/profile`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (!projectsRes.ok || !clientsRes.ok || !profileRes.ok) {
        throw new Error('Failed to fetch initial data.');
      }

      const projectsData = await projectsRes.json();
      const clientsData = await clientsRes.json();
      const profileData = await profileRes.json();

      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);

      let loadedInvoiceData = initialData;
      let projectItems = { materials: [], expenditures: [] };

      if (id) {
        const invoiceRes = await fetch(`${API_BASE_URL}/invoices/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!invoiceRes.ok) {
          throw new Error('Failed to fetch invoice data.');
        }
        loadedInvoiceData = await invoiceRes.json();
        const manpowers = (loadedInvoiceData?.expenditures || []).filter(item => item.type === 'salary');
        const expenditures = (loadedInvoiceData?.expenditures || []).filter(item => item.type === 'other');
        loadedInvoiceData = { ...loadedInvoiceData, manpowers, expenditures };
      }

      if (loadedInvoiceData?.projectId) {
        const projectDataRes = await fetch(`${API_BASE_URL}/invoices/project-data/${loadedInvoiceData.projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (projectDataRes.ok) {
          projectItems = await projectDataRes.json();
        } else {
          console.error('Failed to get data for the project:');
          const errorText = await projectDataRes.text();
          console.error('Server response:', errorText);
          toast.error('Could not load project data.');
        }
      }

      const selectedProject = projectsData.find(p => p && p._id === loadedInvoiceData?.projectId);
      const client = clientsData.find(c => c && c._id === (selectedProject?.client?._id || loadedInvoiceData?.invoiceTo));

      const newFormData = {
        ...loadedInvoiceData,
        // Ensure profile data is always set from the fetched data
        profileId: profileData._id || '',
        invoiceFrom: profileData.companyName || '',
        gstFrom: profileData.gst || '',
        addressFrom: profileData.address || '',
        contactNumberFrom: profileData.contactNumber || '',
        projectId: loadedInvoiceData?.projectId || '',
        invoiceTo: loadedInvoiceData?.invoiceTo || '',
        quotationId: loadedInvoiceData?.quotationId || '',
        ...updateFormWithProjectData(selectedProject, client, projectItems, loadedInvoiceData),
      };
      
      setFormData(newFormData);
      setIsFormReady(true);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(`Failed to load form data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [navigate, id, initialData, updateFormWithProjectData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prevData => {
      const newData = { ...prevData, [name]: value };
      return { ...newData, totalAmount: updateCalculations(newData) };
    });
  }, [updateCalculations]);

  // Handles loading data when a project is selected
  const handleProjectChange = useCallback(async (e) => {
    const projectId = e.target.value;
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication is required. Please log in.');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const projectDataRes = await fetch(`${API_BASE_URL}/invoices/project-data/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!projectDataRes.ok) {
        console.error('Failed to get data for the project:');
        const errorText = await projectDataRes.text();
        console.error('Server response:', errorText);
        toast.error('Could not load project data.');
        setLoading(false);
        return;
      }

      const projectItems = await projectDataRes.json();

      const selectedProject = projects.find(p => p && p._id === projectId);
      const client = clients.find(c => c && c._id === selectedProject?.client?._id);

      const newFormData = updateFormWithProjectData(selectedProject, client, projectItems, {
        ...formData,
        projectId,
        quotationId: selectedProject.quotationNumber,
      });

      setFormData(newFormData);
    } catch (error) {
      console.error('Failed to get data for the project:', error);
      toast.error('Could not load project data.');
    } finally {
      setLoading(false);
    }
  }, [projects, clients, formData, updateFormWithProjectData, navigate]);

  // Handles changes to items in a table
  const handleItemChange = useCallback((category, index, e) => {
    const { name, value } = e.target;
    setFormData(prevData => {
      const updatedItems = [...(prevData[category] || [])];
      const updatedItem = { ...updatedItems[index], [name]: value };
      updatedItems[index] = updatedItem;

      const newData = { ...prevData, [category]: updatedItems };
      return { ...newData, totalAmount: updateCalculations(newData) };
    });
  }, [updateCalculations]);

  // Adds a new item to a table
  const handleAddItem = useCallback((category) => {
    setFormData(prevData => {
      let newItem = {};
      switch (category) {
        case 'materials':
          newItem = { materialName: '', quantity: 0, unit: 'Nos', amount: 0, gst: 0 };
          break;
        case 'manpowers':
          newItem = { manpowerName: '', role: '', amount: 0 };
          break;
        case 'expenditures':
          newItem = { expenditureName: '', description: '', amount: 0 };
          break;
        default:
          return prevData;
      }
      const updatedItems = [...(prevData[category] || [])];
      updatedItems.push(newItem);
      const newData = { ...prevData, [category]: updatedItems };
      return { ...newData, totalAmount: updateCalculations(newData) };
    });
  }, [updateCalculations]);

  // Removes an item from a table
  const handleRemoveItem = useCallback((category, index) => {
    setFormData(prevData => {
      const updatedItems = (prevData[category] || []).filter((_, i) => i !== index);
      const newData = { ...prevData, [category]: updatedItems };
      return { ...newData, totalAmount: updateCalculations(newData) };
    });
  }, [updateCalculations]);

  const handleShowDeleteModal = () => {
    if (id) {
      setShowDeleteModal(true);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    setIsSaving(true);
    handleCloseDeleteModal();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication failed. Please log in.');
      navigate('/login');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice.');
      }

      toast.success('Invoice successfully deleted.');
      onClose();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      toast.error(`Failed to delete invoice: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Formats data for the backend API
  const formatDataForBackend = (data) => {
    const formattedData = { ...data };

    const combinedExpenditures = [
      ...(formattedData.manpowers || []).map(item => ({
        expenditureName: item.manpowerName,
        role: item.role,
        amount: parseFloat(item.amount) || 0,
        type: 'salary',
      })),
      ...(formattedData.expenditures || []).map(item => ({
        expenditureName: item.expenditureName,
        description: item.description,
        amount: parseFloat(item.amount) || 0,
        type: 'other',
      }))
    ];

    delete formattedData.manpowers;
    delete formattedData.expenditures;
    formattedData.expenditures = combinedExpenditures;
    formattedData.materials = formattedData.materials || [];
    
    // Explicitly add required IDs here to ensure they're in the payload
    formattedData.profileId = formattedData.profileId;
    formattedData.projectId = formattedData.projectId;
    formattedData.invoiceTo = formattedData.invoiceTo;

    return formattedData;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication failed. Please log in.');
      navigate('/login');
      setIsSaving(false);
      return;
    }

    const dataToSend = formatDataForBackend(formData);

    // --- CRITICAL DEBUGGING STEP ---
    console.log('--- Submitting form. Data payload for backend: ---');
    console.log(dataToSend);
    console.log('--------------------------------------------------');

    // --- Critical validation check before API call ---
    if (!dataToSend.projectId || !dataToSend.invoiceTo || !dataToSend.profileId) {
      toast.error('Project, client, and profile IDs are required.');
      console.error('Validation failed: Missing IDs in formData.', {
        projectId: dataToSend.projectId,
        invoiceTo: dataToSend.invoiceTo,
        profileId: dataToSend.profileId
      });
      setIsSaving(false);
      return;
    }

    const isEditing = !!id;
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_BASE_URL}/invoices/${id}` : `${API_BASE_URL}/invoices`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save invoice.');
      }

      const result = await response.json();
      toast.success(`Invoice successfully ${isEditing ? 'updated' : 'saved'}.`);
      onSubmit(result);
    } catch (error) {
      console.error('Failed to save invoice:', error);
      toast.error(`Failed to save invoice: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-3xl shadow-2xl font-sans text-gray-800 my-8 border-t-8 border-blue-600">
      <Toaster position="top-center" />
      <h3 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-4 border-gray-200 pb-4">
        {formTitle}
      </h3>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={48} className="animate-spin text-blue-500" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Basic Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl shadow-inner">
            <div className="flex flex-col">
              <label htmlFor="quotationId" className="mb-1 text-sm font-semibold text-gray-700">Select Project</label>
              <select
                id="quotationId"
                name="quotationId"
                value={formData.quotationId || ''}
                onChange={handleProjectChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
              >
                <option value="">Select a project </option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>{project.quotationNumber}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="projectId" className="mb-1 text-sm font-semibold text-gray-700">Selected Project</label>
              <input type="text" value={projects.find(p => p._id === formData.projectId)?.projectName || ''} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="invoiceDate" className="mb-1 text-sm font-semibold text-gray-700">Invoice Date</label>
              <input
                type="date"
                id="invoiceDate"
                name="invoiceDate"
                value={formData.invoiceDate || ''}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="dueDate" className="mb-1 text-sm font-semibold text-gray-700">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate || ''}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus-ring-blue-500 transition-shadow duration-200"
              />
            </div>
            <div className="flex flex-col md:col-span-2">
              <label htmlFor="invoiceNumber" className="mb-1 text-sm font-semibold text-gray-700">Invoice No</label>
              <input
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber || ''}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                placeholder="e.g., INV-001"
              />
            </div>
          </div>

          {/* From & To Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* From Details */}
            <div className="bg-blue-50 p-6 rounded-xl shadow-md space-y-4">
              <h4 className="text-xl font-bold text-blue-800">From Invoice</h4>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Company Name</label>
                <input type="text" value={formData.invoiceFrom || ''} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">GST No</label>
                <input type="text" value={formData.gstFrom || ''} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Address</label>
                <input type="text" value={formData.addressFrom || ''} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Phone Number</label>
                <input type="text" value={formData.contactNumberFrom || ''} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
            </div>

            {/* To Details */}
            <div className="bg-green-50 p-6 rounded-xl shadow-md space-y-4">
              <h4 className="text-xl font-bold text-green-800">To Invoice</h4>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Client Name</label>
                <input type="text" value={formData.invoiceToName || ''} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">GST No</label>
                <input type="text" value={formData.gstTo || ''} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Address</label>
                <input type="text" value={formData.addressTo || ''} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Phone Number</label>
                <input type="text" value={formData.phoneTo || ''} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Materials Section */}
          <InvoiceSectionTable
            category="materials"
            items={formData.materials}
            handleItemChange={handleItemChange}
            handleAddItem={handleAddItem}
            handleRemoveItem={handleRemoveItem}
          />

          {/* Manpower Section */}
          <InvoiceSectionTable
            category="manpowers"
            items={formData.manpowers}
            handleItemChange={handleItemChange}
            handleAddItem={handleAddItem}
            handleRemoveItem={handleRemoveItem}
          />

          {/* Expenditures Section */}
          <InvoiceSectionTable
            category="expenditures"
            items={formData.expenditures}
            handleItemChange={handleItemChange}
            handleAddItem={handleAddItem}
            handleRemoveItem={handleRemoveItem}
          />

          {/* Total Amount & Terms */}
          <div className="space-y-4">
            <div className="flex justify-end items-center mt-6">
              <h4 className="text-xl font-bold text-gray-900 mr-4">Total Amount:</h4>
              <span className="text-2xl font-extrabold text-blue-600">
                ₹{formData.totalAmount.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-col">
              <label htmlFor="termsAndConditions" className="mb-1 text-sm font-semibold text-gray-700">Terms and Conditions</label>
              <textarea
                id="termsAndConditions"
                name="termsAndConditions"
                value={formData.termsAndConditions || ''}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                placeholder="Add any specific terms or notes here."
              ></textarea>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8">
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSaving || !isFormReady}
                className={`flex items-center gap-2 px-6 py-3 font-semibold text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 ${isSaving || !isFormReady ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {submitButtonText}
                    Save
                  </>
                )}
              </button>
              {id && (
                <button
                  type="button"
                  onClick={handleShowDeleteModal}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 font-semibold text-red-600 bg-red-100 rounded-full shadow-lg hover:bg-red-200 transition-all duration-200"
                >
                  <Trash2 size={20} />
                  Delete Invoice
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 font-semibold text-gray-600 bg-gray-200 rounded-full shadow-lg hover:bg-gray-300 transition-all duration-200"
            >
              <Ban size={20} />
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full text-center space-y-4">
            <h4 className="text-xl font-bold text-red-700">Confirm Deletion</h4>
            <p className="text-gray-600">Are you sure you want to delete this invoice? This action cannot be undone.</p>
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
              <button
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceForm;

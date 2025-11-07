import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Trash2, PlusCircle, Save, Ban } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// A placeholder for API Base URL. In a real app, this should be in an environment variable.
const API_BASE_URL = 'http://localhost:5000/api';

// --- Utility Functions ---

const calculateTotalAmount = (items) => {
  return (Array.isArray(items) ? items : []).reduce((total, item) => {
    // Materials: quantity * amount. Others (manpowers/expenditures): amount only (implicitly quantity is 1).
    if (item.quantity !== undefined) {
      const quantity = parseFloat(item.quantity) || 0;
      const amount = parseFloat(item.amount) || 0;
      return total + (quantity * amount);
    }
    const amount = parseFloat(item.amount) || 0;
    return total + amount;
  }, 0);
};

// NOTE: This function's endpoint should ideally be for fetching ACTUAL costs for the Invoice.
// Since the structure remains the same as Quotation's fetch, we keep the logic but remember the purpose.
const fetchActualMaterialExpenditures = async (projectId, token) => {
  if (!projectId || !token) return [];

  const finalProjectId = typeof projectId === 'object' ? projectId._id : projectId;

  if (!finalProjectId) return [];
  try {
    // Assuming the actual project material data endpoint is used for Invoice too
    const materialResponse = await fetch(`${API_BASE_URL}/projectMaterialMappings?projectId=${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!materialResponse.ok) {
      console.error(`Failed to fetch actual material expenditure: ${materialResponse.statusText}`);
      return [];
    }
    const fetchedMaterials = await materialResponse.json();

    return fetchedMaterials.map(item => ({
      materialName: item.materialName || 'N/A',
      quantity: parseFloat(item.quantity || 0),
      unit: item.unit || 'Nos',
      amount: parseFloat(item.unitPrice || item.amount || 0),
      gst: parseFloat(item.gst || 0),
    }));
  } catch (err) {
    console.error("Error fetching actual material expenditures:", err);
    return [];
  }
};

// --- InvoiceTable Component (Renamed) ---

const InvoiceTable = React.memo(({ category, items, handleItemChange, handleAddItem, handleRemoveItem }) => {
  // Original QuotationTable logic remains, but name changed for clarity
  const columnConfigs = {
    materials: [
      { field: 'materialName', label: 'Material Name', placeholder: 'Enter material name', type: 'text' },
      { field: 'quantity', label: 'Quantity', type: 'number' },
      { field: 'unit', label: 'Unit', placeholder: 'e.g., Nos, Kg', type: 'text' },
      { field: 'amount', label: 'Amount (per unit)', type: 'number' },
      { field: 'gst', label: 'GST (%)', type: 'number' },
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
  const addButtonText = `Add New ${title}`;

  return (
    <div className="space-y-4">
      <h4 className="text-2xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
        {title} Cost
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
              <th className="py-3 px-4 text-left text-sm font-semibold text-blue-700">Line Total</th>
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
                      value={item[col.field] === undefined || item[col.field] === null ? '' : item[col.field]}
                      onChange={(e) => handleItemChange(category, index, e)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                      placeholder={col.placeholder || ''}
                      min={col.type === 'number' ? '0' : undefined}
                      step={col.type === 'number' ? 'any' : undefined}
                    />
                  </td>
                ))}
                <td className="p-2 text-sm font-medium text-gray-700">
                  {/* Calculate Line Total based on category logic */}
                  {category === 'materials' ?
                    `₹${((parseFloat(item.quantity) || 0) * (parseFloat(item.amount) || 0)).toFixed(2)}` :
                    `₹${(parseFloat(item.amount) || 0).toFixed(2)}`
                  }
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
});


// --- InvoiceForm Component (Renamed) ---

// Component பெயர்: QuotationForm -> InvoiceForm
const InvoiceForm = ({ formTitle, onSubmit, initialData, submitButtonText }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Field names: quotationDate, quotationNumber, quotationFrom -> invoiceDate, invoiceNumber, invoiceFrom
  const [formData, setFormData] = useState(initialData || {
    invoiceDate: new Date().toISOString().slice(0, 10), // Invoice Date
    dueDate: '',
    logo: '',
    invoiceNumber: '', // Invoice Number
    invoiceFrom: '', // Company Name From (Top-level)
    gstFrom: '',
    addressFrom: '',
    contactNumberFrom: '',
    invoiceTo: '', // Client ID to (Top-level)
    invoiceToName: '', // Client Name To
    clientNameTo: '',
    gstTo: '',
    addressTo: '',
    phoneTo: '',
    totalAmount: 0,
    signedDate: '',
    signature: '',
    termsAndConditions: '',
    projectId: '',
    materials: [],
    manpowers: [],
    expenditures: [],
  });
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [profile, setProfile] = useState({});


  const updateCalculations = useCallback((data) => {
    const materialTotal = calculateTotalAmount(data.materials);
    const manpowerTotal = calculateTotalAmount(data.manpowers);
    const expenditureTotal = calculateTotalAmount(data.expenditures);
    return materialTotal + manpowerTotal + expenditureTotal;
  }, []);

  const updateFormWithProjectData = useCallback((project, client, prevData, profileData) => {
    let updatedClientDetails = {};
    if (client && project) {
      updatedClientDetails = {
        invoiceTo: client._id, // Renamed
        invoiceToName: client.clientName || '', // Renamed
        gstTo: project.gst || '',
        addressTo: client.address || '',
        phoneTo: client.phoneNumber || client.phone || '',
      };
    }

    const projectMaterials = (project?.materials || []).map(item => ({
      materialName: item.materialName || '',
      quantity: item.quantity || 0,
      unit: item.unit || 'Nos',
      amount: item.amount || 0,
      gst: item.gst || 0,
    }));

    const projectManpowers = (project?.expenditures || []).filter(item => item.expenditureType === 'Salary').map(item => ({
      manpowerName: item.expenditureName || item.manpowerName || '',
      role: item.role || '',
      amount: item.amount || 0,
    }));

    const projectExpenditures = (project?.expenditures || []).filter(item => item.expenditureType === 'Other').map(item => ({
      expenditureName: item.expenditureName || '',
      description: item.description || '',
      amount: item.amount || 0,
    }));

    const materialsToUse = prevData.materials?.length > 0 ? prevData.materials : projectMaterials;
    const manpowersToUse = prevData.manpowers?.length > 0 ? prevData.manpowers : projectManpowers;
    const expendituresToUse = prevData.expenditures?.length > 0 ? prevData.expenditures : projectExpenditures;


    const newFormData = {
      ...prevData,
      ...updatedClientDetails,
      // Load 'From' details from profile (Renamed)
      invoiceFrom: profileData?.profile?.companyName || '',
      gstFrom: profileData?.profile?.gst || '',
      addressFrom: profileData?.profile?.address || '',
      contactNumberFrom: profileData?.profile?.contactNumber || '',

      // ITEMS-ஐப் புதுப்பிக்க (Actual Data-வைப் பயன்படுத்துகிறோம்)
      materials: materialsToUse,
      manpowers: manpowersToUse,
      expenditures: expendituresToUse,

      // Retain existing fields from loaded invoice data if available (Renamed)
      invoiceDate: prevData.invoiceDate || new Date().toISOString().slice(0, 10),
      dueDate: prevData.dueDate || '',
      logo: prevData.logo || '',
      invoiceNumber: prevData.invoiceNumber || '',
      termsAndConditions: prevData.termsAndConditions || '',
      signedDate: prevData.signedDate || '',
      signature: prevData.signature || '',
      projectId: prevData.projectId || project?._id || '',
    };

    return { ...newFormData, totalAmount: updateCalculations(newFormData) };
  }, [updateCalculations]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication is required. Please log in.');
      navigate('/login');
      return;
    }

    try {
      const [projectsRes, clientsRes, profileRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/projects`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/clients`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/users/profile`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      const projectsData = projectsRes.status === 'fulfilled' && projectsRes.value.ok ? await projectsRes.value.json() : [];
      const clientsData = clientsRes.status === 'fulfilled' && clientsRes.value.ok ? await clientsRes.value.json() : [];
      const profileData = profileRes.status === 'fulfilled' && profileRes.value.ok ? await profileRes.value.json() : {};

      setProjects(projectsData);
      setClients(clientsData);
      setProfile(profileData);

      // Fetching existing Invoice Data (Changed endpoint)
      let loadedInvoiceData = initialData && Object.keys(initialData).length > 0 ? initialData : {};

      if (id) {
        // Fetch existing invoice data via URL ID
        const invoiceRes = await fetch(`${API_BASE_URL}/invoices/${id}`, { // 🎯 API Endpoint Changed
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (invoiceRes.ok) {
          loadedInvoiceData = await invoiceRes.json();
        } else {
          toast.error('Failed to fetch invoice data.');
        }
      }

      // --- Project ID-ஐப் பிரித்தெடுத்தல் மற்றும் சரிபார்த்தல் ---

      let currentProjectId = loadedInvoiceData.projectId;

      if (typeof currentProjectId === 'object' && currentProjectId !== null && currentProjectId._id) {
        currentProjectId = currentProjectId._id;
      } else if (loadedInvoiceData.project && loadedInvoiceData.project._id) {
        currentProjectId = loadedInvoiceData.project._id;
      }

      let selectedProject = projectsData.find(p => p && p._id === currentProjectId);

      // Client ID-ஐப் பிரித்தெடுத்தல் (invoiceTo.clientId -> invoiceTo.clientId)
      let client = clientsData.find(c => c && c._id === (selectedProject?.client?._id || loadedInvoiceData.invoiceTo?.clientId)); // Renamed field

      // -----------------------------------------------------------------

      // If NEW INVOICE or if a project is pre-selected, load ACTUAL Project Data
      if (!id && currentProjectId) {

        // 1. Fetch ALL Expenditures (Salary & Other)
        const allExpenditureResponse = await fetch(`${API_BASE_URL}/expenditures?projectId=${currentProjectId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const fetchedExpenditures = allExpenditureResponse.ok ? await allExpenditureResponse.json() : [];

        // 2. Fetch Actual Materials
        const fetchedMaterials = await fetchActualMaterialExpenditures(currentProjectId, token);


        // 3. Map Actual Expenditures to Invoice Form State structure
        loadedInvoiceData.manpowers = fetchedExpenditures
          .filter(item => item.expenditureType === 'Salary')
          .map(item => ({
            manpowerName: item.manpowerName || 'N/A',
            role: item.description || 'N/A',
            amount: parseFloat(item.amount || 0),
          }));

        loadedInvoiceData.expenditures = fetchedExpenditures
          .filter(item => item.expenditureType === 'Other')
          .map(item => ({
            expenditureName: item.expenditureName || 'N/A',
            description: item.description || 'N/A',
            amount: parseFloat(item.amount || 0),
          }));

        loadedInvoiceData.materials = fetchedMaterials;
      }
      // END ACTUAL DATA LOADING LOGIC 

      // Profile Data மற்றும் Project ID-ஐ இறுதிப் படிவத்தில் அமைத்தல்
      loadedInvoiceData.projectId = currentProjectId || '';

      if (!id && Object.keys(profileData).length > 0) {
        loadedInvoiceData = {
          ...loadedInvoiceData,
          // Renamed Fields
          invoiceFrom: profileData.profile?.companyName || '',
          gstFrom: profileData.profile?.gst || '',
          addressFrom: profileData.profile?.address || '',
          contactNumberFrom: profileData.profile?.contactNumber || '',
        };
      }

      const newFormData = updateFormWithProjectData(selectedProject, client, loadedInvoiceData, profileData);

      newFormData.totalAmount = updateCalculations(newFormData);

      setFormData(newFormData);
    } catch (error) {
      console.error('An unexpected error occurred during initial data fetch:', error);
      toast.error(`An unexpected error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [navigate, id, initialData, updateFormWithProjectData, updateCalculations]);

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

  // Project Change Handler
  const handleProjectChange = useCallback(async (e) => {
    const projectId = e.target.value;
    // ... (The rest of handleProjectChange logic remains similar, updating 'invoiceTo' related fields)
    if (!projectId) {
      setFormData(prevData => ({
        ...prevData,
        projectId: '',
        // Client details must be explicitly cleared when project is deselected (Renamed fields)
        invoiceTo: '',
        invoiceToName: '', gstTo: '', addressTo: '', phoneTo: '',
        materials: [], manpowers: [], expenditures: [], totalAmount: 0
      }));
      return;
    }

    setLoading(true);
    try {
      const selectedProject = projects.find(p => p && p._id === projectId);
      const client = clients.find(c => c && c._id === selectedProject?.client?._id);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication failed. Please log in.');
        setLoading(false);
        return;
      }

      // --- Fetch Actual Project Data ---
      const allExpenditureResponse = await fetch(`${API_BASE_URL}/expenditures?projectId=${projectId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const fetchedExpenditures = allExpenditureResponse.ok ? await allExpenditureResponse.json() : [];
      const fetchedMaterials = await fetchActualMaterialExpenditures(projectId, token);
      // ---------------------------------

      // Map Actual Expenses to structure
      const actualItems = {};
      actualItems.manpowers = fetchedExpenditures
        .filter(item => item.expenditureType === 'Salary')
        .map(item => ({ manpowerName: item.manpowerName || 'N/A', role: item.description || 'N/A', amount: parseFloat(item.amount || 0) }));

      actualItems.expenditures = fetchedExpenditures
        .filter(item => item.expenditureType === 'Other')
        .map(item => ({ expenditureName: item.expenditureName || 'N/A', description: item.description || 'N/A', amount: parseFloat(item.amount || 0) }));

      actualItems.materials = fetchedMaterials;


      // Build the new form data by overwriting old project-specific fields
      setFormData(prevData => {

        // Client Details to be updated (Renamed fields)
        const updatedClientDetails = client ? {
          invoiceTo: client._id,
          invoiceToName: client.clientName || '',
          gstTo: selectedProject?.gst || '',
          addressTo: client.address || '',
          phoneTo: client.phoneNumber || client.phone || '',
        } : {
          invoiceTo: '',
          invoiceToName: '',
          gstTo: '',
          addressTo: '',
          phoneTo: '',
        };

        const newFormData = {
          ...prevData,
          projectId: projectId,
          ...updatedClientDetails,
          materials: actualItems.materials,
          manpowers: actualItems.manpowers,
          expenditures: actualItems.expenditures,
        };

        newFormData.totalAmount = updateCalculations(newFormData);

        return newFormData;
      });

    } catch (error) {
      console.error('Failed to get data for the project:', error);
      toast.error('Could not load project data.');
    } finally {
      setLoading(false);
    }
  }, [projects, clients, updateCalculations]);

  const handleItemChange = useCallback((category, index, e) => {
    // ... (handleItemChange logic unchanged)
    const { name, value, type } = e.target;
    setFormData(prevData => {
      const updatedItems = [...(prevData[category] || [])];

      let finalValue = value;
      if (type === 'number') {
        finalValue = value === '' ? 0 : value;
      }

      const updatedItem = { ...updatedItems[index], [name]: finalValue };
      updatedItems[index] = updatedItem;

      const newData = { ...prevData, [category]: updatedItems };
      return { ...newData, totalAmount: updateCalculations(newData) };
    });
  }, [updateCalculations]);

  const handleAddItem = useCallback((category) => {
    // ... (handleAddItem logic unchanged)
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
      const updatedItems = [...(prevData[category] || []), newItem];
      const newData = { ...prevData, [category]: updatedItems };
      return { ...newData, totalAmount: updateCalculations(newData) };
    });
  }, [updateCalculations]);

  const handleRemoveItem = useCallback((category, index) => {
    // ... (handleRemoveItem logic unchanged)
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
      const response = await fetch(`${API_BASE_URL}/invoices/${id}`, { // 🎯 API Endpoint Changed
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice.');
      }

      toast.success('Invoice successfully deleted.');
      navigate('/invoices'); // 🎯 Navigation Route Changed
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      toast.error(`Failed to delete invoice: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  /**
   * Formats the form data for the backend API, using 'invoiceFrom' and 'invoiceTo'
   */
  const formatDataForBackend = (data) => {
    let formattedData = { ...data };

    // --- ID மற்றும் Profile தகவலைப் பிரித்தெடுத்தல் ---
    const userProfile = profile.profile || profile;
    const profileId = userProfile._id;
    const clientId = data.invoiceTo; // Renamed

    // CRITICAL FIX: Fallback Logic (Renamed fields)
    const companyName = data.invoiceFrom || userProfile.companyName || '';
    const gst = data.gstFrom || userProfile.gst || '';
    const address = data.addressFrom || userProfile.address || '';
    const contactNumber = data.contactNumberFrom || userProfile.contactNumber || '';

    // --- Items-ஐப் புதுப்பித்தல் மற்றும் ஒன்றிணைத்தல் (Expenditures) ---
    const combinedExpenditures = [
      // ... (Expenditure logic remains same)
      ...(formattedData.manpowers || []).map(item => ({
        expenditureName: item.manpowerName,
        role: item.role,
        amount: parseFloat(item.amount) || 0,
        expenditureType: 'Salary',
      })),
      ...(formattedData.expenditures || []).map(item => ({
        expenditureName: item.expenditureName,
        description: item.description,
        amount: parseFloat(item.amount) || 0,
        expenditureType: 'Other',
      }))
    ];

    delete formattedData.manpowers;
    delete formattedData.expenditures;
    formattedData.expenditures = combinedExpenditures;

    // Materials: Number Conversion
    formattedData.materials = (formattedData.materials || []).map(item => ({
      ...item,
      quantity: parseFloat(item.quantity) || 0,
      amount: parseFloat(item.amount) || 0,
      gst: parseFloat(item.gst) || 0,
    }));

    formattedData.totalAmount = updateCalculations(formattedData);

    // --- Redundant Top-Level Fields-ஐ நீக்குதல் (மிக முக்கியம்) ---
    // Renamed fields to delete
    delete formattedData.invoiceFrom; // 🎯 Renamed
    delete formattedData.gstFrom;
    delete formattedData.addressFrom;
    delete formattedData.contactNumberFrom;
    delete formattedData.invoiceTo; // 🎯 Renamed
    delete formattedData.invoiceToName; // 🎯 Renamed
    delete formattedData.gstTo;
    delete formattedData.addressTo;
    delete formattedData.contactNumberTo;

    // --- Final Data Structure for Backend ---
    return {
      ...formattedData,

      // 🎯 Renamed Nested Object
      invoiceFrom: {
        companyName: companyName,
        gst: gst,
        address: address,
        contactNumber: contactNumber,
        profileId: profileId
      },

      // 🎯 Renamed Nested Object
      invoiceTo: {
        clientId: clientId,
        name: data.invoiceToName || '',
        gst: data.gstTo || '',
        address: data.addressTo || '',
        contactNumber: data.contactNumberTo || '',
      },

      // Ensure date formats are correct for backend (ISO String) (Renamed field)
      invoiceDate: new Date(data.invoiceDate).toISOString(),
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      logo: data.logo || '',
      signedDate: data.signedDate ? new Date(data.signedDate).toISOString() : undefined,
      signature: data.signature ? data.signature : undefined,
      // invoiceNumber is already in formattedData
    };
  };

  // handleSave Function (Renamed)

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    if (!formData.projectId) {
      toast.error('Please select a project before saving.');
      setIsSaving(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication failed. Please log in.');
      navigate('/login');
      setIsSaving(false);
      return;
    }

    // CRITICAL FIX: Edit செய்யப்பட வேண்டிய Invoice ID-ஐக் கண்டறிதல்.
    let invoiceId = id;
    if (!invoiceId && initialData && initialData._id) {
      invoiceId = initialData._id;
    }

    const isEditing = !!invoiceId;
    const method = isEditing ? 'PUT' : 'POST';
    // URL-ஐ அமைக்க, இப்போது கண்டறியப்பட்ட invoiceId-ஐப் பயன்படுத்துகிறோம்.
    const url = isEditing ? `${API_BASE_URL}/invoices/${invoiceId}` : `${API_BASE_URL}/invoices`; // 🎯 API Endpoint Changed

    const dataToSend = formatDataForBackend(formData);

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
        throw new Error(errorData.message || `Server Error ${isEditing ? 'updating' : 'creating'} invoice`);
      }

      const result = await response.json();
      toast.success(`Invoice successfully ${isEditing ? 'updated' : 'saved'}.`);

      if (onSubmit) {
        onSubmit(result);
      } else {
        // Navigation Route Changed
        navigate(`/invoices/edit/${result._id || invoiceId}`, { replace: true });
      }
    } catch (error) {
      console.error('Failed to save invoice:', error);
      toast.error(`Failed to save invoice: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- JSX (HTML Structure) ---

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-3xl shadow-2xl font-sans text-gray-800 my-8 border-t-8 border-blue-600">
      <Toaster position="top-center" />
      <h3 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-4 border-gray-200 pb-4">
        {formTitle || (id ? 'Edit Invoice' : 'Create New Invoice')} {/* Changed title fallback */}
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
              <label htmlFor="projectId" className="mb-1 text-sm font-semibold text-gray-700">Selected Project <span className="text-red-500">*</span></label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleProjectChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>{project.projectName}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="invoiceToName" className="mb-1 text-sm font-semibold text-gray-700">Client Name</label> {/* Changed label */}
              <input type="text" value={formData.invoiceToName} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="invoiceDate" className="mb-1 text-sm font-semibold text-gray-700">Invoice Date</label> {/* Changed label */}
              <input
                type="date"
                id="invoiceDate" // Renamed ID
                name="invoiceDate" // Renamed Name
                value={formData.invoiceDate} // State field renamed
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
              />
            </div>
            {/* The rest of the JSX needs to be adapted: */}
            <div className="flex flex-col">
              <label htmlFor="dueDate" className="mb-1 text-sm font-semibold text-gray-700">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="invoiceNumber" className="mb-1 text-sm font-semibold text-gray-700">Invoice Number</label> {/* Changed label and name */}
              <input
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                placeholder="INV-001"
              />
            </div>
          </div>

          {/* From & To Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* From Details */}
            <div className="bg-blue-50 p-6 rounded-xl shadow-md space-y-4">
              <h4 className="text-xl font-bold text-blue-800">From Invoice</h4>
              {Object.keys(profile).length === 0 ? (
                <p className="text-sm text-red-500">
                  Profile data not available. Please ensure your user profile is set up.
                </p>
              ) : (
                <>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">Company Name</label>
                    <input type="text" name='invoiceFrom' value={formData.invoiceFrom} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">GST No</label>
                    <input type="text" value={formData.gstFrom} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">Address</label>
                    <input type="text" value={formData.addressFrom} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">phone Number</label>
                    <input type="text" value={formData.contactNumberFrom} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
                  </div>
                </>
              )}
            </div>

            {/* To Details */}
            <div className="bg-green-50 p-6 rounded-xl shadow-md space-y-4">
              <h4 className="text-xl font-bold text-green-800">To Invoice</h4>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Client Name</label>
                <input type="text" value={formData.invoiceToName} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">GST No</label>
                <input type="text" value={formData.gstTo} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Address</label>
                <input type="text" value={formData.addressTo} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Phone Number</label>
                <input type="text" value={formData.phoneTo} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Items Section (Using the renamed table component) */}
          <hr className="my-8 border-gray-200" />

          <InvoiceTable // 🎯 Renamed Component
            category="materials"
            items={formData.materials}
            handleItemChange={handleItemChange}
            handleAddItem={handleAddItem}
            handleRemoveItem={handleRemoveItem}
          />

          <hr className="my-8 border-gray-200" />

          <InvoiceTable // 🎯 Renamed Component
            category="manpowers"
            items={formData.manpowers}
            handleItemChange={handleItemChange}
            handleAddItem={handleAddItem}
            handleRemoveItem={handleRemoveItem}
          />

          <hr className="my-8 border-gray-200" />

          <InvoiceTable // 🎯 Renamed Component
            category="expenditures"
            items={formData.expenditures}
            handleItemChange={handleItemChange}
            handleAddItem={handleAddItem}
            handleRemoveItem={handleRemoveItem}
          />

          {/* Footer Details */}
          <div className="space-y-4">
            <h4 className="text-2xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
              Terms & Signature
            </h4>
            <div className="flex flex-col">
              <label htmlFor="termsAndConditions" className="mb-1 text-sm font-semibold text-gray-700">Terms and Conditions</label>
              <textarea
                id="termsAndConditions"
                name="termsAndConditions"
                value={formData.termsAndConditions}
                onChange={handleChange}
                rows="4"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter payment terms, guarantees, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label htmlFor="signedDate" className="mb-1 text-sm font-semibold text-gray-700">Signed Date</label>
                <input
                  type="date"
                  id="signedDate"
                  name="signedDate"
                  value={formData.signedDate}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="signature" className="mb-1 text-sm font-semibold text-gray-700">Signature (Image URL/Path)</label>
                <input
                  type="text"
                  id="signature"
                  name="signature"
                  value={formData.signature}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., /images/signature.png"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <label htmlFor="totalAmount" className="mb-1 text-sm font-semibold text-gray-700">Total Amount</label>
            <input type="text" value={`₹${formData.totalAmount.toFixed(2)}`} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed font-bold text-lg text-blue-700" />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-200">
            {id && (
              <button
                type="button"
                onClick={handleShowDeleteModal}
                disabled={isSaving}
                className="px-6 py-3 bg-red-100 text-red-700 rounded-full shadow-md hover:bg-red-200 transition-colors duration-200 flex items-center gap-2 font-semibold disabled:opacity-50"
              >
                <Trash2 size={20} />
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full shadow-md hover:bg-gray-300 transition-colors duration-200 flex items-center gap-2 font-semibold disabled:opacity-50"
            >
              <Ban size={20} />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.projectId}
              className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {submitButtonText || (id ? 'Update Invoice' : 'Create Invoice')}
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal (Same logic, just updated text) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h4 className="text-xl font-bold mb-4 text-red-600">Confirm Deletion</h4>
            <p className="mb-6 text-gray-700">Are you sure you want to delete this invoice? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceForm;
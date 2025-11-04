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

const fetchActualMaterialExpenditures = async (projectId, token) => {
  if (!projectId || !token) return [];
  try {
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
    
    // IMPORTANT MAPPING: material mappings might have 'finalAmount' or 'totalCost' 
    // but the quotation form uses 'quantity' * 'amount'. We need unitPrice.
    return fetchedMaterials.map(item => ({
      materialName: item.materialName || 'N/A',
      quantity: parseFloat(item.quantity || 0),
      unit: item.unit || 'Nos',
      // We use the unitPrice if available for calculation in the form
      amount: parseFloat(item.unitPrice || item.amount || 0), 
      gst: parseFloat(item.gst || 0),
    }));
  } catch (err) {
    console.error("Error fetching actual material expenditures:", err);
    return [];
  }
};

// --- QuotationTable Component (Remains same) ---

const QuotationTable = React.memo(({ category, items, handleItemChange, handleAddItem, handleRemoveItem }) => {
// ... (Your QuotationTable component code remains here, unchanged)
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
                                            // Use col.type === 'number' ? item[col.field] : (item[col.field] || '') to handle number fields not showing '0' initially
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


// --- QuotationForm Component ---

const QuotationForm = ({ formTitle, onSubmit, initialData, submitButtonText }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    quotationDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    quotationNumber: '',
    quotationFrom: '',
    gstFrom: '',
    addressFrom: '',
    contactNumberFrom: '',
    quotationTo: '',
    quotationToName: '',
    clientNameTo: '',
    gstTo: '',
    addressTo: '',
    phoneTo: '',
    totalAmount: 0,
    signedDate: '',
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
        quotationTo: client._id,
        quotationToName: client.clientName || '',
        gstTo: project.gst || '',
        addressTo: client.address || '',
        phoneTo: client.phoneNumber || client.phone || '', // Check both fields
      };
    }

    // NOTE: Project's ESTIMATED items (Usually not used when fetching actuals, but kept as fallback)
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

    // Use the ACTUAL data if it was fetched and exists in prevData (which is `loadedQuotationData`)
    const materialsToUse = prevData.materials?.length > 0 ? prevData.materials : projectMaterials;
    const manpowersToUse = prevData.manpowers?.length > 0 ? prevData.manpowers : projectManpowers;
    const expendituresToUse = prevData.expenditures?.length > 0 ? prevData.expenditures : projectExpenditures;


    const newFormData = {
      ...prevData,
      ...updatedClientDetails,
      // Load 'From' details from profile
      quotationFrom: profileData?.profile?.companyName || '',
      gstFrom: profileData?.profile?.gst || '',
      addressFrom: profileData?.profile?.address || '',
      contactNumberFrom: profileData?.profile?.contactNumber || '',

      // 🎯 ITEMS-ஐப் புதுப்பிக்க (Actual Data-வைப் பயன்படுத்துகிறோம்)
      materials: materialsToUse,
      manpowers: manpowersToUse,
      expenditures: expendituresToUse,

      // Retain existing fields from loaded quotation data if available
      quotationDate: prevData.quotationDate || new Date().toISOString().slice(0, 10),
      dueDate: prevData.dueDate || '',
      quotationNumber: prevData.quotationNumber || '',
      termsAndConditions: prevData.termsAndConditions || '',
      signedDate: prevData.signedDate || '',
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

      let loadedQuotationData = initialData || {};

      if (id) {
        // Fetch existing quotation data
        const quotationRes = await fetch(`${API_BASE_URL}/quotations/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (quotationRes.ok) {
          loadedQuotationData = await quotationRes.json();
          // NOTE: For existing quotation, we trust the saved item lists, 
          // so we don't fetch actuals here.
        } else {
          toast.error('Failed to fetch quotation data.');
        }
      }

      const selectedProjectId = loadedQuotationData.projectId || (loadedQuotationData.project && loadedQuotationData.project._id);
      let selectedProject = projectsData.find(p => p && p._id === selectedProjectId);
      let client = clientsData.find(c => c && c._id === (selectedProject?.client?._id || loadedQuotationData.quotationTo?.clientId)); // Check for nested clientId

      // If NEW QUOTATION or if a project is pre-selected, load ACTUAL Project Data
      if (!id && selectedProjectId) {
        // 1. Fetch ALL Expenditures (Salary & Other)
        const allExpenditureResponse = await fetch(`${API_BASE_URL}/expenditures?projectId=${selectedProjectId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const fetchedExpenditures = allExpenditureResponse.ok ? await allExpenditureResponse.json() : [];

        // 2. Fetch Actual Materials
        const fetchedMaterials = await fetchActualMaterialExpenditures(selectedProjectId, token);


        // 3. Map Actual Expenditures to Quotation Form State structure
        loadedQuotationData.manpowers = fetchedExpenditures
          .filter(item => item.expenditureType === 'Salary')
          .map(item => ({
            manpowerName: item.manpowerName || 'N/A',
            role: item.description || 'N/A', // Using description for role
            amount: parseFloat(item.amount || 0),
          }));

        loadedQuotationData.expenditures = fetchedExpenditures
          .filter(item => item.expenditureType === 'Other')
          .map(item => ({
            expenditureName: item.expenditureName || 'N/A',
            description: item.description || 'N/A',
            amount: parseFloat(item.amount || 0),
          }));

        loadedQuotationData.materials = fetchedMaterials;
      }
      // END ACTUAL DATA LOADING LOGIC (Only for new/pre-selected project)

      if (!id && Object.keys(profileData).length > 0) {
        loadedQuotationData = {
          ...loadedQuotationData,
          quotationFrom: profileData.profile?.companyName || '',
          gstFrom: profileData.profile?.gst || '',
          addressFrom: profileData.profile?.address || '',
          contactNumberFrom: profileData.profile?.contactNumber || '',
        };
      }

      const newFormData = updateFormWithProjectData(selectedProject, client, loadedQuotationData, profileData);

      // Recalculate total amount after loading all line items
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

  // 🎯 Project Change Handler - ACTUAL data loading logic
  const handleProjectChange = useCallback(async (e) => {
    const projectId = e.target.value;

    if (!projectId) {
      setFormData(prevData => ({ 
           ...prevData, 
           projectId: '', 
           quotationTo: '', 
           quotationToName: '', gstTo: '', addressTo: '', phoneTo: '', 
           materials: [], manpowers: [], expenditures: [], totalAmount: 0 
        }));
      return;
    }

    setLoading(true);
    try {
      const selectedProject = projects.find(p => p && p._id === projectId);
      const client = clients.find(c => c && c._id === selectedProject?.client?._id);

      // Start with the existing non-item fields from the current formData state
      const baseFormData = { 
            ...formData,
            // Clear items before loading new project data
            materials: [],
            manpowers: [],
            expenditures: [],
        };

      // 1. Get Token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication failed. Please log in.');
        setLoading(false);
        return;
      }

      // 2. Fetch ALL Expenditures (Salary & Other)
      const allExpenditureResponse = await fetch(`${API_BASE_URL}/expenditures?projectId=${projectId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const fetchedExpenditures = allExpenditureResponse.ok ? await allExpenditureResponse.json() : [];

      // 3. Fetch Actual Materials 
      const fetchedMaterials = await fetchActualMaterialExpenditures(projectId, token);

      // 4. Map Actual Expenses to temporary object
      const actualItems = {};
        
      actualItems.manpowers = fetchedExpenditures
        .filter(item => item.expenditureType === 'Salary')
        .map(item => ({
          manpowerName: item.manpowerName || 'N/A',
          role: item.description || 'N/A', 
          amount: parseFloat(item.amount || 0)
        }));

      actualItems.expenditures = fetchedExpenditures
        .filter(item => item.expenditureType === 'Other')
        .map(item => ({
          expenditureName: item.expenditureName || 'N/A',
          description: item.description || 'N/A',
          amount: parseFloat(item.amount || 0)
        }));

      actualItems.materials = fetchedMaterials;
      // END ACTUAL DATA LOADING LOGIC

      // 5. Combine all data
      const combinedData = {
        ...baseFormData,
        ...actualItems,
        projectId: projectId,
      };
        
      // Update client/profile details
      const newFormData = updateFormWithProjectData(selectedProject, client, combinedData, profile);
      
      // 6. CRITICAL: Recalculate Total after loading actual items
      newFormData.totalAmount = updateCalculations(newFormData);

      setFormData(newFormData);

    } catch (error) {
      console.error('Failed to get data for the project:', error);
      toast.error('Could not load project data.');
    } finally {
      setLoading(false);
    }
  }, [projects, clients, formData, profile, updateFormWithProjectData, updateCalculations]);

  const handleItemChange = useCallback((category, index, e) => {
    // ... (Your handleItemChange code remains here, unchanged)
        const { name, value, type } = e.target;
        setFormData(prevData => {
            const updatedItems = [...(prevData[category] || [])];

            let finalValue = value;
            // Convert number inputs to actual numbers or 0
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
    // ... (Your handleAddItem code remains here, unchanged)
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
    // ... (Your handleRemoveItem code remains here, unchanged)
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
    // ... (Your handleDelete code remains here, unchanged)
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
            const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to delete quotation.');
            }

            toast.success('Quotation successfully deleted.');
            navigate('/quotations');
        } catch (error) {
            console.error('Failed to delete quotation:', error);
            toast.error(`Failed to delete quotation: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  /**
   * Formats the form data for the backend API, specifically combining manpowers and
   * expenditures back into a single 'expenditures' array with a type field.
   */
  const formatDataForBackend = (data) => {
    const formattedData = { ...data };

    // 🎯 CRITICAL FIX 1: Add profileId (User's ID)
    const profileId = profile.profile?._id || profile._id; // profile state-ஐப் பயன்படுத்துகிறோம்

    // 🎯 CRITICAL FIX 2: Ensure client ID is present
    // The clientId should already be correctly set in formData.quotationTo from handleProjectChange
    const clientId = data.quotationTo; 

    const combinedExpenditures = [
      ...(formattedData.manpowers || []).map(item => ({
        expenditureName: item.manpowerName,
        role: item.role,
        amount: parseFloat(item.amount) || 0,
        expenditureType: 'Salary', // Categorize manpowers as 'Salary'
      })),
      ...(formattedData.expenditures || []).map(item => ({
        expenditureName: item.expenditureName,
        description: item.description,
        amount: parseFloat(item.amount) || 0,
        expenditureType: 'Other', // Categorize expenditures as 'Other'
      }))
    ];

    delete formattedData.manpowers;
    delete formattedData.expenditures;
    formattedData.expenditures = combinedExpenditures;
    formattedData.materials = (formattedData.materials || []).map(item => ({
      ...item,
      quantity: parseFloat(item.quantity) || 0,
      amount: parseFloat(item.amount) || 0,
      gst: parseFloat(item.gst) || 0,
    }));

    // Ensure all top-level numbers are correct, especially the totalAmount
    formattedData.totalAmount = updateCalculations(formattedData);

    return {
      ...formattedData,
      // Manually add the required nested fields (Backend expects { clientId: 'id' })
      quotationFrom: {
        profileId: profileId
      },
      quotationTo: {
        clientId: clientId
      },
      // Ensure date formats are correct for backend
      quotationDate: new Date(formattedData.quotationDate).toISOString(),
      dueDate: formattedData.dueDate ? new Date(formattedData.dueDate).toISOString() : undefined,
      signedDate: formattedData.signedDate ? new Date(formattedData.signedDate).toISOString() : undefined,
    };
  };
  const handleSave = async (e) => {
    // ... (Your handleSave code remains here, unchanged)
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

        const isEditing = !!id;
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${API_BASE_URL}/quotations/${id}` : `${API_BASE_URL}/quotations`;

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
                throw new Error(errorData.message || 'Failed to save quotation.');
            }

            const result = await response.json();
            toast.success(`Quotation successfully ${isEditing ? 'updated' : 'saved'}.`);
            if (onSubmit) {
                onSubmit(result);
            } else {
                // Navigate to the edit view of the newly created/updated quotation
                navigate(`/quotations/edit/${result._id || id}`, { replace: true });
            }
        } catch (error) {
            console.error('Failed to save quotation:', error);
            toast.error(`Failed to save quotation: ${error.message}`);
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
              <label htmlFor="projectId" className="mb-1 text-sm font-semibold text-gray-700">selected Project <span className="text-red-500">*</span></label>
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
              <label htmlFor="quotationToName" className="mb-1 text-sm font-semibold text-gray-700">Quotation Name</label>
              <input type="text" value={formData.quotationToName} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="quotationDate" className="mb-1 text-sm font-semibold text-gray-700">Quotation Date</label>
              <input
                type="date"
                id="quotationDate"
                name="quotationDate"
                value={formData.quotationDate}
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
                value={formData.dueDate}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus-ring-blue-500 transition-shadow duration-200"
              />
            </div>
            <div className="flex flex-col md:col-span-2">
              <label htmlFor="quotationNumber" className="mb-1 text-sm font-semibold text-gray-700">Quotation No</label>
              <input
                type="text"
                id="quotationNumber"
                name="quotationNumber"
                value={formData.quotationNumber}
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
              <h4 className="text-xl font-bold text-blue-800">From Quotation</h4>
              {Object.keys(profile).length === 0 ? (
                <p className="text-sm text-red-500">
                  Profile data not available. Please ensure your user profile is set up.
                </p>
              ) : (
                <>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">Company Name</label>
                    <input type="text" value={formData.quotationFrom} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
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
              <h4 className="text-xl font-bold text-green-800">To Quotation</h4>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Client Name</label>
                <input type="text" value={formData.quotationToName} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
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

          {/* Materials Section */}
          <QuotationTable
            category="materials"
            items={formData.materials}
            handleItemChange={handleItemChange}
            handleAddItem={handleAddItem}
            handleRemoveItem={handleRemoveItem}
          />

          {/* Manpower Section */}
          <QuotationTable
            category="manpowers"
            items={formData.manpowers}
            handleItemChange={handleItemChange}
            handleAddItem={handleAddItem}
            handleRemoveItem={handleRemoveItem}
          />

          {/* Expenditures Section */}
          <QuotationTable
            category="expenditures"
            items={formData.expenditures}
            handleItemChange={handleItemChange}
            handleAddItem={handleAddItem}
            handleRemoveItem={handleRemoveItem}
          />

          {/* Terms & Conditions and Signed Date */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <label htmlFor="termsAndConditions" className="mb-1 text-sm font-semibold text-gray-700">Terms and Conditions</label>
              <textarea
                id="termsAndConditions"
                name="termsAndConditions"
                value={formData.termsAndConditions}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200 h-32"
                placeholder="Enter any terms and conditions here..."
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="signedDate" className="mb-1 text-sm font-semibold text-gray-700">Signed Date</label>
              <input
                type="date"
                id="signedDate"
                name="signedDate"
                value={formData.signedDate}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
              />
            </div>
          </div>

          {/* Total Amount & Buttons */}
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 mt-8">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">Total Amount:</span>
              <span className="text-3xl font-extrabold text-blue-600">₹{formData.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Cancel Button - now working correctly with `Maps(-1)` */}
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-red-100 text-red-600 rounded-full shadow-sm hover:bg-red-200 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                disabled={isSaving}
              >
                <Ban size={20} />
                Cancel
              </button>

              {/* Delete Button (only shown for existing quotations) */}
              {id && (
                <button
                  type="button"
                  onClick={handleShowDeleteModal}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-full shadow-sm hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                  disabled={isSaving}
                >
                  <Trash2 size={20} />
                  Delete
                </button>
              )}

              {/* Save Button */}
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 font-semibold"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {submitButtonText || (id ? 'Update' : 'Save')}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal - fixed to use proper component state */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm mx-auto relative transform transition-all scale-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="mt-4 text-xl leading-6 font-medium text-gray-900">Delete Quotation</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this quotation? This action cannot be undone.
                </p>
              </div>
              <div className="mt-5 sm:mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 transition-colors"
                  onClick={handleCloseDeleteModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationForm;

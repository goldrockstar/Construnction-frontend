// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { Loader2, Trash2, PlusCircle, Save, Ban } from 'lucide-react';
// import { Toaster, toast } from 'react-hot-toast';

// // Base URL for the API. This is where all data will be fetched from.
// // There is no mock data used in this component.
// const API_BASE_URL = 'http://localhost:5000/api';

// /**
//  * A helper function to calculate the total amount for a list of items.
//  * Handles cases for both materials (with quantity) and other items (without).
//  */
// const calculateTotalAmount = (items) => {
//   return (Array.isArray(items) ? items : []).reduce((total, item) => {
//     if (item.quantity === undefined) {
//       return total + (parseFloat(item.amount) || 0);
//     }
//     const quantity = parseFloat(item.quantity) || 1;
//     const amount = parseFloat(item.amount) || 0;
//     return total + (quantity * amount);
//   }, 0);
// };

// /**
//  * A reusable component for rendering and managing the different item tables (materials, manpower, expenditures).
//  */
// const QuotationTable = ({ category, items, handleItemChange, handleAddItem, handleRemoveItem }) => {
//   const columnConfigs = {
//     materials: [
//       { field: 'materialName', label: 'Material Name', placeholder: 'Enter material name', type: 'text' },
//       { field: 'quantity', label: 'Quantity', type: 'number' },
//       { field: 'unit', label: 'Unit', placeholder: 'e.g., Nos, Kg', type: 'text' },
//       { field: 'amount', label: 'Amount', type: 'number' },
//       { field: 'gst', label: 'GST', type: 'text' },
//     ],
//     manpowers: [
//       { field: 'manpowerName', label: 'Name', placeholder: 'Manpower name', type: 'text' },
//       { field: 'role', label: 'Role', placeholder: 'e.g., driver', type: 'text' },
//       { field: 'amount', label: 'Amount', type: 'number' },
//     ],
//     expenditures: [
//       { field: 'expenditureName', label: 'Expenditure Name', placeholder: 'e.g., food', type: 'text' },
//       { field: 'description', label: 'Description', placeholder: 'e.g., description', type: 'text' },
//       { field: 'amount', label: 'Amount', type: 'number' },
//     ],
//   };

//   const columns = columnConfigs[category];
//   const title = category.charAt(0).toUpperCase() + category.slice(1).replace('s', '');
//   const addButtonText = `Add New`;

//   return (
//     <div className="space-y-4">
//       <h4 className="text-2xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
//         {title}
//       </h4>
//       <div className="overflow-x-auto rounded-lg shadow-md">
//         <table className="min-w-full bg-white border border-gray-200">
//           <thead className="bg-blue-100">
//             <tr>
//               {columns.map((col, index) => (
//                 <th key={index} className="py-3 px-4 text-left text-sm font-semibold text-blue-700">
//                   {col.label}
//                 </th>
//               ))}
//               <th className="py-3 px-4 text-left text-sm font-semibold text-blue-700">Total</th>
//               <th className="py-3 px-4 text-center text-sm font-semibold text-blue-700 w-24">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {Array.isArray(items) && items.map((item, index) => (
//               <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
//                 {columns.map((col, colIndex) => (
//                   <td key={colIndex} className="p-2">
//                     <input
//                       type={col.type}
//                       name={col.field}
//                       value={item[col.field] || ''}
//                       onChange={(e) => handleItemChange(category, index, e)}
//                       className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
//                       placeholder={col.placeholder || ''}
//                     />
//                   </td>
//                 ))}
//                 <td className="p-2 text-sm font-medium text-gray-700">
//                   ₹{((parseFloat(item.quantity) || 1) * (parseFloat(item.amount) || 0)).toFixed(2)}
//                 </td>
//                 <td className="p-2 text-center">
//                   <button
//                     type="button"
//                     onClick={() => handleRemoveItem(category, index)}
//                     className="p-2 text-red-600 hover:text-red-800 transition-colors duration-200 rounded-full hover:bg-red-100"
//                     aria-label={`Remove item`}
//                   >
//                     <Trash2 size={20} />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//       <button
//         type="button"
//         onClick={() => handleAddItem(category)}
//         className="mt-4 px-6 py-2 bg-blue-100 text-blue-700 rounded-full shadow-sm hover:bg-blue-200 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
//       >
//         <PlusCircle size={16} />
//         {addButtonText}
//       </button>
//     </div>
//   );
// };

// /**
//  * The main quotation form component. Handles state, data fetching, and form submission.
//  */
// const QuotationForm = ({ formTitle, onSubmit, initialData, submitButtonText }) => {
//   const navigate = useNavigate();
//   const { id } = useParams();

//   const [loading, setLoading] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [formData, setFormData] = useState(initialData || {
//     quotationDate: new Date().toISOString().slice(0, 10),
//     dueDate: '',
//     quotationNumber: '',
//     quotationFrom: '',
//     gstFrom: '',
//     addressFrom: '',
//     contactNumberFrom: '',
//     quotationTo: '',
//     quotationToName: '',
//     clientNameTo: '',
//     gstTo: '',
//     addressTo: '',
//     phoneTo: '',
//     totalAmount: 0,
//     signedDate: '',
//     termsAndConditions: '',
//     projectId: '',
//     materials: [],
//     manpowers: [],
//     expenditures: [],
//   });
//   const [projects, setProjects] = useState([]);
//   const [clients, setClients] = useState([]);
//   const [profile, setProfile] = useState({});

//   // Memoized function to update the total amount based on form data
//   const updateCalculations = useCallback((data) => {
//     const materialTotal = calculateTotalAmount(data.materials);
//     const manpowerTotal = calculateTotalAmount(data.manpowers);
//     const expenditureTotal = calculateTotalAmount(data.expenditures);
//     return materialTotal + manpowerTotal + expenditureTotal;
//   }, []);

//   // Memoized function to update form data based on a selected project and client.
//   const updateFormWithProjectData = useCallback((project, client, projectItems, prevData, profileData) => {
//     let updatedClientDetails = {};
//     if (client && project) {
//       updatedClientDetails = {
//         quotationTo: client._id,
//         quotationToName: client.clientName || '',
//         gstTo: project.gst || '',
//         addressTo: client.address || '',
//         phoneTo: client.phoneNumber || '',
//       };
//     }

//     const materials = (projectItems?.materials || []).map(item => ({
//       materialName: item.materialName || '',
//       quantity: item.quantity || 0,
//       unit: item.unit || 'Nos',
//       amount: item.amount || 0,
//       gst: item.gst || 0,
//     }));

//     const manpowers = (projectItems?.expenditures || []).filter(item => item.type === 'salary').map(item => ({
//       manpowerName: item.expenditureName || '',
//       role: item.role || '',
//       amount: item.amount || 0,
//     }));

//     const expenditures = (projectItems?.expenditures || []).filter(item => item.type === 'other').map(item => ({
//       expenditureName: item.expenditureName || '',
//       description: item.description || '',
//       amount: item.amount || 0,
//     }));

//     const newFormData = {
//       ...prevData,
//       ...updatedClientDetails,
//       // Fix for the profile data issue - ensuring data is correctly populated from the fetched profile.
//       quotationFrom: profileData?.companyName || '',
//       gstFrom: profileData?.gst || '',
//       addressFrom: profileData?.address || '',
//       contactNumberFrom: profileData?.contactNumber || '',
//       materials,
//       manpowers,
//       expenditures,
//     };
//     return { ...newFormData, totalAmount: updateCalculations(newFormData) };
//   }, [updateCalculations]);

//   // Main data fetching logic for the entire form.
//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         toast.error('Authentication is required. Please log in.');
//         navigate('/login');
//         return;
//       }

//       const [projectsRes, clientsRes, profileRes] = await Promise.all([
//         fetch(`${API_BASE_URL}/projects`, { headers: { 'Authorization': `Bearer ${token}` } }),
//         fetch(`${API_BASE_URL}/clients`, { headers: { 'Authorization': `Bearer ${token}` } }),
//         fetch(`${API_BASE_URL}/users/profile`, { headers: { 'Authorization': `Bearer ${token}` } }),
//       ]);

//       if (!projectsRes.ok || !clientsRes.ok || !profileRes.ok) {
//         // Log the full response to help with debugging
//         console.error('Failed to fetch initial data. Response status:', {
//           projects: projectsRes.status,
//           clients: clientsRes.status,
//           profile: profileRes.status,
//         });
//         throw new Error('Failed to fetch initial data.');
//       }

//       const projectsData = await projectsRes.json();
//       const clientsData = await clientsRes.json();
//       const profileData = await profileRes.json();

//       // Debugging: Log the profile data to the console
//       console.log('Fetched profile data:', profileData);
      
//       setProjects(projectsData || []);
//       setClients(clientsData || []);
//       setProfile(profileData || {});

//       let loadedQuotationData = initialData;
//       let projectItems = { materials: [], expenditures: [] };

//       // If an ID is present, we are in edit mode. Fetch existing quotation data.
//       if (id) {
//         const quotationRes = await fetch(`${API_BASE_URL}/quotations/${id}`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         });
//         if (!quotationRes.ok) {
//           throw new Error('Failed to fetch quotation data.');
//         }
//         loadedQuotationData = await quotationRes.json();
//         const manpowers = (loadedQuotationData?.expenditures || []).filter(item => item.type === 'salary');
//         const expenditures = (loadedQuotationData?.expenditures || []).filter(item => item.type === 'other');
//         loadedQuotationData = { ...loadedQuotationData, manpowers, expenditures };
//       }

//       // Fetch project-specific data if a project ID is available.
//       if (loadedQuotationData?.projectId) {
//         const projectDataRes = await fetch(`${API_BASE_URL}/quotations/project-data/${loadedQuotationData.projectId}`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         });
//         if (projectDataRes.ok) {
//           projectItems = await projectDataRes.json();
//         } else {
//           console.error('Failed to get data for the project.');
//         }
//       }

//       const selectedProject = projectsData.find(p => p && p._id === loadedQuotationData?.projectId);
//       const client = clientsData.find(c => c && c._id === (selectedProject?.client?._id || loadedQuotationData?.quotationTo));

//       const newFormData = updateFormWithProjectData(selectedProject, client, projectItems, loadedQuotationData, profileData);
//       setFormData(newFormData);
//     } catch (error) {
//       console.error('Failed to fetch data:', error);
//       toast.error(`Failed to load form data: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate, id, initialData, updateFormWithProjectData]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const handleChange = useCallback((e) => {
//     const { name, value } = e.target;
//     setFormData(prevData => {
//       const newData = { ...prevData, [name]: value };
//       return { ...newData, totalAmount: updateCalculations(newData) };
//     });
//   }, [updateCalculations]);

//   const handleProjectChange = useCallback(async (e) => {
//     const projectId = e.target.value;
//     const token = localStorage.getItem('token');
//     if (!token) {
//       toast.error('Authentication is required. Please log in.');
//       navigate('/login');
//       return;
//     }

//     setLoading(true);
//     try {
//       const projectDataRes = await fetch(`${API_BASE_URL}/quotations/project-data/${projectId}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       const projectItems = await projectDataRes.json();

//       const selectedProject = projects.find(p => p && p._id === projectId);
//       const client = clients.find(c => c && c._id === selectedProject?.client?._id);

//       const newFormData = updateFormWithProjectData(selectedProject, client, projectItems, formData, profile);
//       setFormData(newFormData);
//     } catch (error) {
//       console.error('Failed to get data for the project:', error);
//       toast.error('Could not load project data.');
//     } finally {
//       setLoading(false);
//     }
//   }, [projects, clients, formData, profile, updateFormWithProjectData, navigate]);

//   const handleItemChange = useCallback((category, index, e) => {
//     const { name, value } = e.target;
//     setFormData(prevData => {
//       const updatedItems = [...(prevData[category] || [])];
//       const updatedItem = { ...updatedItems[index], [name]: value };
//       updatedItems[index] = updatedItem;

//       const newData = { ...prevData, [category]: updatedItems };
//       return { ...newData, totalAmount: updateCalculations(newData) };
//     });
//   }, [updateCalculations]);

//   const handleAddItem = useCallback((category) => {
//     setFormData(prevData => {
//       let newItem = {};
//       switch (category) {
//         case 'materials':
//           newItem = { materialName: '', quantity: 0, unit: 'Nos', amount: 0, gst: 0 };
//           break;
//         case 'manpowers':
//           newItem = { manpowerName: '', role: '', amount: 0 };
//           break;
//         case 'expenditures':
//           newItem = { expenditureName: '', description: '', amount: 0 };
//           break;
//         default:
//           return prevData;
//       }
//       const updatedItems = [...(prevData[category] || []), newItem];
//       const newData = { ...prevData, [category]: updatedItems };
//       return { ...newData, totalAmount: updateCalculations(newData) };
//     });
//   }, [updateCalculations]);

//   const handleRemoveItem = useCallback((category, index) => {
//     setFormData(prevData => {
//       const updatedItems = (prevData[category] || []).filter((_, i) => i !== index);
//       const newData = { ...prevData, [category]: updatedItems };
//       return { ...newData, totalAmount: updateCalculations(newData) };
//     });
//   }, [updateCalculations]);

//   const handleShowDeleteModal = () => {
//     if (id) {
//       setShowDeleteModal(true);
//     }
//   };

//   const handleCloseDeleteModal = () => {
//     setShowDeleteModal(false);
//   };

//   const handleDelete = async () => {
//     setIsSaving(true);
//     handleCloseDeleteModal();
//     const token = localStorage.getItem('token');
//     if (!token) {
//       toast.error('Authentication failed. Please log in.');
//       navigate('/login');
//       setIsSaving(false);
//       return;
//     }

//     try {
//       const response = await fetch(`${API_BASE_URL}/quotations/${id}`, {
//         method: 'DELETE',
//         headers: { 'Authorization': `Bearer ${token}` },
//       });

//       if (!response.ok) {
//         throw new Error('Failed to delete quotation.');
//       }

//       toast.success('Quotation successfully deleted.');
//       // The `onClose` prop is now correctly handled.
//       // If this component is used in a modal, the parent can pass an `onClose` function.
//       // For this standalone example, we'll navigate back.
//       navigate(-1);
//     } catch (error) {
//       console.error('Failed to delete quotation:', error);
//       toast.error(`Failed to delete quotation: ${error.message}`);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // Fix for Cancel button issue:
//   // If no `onClose` prop is passed, we will navigate back. This makes the component work standalone.
//   const handleCancel = () => {
//     navigate(-1);
//   };

//   const formatDataForBackend = (data) => {
//     const formattedData = { ...data };

//     const combinedExpenditures = [
//       ...(formattedData.manpowers || []).map(item => ({
//         expenditureName: item.manpowerName,
//         role: item.role,
//         amount: parseFloat(item.amount) || 0,
//         type: 'salary',
//       })),
//       ...(formattedData.expenditures || []).map(item => ({
//         expenditureName: item.expenditureName,
//         description: item.description,
//         amount: parseFloat(item.amount) || 0,
//         type: 'other',
//       }))
//     ];

//     delete formattedData.manpowers;
//     delete formattedData.expenditures;
//     formattedData.expenditures = combinedExpenditures;
//     formattedData.materials = formattedData.materials || [];
//     return formattedData;
//   };

//   const handleSave = async (e) => {
//     e.preventDefault();
//     setIsSaving(true);
//     const token = localStorage.getItem('token');
//     if (!token) {
//       toast.error('Authentication failed. Please log in.');
//       navigate('/login');
//       setIsSaving(false);
//       return;
//     }

//     const isEditing = !!id;
//     const method = isEditing ? 'PUT' : 'POST';
//     const url = isEditing ? `${API_BASE_URL}/quotations/${id}` : `${API_BASE_URL}/quotations`;

//     const dataToSend = formatDataForBackend(formData);

//     try {
//       const response = await fetch(url, {
//         method,
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify(dataToSend),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to save quotation.');
//       }

//       const result = await response.json();
//       toast.success(`Quotation successfully ${isEditing ? 'updated' : 'saved'}.`);
//       if (onSubmit) {
//         onSubmit(result);
//       }
//     } catch (error) {
//       console.error('Failed to save quotation:', error);
//       toast.error(`Failed to save quotation: ${error.message}`);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="max-w-5xl mx-auto p-6 bg-white rounded-3xl shadow-2xl font-sans text-gray-800 my-8 border-t-8 border-blue-600">
//       <Toaster position="top-center" />
//       <h3 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-4 border-gray-200 pb-4">
//         {formTitle}
//       </h3>
//       {loading ? (
//         <div className="flex items-center justify-center h-64">
//           <Loader2 size={48} className="animate-spin text-blue-500" />
//         </div>
//       ) : (
//         <form onSubmit={handleSave} className="space-y-8">
//           {/* Basic Details Section */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl shadow-inner">
//             <div className="flex flex-col">
//               <label htmlFor="projectId" className="mb-1 text-sm font-semibold text-gray-700">selected Project <span className="text-red-500">*</span></label>
//               <select
//                 id="projectId"
//                 name="projectId"
//                 value={formData.projectId}
//                 onChange={handleProjectChange}
//                 className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
//               >
//                 <option value="">Select a project</option>
//                 {projects.map(project => (
//                   <option key={project._id} value={project._id}>{project.projectName}</option>
//                 ))}
//               </select>
//             </div>
//             <div className="flex flex-col">
//               <label htmlFor="quotationToName" className="mb-1 text-sm font-semibold text-gray-700">Quotation Name</label>
//               <input type="text" value={formData.quotationToName} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
//             </div>
//             <div className="flex flex-col">
//               <label htmlFor="quotationDate" className="mb-1 text-sm font-semibold text-gray-700">Quotation Date</label>
//               <input
//                 type="date"
//                 id="quotationDate"
//                 name="quotationDate"
//                 value={formData.quotationDate}
//                 onChange={handleChange}
//                 className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
//               />
//             </div>
//             <div className="flex flex-col">
//               <label htmlFor="dueDate" className="mb-1 text-sm font-semibold text-gray-700">Due Date</label>
//               <input
//                 type="date"
//                 id="dueDate"
//                 name="dueDate"
//                 value={formData.dueDate}
//                 onChange={handleChange}
//                 className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus-ring-blue-500 transition-shadow duration-200"
//               />
//             </div>
//             <div className="flex flex-col md:col-span-2">
//               <label htmlFor="quotationNumber" className="mb-1 text-sm font-semibold text-gray-700">Quotation No</label>
//               <input
//                 type="text"
//                 id="quotationNumber"
//                 name="quotationNumber"
//                 value={formData.quotationNumber}
//                 onChange={handleChange}
//                 className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
//                 placeholder="e.g., INV-001"
//               />
//             </div>
//           </div>


//           {/* From & To Details Section */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {/* From Details */}
//             <div className="bg-blue-50 p-6 rounded-xl shadow-md space-y-4">
//               <h4 className="text-xl font-bold text-blue-800">From Quotation</h4>
//               {Object.keys(profile).length === 0 ? (
//                 <p className="text-sm text-red-500">
//                   Profile data not available. Please ensure your user profile is set up.
//                 </p>
//               ) : (
//                 <>
//                   <div className="flex flex-col">
//                     <label className="mb-1 text-sm font-medium text-gray-700">Company Name</label>
//                     <input type="text" value={formData.quotationFrom} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
//                   </div>
//                   <div className="flex flex-col">
//                     <label className="mb-1 text-sm font-medium text-gray-700">GST No</label>
//                     <input type="text" value={formData.gstFrom} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
//                   </div>
//                   <div className="flex flex-col">
//                     <label className="mb-1 text-sm font-medium text-gray-700">Address</label>
//                     <input type="text" value={formData.addressFrom} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
//                   </div>
//                   <div className="flex flex-col">
//                     <label className="mb-1 text-sm font-medium text-gray-700">phone Number</label>
//                     <input type="text" value={formData.contactNumberFrom} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
//                   </div>
//                 </>
//               )}
//             </div>

//             {/* To Details */}
//             <div className="bg-green-50 p-6 rounded-xl shadow-md space-y-4">
//               <h4 className="text-xl font-bold text-green-800">To Quotation</h4>
//               <div className="flex flex-col">
//                 <label className="mb-1 text-sm font-medium text-gray-700">Client Name</label>
//                 <input type="text" value={formData.quotationToName} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
//               </div>
//               <div className="flex flex-col">
//                 <label className="mb-1 text-sm font-medium text-gray-700">GST No</label>
//                 <input type="text" value={formData.gstTo} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
//               </div>
//               <div className="flex flex-col">
//                 <label className="mb-1 text-sm font-medium text-gray-700">Address</label>
//                 <input type="text" value={formData.addressTo} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
//               </div>
//               <div className="flex flex-col">
//                 <label className="mb-1 text-sm font-medium text-gray-700">Phone Number</label>
//                 <input type="text" value={formData.phoneTo} readOnly className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
//               </div>
//             </div>
//           </div>

//           {/* Materials Section */}
//           <QuotationTable
//             category="materials"
//             items={formData.materials}
//             handleItemChange={handleItemChange}
//             handleAddItem={handleAddItem}
//             handleRemoveItem={handleRemoveItem}
//           />

//           {/* Manpower Section */}
//           <QuotationTable
//             category="manpowers"
//             items={formData.manpowers}
//             handleItemChange={handleItemChange}
//             handleAddItem={handleAddItem}
//             handleRemoveItem={handleRemoveItem}
//           />

//           {/* Expenditures Section */}
//           <QuotationTable
//             category="expenditures"
//             items={formData.expenditures}
//             handleItemChange={handleItemChange}
//             handleAddItem={handleAddItem}
//             handleRemoveItem={handleRemoveItem}
//           />

//           {/* Terms & Conditions and Signed Date */}
//           <div className="space-y-4">
//             <div className="flex flex-col">
//               <label htmlFor="termsAndConditions" className="mb-1 text-sm font-semibold text-gray-700">Terms and Conditions</label>
//               <textarea
//                 id="termsAndConditions"
//                 name="termsAndConditions"
//                 value={formData.termsAndConditions}
//                 onChange={handleChange}
//                 className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200 h-32"
//                 placeholder="Enter any terms and conditions here..."
//               />
//             </div>
//             <div className="flex flex-col">
//               <label htmlFor="signedDate" className="mb-1 text-sm font-semibold text-gray-700">Signed Date</label>
//               <input
//                 type="date"
//                 id="signedDate"
//                 name="signedDate"
//                 value={formData.signedDate}
//                 onChange={handleChange}
//                 className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
//               />
//             </div>
//           </div>

//           {/* Total Amount & Buttons */}
//           <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 mt-8">
//             <div className="flex items-center gap-2">
//               <span className="text-xl font-bold text-gray-900">Total Amount:</span>
//               <span className="text-3xl font-extrabold text-blue-600">₹{formData.totalAmount.toFixed(2)}</span>
//             </div>
//             <div className="flex flex-col sm:flex-row gap-4">
//               {/* Cancel Button - now working correctly with `Maps(-1)` */}
//               <button
//                 type="button"
//                 onClick={handleCancel}
//                 className="px-6 py-3 bg-red-100 text-red-600 rounded-full shadow-sm hover:bg-red-200 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
//                 disabled={isSaving}
//               >
//                 <Ban size={20} />
//                 Cancel
//               </button>

//               {/* Delete Button (only shown for existing quotations) */}
//               {id && (
//                 <button
//                   type="button"
//                   onClick={handleShowDeleteModal}
//                   className="px-6 py-3 bg-gray-100 text-gray-600 rounded-full shadow-sm hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
//                   disabled={isSaving}
//                 >
//                   <Trash2 size={20} />
//                   Delete
//                 </button>
//               )}

//               {/* Save Button */}
//               <button
//                 type="submit"
//                 className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 font-semibold"
//                 disabled={isSaving}
//               >
//                 {isSaving ? (
//                   <>
//                     <Loader2 size={20} className="animate-spin" />
//                     Saving...
//                   </>
//                 ) : (
//                   <>
//                     <Save size={20} />
//                     {submitButtonText || (id ? 'Update' : 'Save')}
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </form>
//       )}

//       {/* Delete Confirmation Modal - fixed to use proper component state */}
//       {showDeleteModal && (
//         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
//           <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm mx-auto relative transform transition-all scale-100">
//             <div className="text-center">
//               <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
//                 <Trash2 size={24} className="text-red-600" />
//               </div>
//               <h3 className="mt-4 text-xl leading-6 font-medium text-gray-900">Delete Quotation</h3>
//               <div className="mt-2 px-7 py-3">
//                 <p className="text-sm text-gray-500">
//                   Are you sure you want to delete this quotation? This action cannot be undone.
//                 </p>
//               </div>
//               <div className="mt-5 sm:mt-6 flex justify-end gap-3">
//                 <button
//                   type="button"
//                   className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 transition-colors"
//                   onClick={handleCloseDeleteModal}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="button"
//                   className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
//                   onClick={handleDelete}
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default QuotationForm;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, PlusCircle, Trash2, Printer, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// NOTE: Assuming your Quotation Form component is named 'QuotationForm'
// Please ensure you import the correct component:
import QuotationForm from '../projects/QuotationForm';
// NOTE: Assuming your Modal component is named 'Modal'
import Modal from '../model/Modal';

// Base API URL
const API_BASE_URL = 'http://localhost:5000/api';

const QuotationList = () => {
    const navigate = useNavigate();

    // 1. Rename State from 'invoices' to 'quotations'
    const [quotations, setQuotations] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    // 2. Rename State from 'currentInvoice' to 'currentQuotation'
    const [currentQuotation, setCurrentQuotation] = useState(null); 
    const [messageModal, setMessageModal] = useState({ show: false, message: '', type: '', onConfirm: null });

    const showMessage = (message, type = 'alert', onConfirm = null) => {
        setMessageModal({ show: true, message, type, onConfirm });
    };

    const handleCloseModal = () => {
        setMessageModal({ show: false, message: '', type: '', onConfirm: null });
    };

    // --- Data Fetching ---
    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            // 3. Change API endpoint from /invoices to /quotations
            const response = await axios.get(`${API_BASE_URL}/quotations`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            // 4. Update the 'quotations' state
            setQuotations(response.data);
            console.log("Fetched Quotations:", response.data);
        } catch (error) {
            console.error('Error fetching quotations:', error);
            setError(error.response?.data?.message || 'Failed to fetch quotations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    // --- Delete Handlers ---
    const handleDelete = (id) => {
        showMessage("Are you sure you want to delete this quotation record?", 'confirm', () => deleteQuotation(id));
    }

    const deleteQuotation = async (id) => {
        handleCloseModal();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found. Please log in.');
            }

            // 5. Change API endpoint for DELETE
            await axios.delete(`${API_BASE_URL}/quotations/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            // 6. Filter the 'quotations' state
            setQuotations(quotations.filter(item => item._id !== id));
            showMessage("Quotation deleted successfully!", 'alert');
        } catch (error) {
            console.error("Error deleting quotation:", error);    
            showMessage("Failed to delete quotation: " + (error.response?.data?.message || error.message), 'alert');
        }
    };

    // --- Form Modal Handlers ---
    const handleEdit = (quotation) => {
        // 7. Use currentQuotation state
        setCurrentQuotation(quotation);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        setCurrentQuotation(null); // Clear data for a new record
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        // Refresh the list after form submission/closing
        fetchQuotations(); 
    };

    // --- Print Handler ---
    const handlePrint = (id) => {
        // 8. Change navigation path for print
        navigate(`/quotations/print/${id}`); 
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center min-h-[50vh]'>
                <Loader2 size={32} className="animate-spin text-blue-600" />
                <p className='ml-3 text-gray-500 text-lg'>Loading Quotations...</p>
            </div>
        );
    }

    if (error) {
        return <p className='text-center text-red-500 text-lg mt-10'>{error}</p>;
    }

    return (
        <div className="quotation-container p-6 sm:p-8 bg-gray-100 min-h-screen font-sans">
            {messageModal.show && <Modal message={messageModal.message} onClose={handleCloseModal} onConfirm={messageModal.onConfirm} type={messageModal.type} />}
            
            <div className="flex justify-between items-center mb-6">
                <h2 className='text-2xl font-bold text-gray-800'>Quotations</h2>
                <button onClick={handleAdd} className='bg-green-600 text-white font-semibold py-2 px-6 rounded-full shadow-lg hover:bg-green-700 transition duration-200 flex items-center gap-2'>
                    <PlusCircle size={16} />
                    Create New Quotation
                </button>
            </div>

            {/* 9. Check the correct state array: 'quotations' */}
            {quotations && quotations.length === 0 ? (
                <p className='text-center text-gray-500 mt-10'>No Quotations found. Click "Create New Quotation" to add one.</p>
            ) : (
                <div className='overflow-x-auto bg-white rounded-xl shadow-lg'>
                    <table className='min-w-full'>
                        <thead className='bg-gray-50 text-gray-600 uppercase text-sm leading-normal'>
                            <tr>
                                {/* 10. Update Table Headings */}
                                <th className='py-3 px-6 text-left'>Quotation Number</th>
                                <th className='py-3 px-6 text-left'>Project Name</th>
                                <th className='py-3 px-6 text-left'>Client Name</th>
                                <th className='py-3 px-6 text-left'>Quotation Date</th>
                                <th className='py-3 px-6 text-left'>Total Amount</th>
                                <th className='py-3 px-6 text-left'>Status</th>
                                <th className='py-3 px-6 text-center'>Actions</th>
                            </tr>
                        </thead>
                        {/* Use <tbody> for the body content */}
                        <tbody className='text-gray-600 text-sm font-light'> 
                            {quotations && quotations.map((item => (
                                <tr key={item._id} className='border-b border-gray-200 hover:bg-gray-50'>
                                    {/* 11. Update Data Fields */}
                                    <td className='py-3 px-6 text-left whitespace-nowrap'>{item.quotationNumber || 'N/A'}</td>
                                    {/* Project Name is nested under 'projectId' or 'project' depending on API population */}
                                    <td className='py-3 px-6 text-left whitespace-nowrap'>{item.projectId?.projectName || 'N/A'}</td> 
                                    {/* Client Name is nested under 'quotationTo' */}
                                    <td className='py-3 px-6 text-left whitespace-nowrap'>{item.quotationTo?.clientName || 'N/A'}</td> 
                                    <td className='py-3 px-6 text-left whitespace-nowrap'>{item.quotationDate ? new Date(item.quotationDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className='py-3 px-6 text-left whitespace-nowrap'>₹{item.totalAmount ? item.totalAmount.toFixed(2) : '0.00'}</td>
                                    <td className='py-3 px-6 text-left whitespace-nowrap'>
                                        <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
                                            // Status remains the same logic
                                            item.status === 'Draft' ? 'bg-yellow-200 text-yellow-800' : 
                                            item.status === 'Sent' ? 'bg-blue-200 text-blue-800' : 
                                            item.status === 'Accepted' ? 'bg-green-200 text-green-800' :
                                            item.status === 'Rejected' ? 'bg-red-200 text-red-800' : 
                                            'bg-gray-200 text-gray-800'
                                        }`}>
                                            {item.status || 'Draft'}
                                        </span>
                                    </td>
                                    <td className='py-3 px-6 text-center whitespace-nowrap flex items-center justify-center space-x-2'>
                                        <button onClick={() => handleEdit(item)} className='text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 transition duration-200' title="Edit">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(item._id)} className='text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition duration-200' title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                        <button onClick={() => handlePrint(item._id)} className='text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition duration-200' title="Print/View PDF">
                                            <Printer size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for Quotation Form */}
            {showFormModal && (
                <div className='fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-40'>
                    <div className='bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
                        {/* 12. Use QuotationForm component */}
                        <QuotationForm initialData={currentQuotation} onClose={handleFormClose} /> 
                    </div>
                </div>
            )}  
        </div >
    );
};

export default QuotationList;
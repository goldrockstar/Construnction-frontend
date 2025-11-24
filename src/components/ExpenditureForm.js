import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCcw, X, Save, IndianRupee } from 'lucide-react';

// API அடிப்படை URL
const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

/**
 * ExpenditureForm component
 * ஊழியரின் சம்பளச் செலவு விவரங்களைச் சேமிக்கவும் அல்லது திருத்தவும் பயன்படுகிறது.
 */
const ExpenditureForm = ({ expenditure, projectId, onClose }) => {

    // படிவத் தரவுகளுக்கான ஆரம்ப நிலை அமைவு
    const [formData, setFormData] = useState({
        manpowerId: '', // API-க்கு மனிதவளத்தை அடையாளம் காண
        employeeName: '', // தானாக நிரப்பப்படும்
        designation: '', // Manpower-இல் இருந்து தானாக நிரப்பப்படும்
        payType: '', // Manpower-இல் இருந்து தானாக நிரப்பப்படும்
        payRate: '', // Manpower-இல் இருந்து தானாக நிரப்பப்படும்
        fromDate: new Date().toISOString().split('T')[0], // தகவலுக்காக மட்டும்
        toDate: new Date().toISOString().split('T')[0], // தகவலுக்காக மட்டும்
        workingDays: '', // <- வேலை நாட்களுக்கான புதிய புலம் (Manual Input)
        projectId: projectId || null,
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [manpowerList, setManpowerList] = useState([]);

    // மொத்த சம்பளத்தின் கணக்கீடு (TotalWages = Working Days * Pay Rate)
    const totalWages = useMemo(() => {
        const rate = Number(formData.payRate);
        const days = Number(formData.workingDays); // கைமுறை உள்ளீட்டைப் பயன்படுத்துகிறோம்
        
        if (isNaN(rate) || rate <= 0 || isNaN(days) || days < 0) return 0;
        
        // Total Wages = Working Days * Pay Rate
        return days * rate; 
    }, [formData.workingDays, formData.payRate]); // workingDays உள்ளீட்டைச் சார்ந்தது


    // கூறு ஏற்றும்போது மனிதவளப் பட்டியலை மீட்டெடுக்கவும்
    useEffect(() => {
        const fetchManpower = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error("டோக்கன் கிடைக்கவில்லை. மீண்டும் உள்நுழையவும்.");
                }

                const response = await fetch(`${API_BASE_URL}/manpower`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `மனிதவளத்தைப் பெறத் தவறிவிட்டது: ${response.statusText}`);
                }
                const data = await response.json();
                
                // API-யில் இருந்து வரும் தரவைக் கவனமாகச் சரிபார்க்கவும்
                console.log("Manpower API Data:", data); 
                
                setManpowerList(data);
            } catch (err) {
                console.error("மனிதவளத்தைப் பெறுவதில் பிழை:", err);
                setError("மனிதவளப் பட்டியலை ஏற்றத் தவறிவிட்டது. " + err.message);
            }
        };
        fetchManpower();
    }, []);

    // திருத்தம் செய்யும் போது படிவத் தரவை நிரப்புவதற்கான விளைவு
    useEffect(() => {
        let initialData = {
            manpowerId: '',
            employeeName: '',
            designation: '',
            payType: '',
            payRate: '',
            fromDate: new Date().toISOString().split('T')[0],
            toDate: new Date().toISOString().split('T')[0],
            workingDays: '', 
            projectId: projectId || null,
        };

        if (expenditure) {
            // NOTE: 'expenditure' பொருளில் 'workingDays' மற்றும் 'description' புலங்கள் இருப்பதாகக் கருதுகிறோம்.
            initialData = {
                manpowerId: expenditure.manpowerId || '',
                employeeName: expenditure.manpowerName || '',
                designation: expenditure.manpowerDesignation || '', 
                payType: expenditure.manpowerPayType || '',
                payRate: expenditure.manpowerPayRate || '',
                fromDate: expenditure.fromDate ? new Date(expenditure.fromDate).toISOString().split('T')[0] : '',
                toDate: expenditure.toDate ? new Date(expenditure.toDate).toISOString().split('T')[0] : '',
                workingDays: expenditure.workingDays || '', // வேலை நாட்களை அமைத்தல்
                projectId: expenditure.projectId || projectId || null,
            };

            // மனிதவள விவரங்கள் திருத்தம் செய்யும் போது நிரப்பப்படவில்லை என்றால், manpowerList-இல் இருந்து கண்டுபிடித்து நிரப்பவும்.
            if (expenditure.manpowerId && manpowerList.length > 0) {
                const selectedManpower = manpowerList.find(mp => mp._id === expenditure.manpowerId);
                if (selectedManpower) {
                    // இங்கே மீண்டும் ஒருமுறை 'role' vs 'designation' புலத்தை உறுதிப்படுத்தவும்
                    initialData.employeeName = selectedManpower.name;
                    initialData.designation = selectedManpower.roleName; // Designation நிரப்பப்பட்டது
                    initialData.payType = selectedManpower.payRateType; // PayType நிரப்பப்பட்டது
                    initialData.payRate = selectedManpower.payRate;
                }
            }
        }

        setFormData(initialData);
        setError(null);
        setSuccess(false);
    }, [expenditure, projectId, manpowerList]);

    // உள்ளீட்டு மாற்றங்களைக் கையாளவும்
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'manpowerId') {
            const selectedManpower = manpowerList.find(mp => mp._id === value);
            
            // Log the selected Manpower object to check its structure (role, payType, payRate)
            console.log("Selected Manpower:", selectedManpower);

            // Designation மற்றும் Pay Type உள்ளிட்ட மனிதவள விவரங்களை தானாக நிரப்பவும்
            setFormData(prev => ({
                ...prev,
                manpowerId: value,
                employeeName: selectedManpower ? selectedManpower.name : '',
                // NOTE: Manpower data-இல் 'role' என்பது Designation ஆகவும், 'payType' மற்றும் 'payRate' சரியான பெயர்களாகவும் இருப்பதாகக் கருதுகிறோம்.
                // உங்கள் API தரவின்படி 'role' அல்லது 'designation' எது என்பதை இங்கே உறுதிப்படுத்தவும்
                designation: selectedManpower ? selectedManpower.roleName : '', // <-- இங்கே 'role' பயன்படுத்தப்பட்டுள்ளது
                payType: selectedManpower ? selectedManpower.payRateType : '', // <-- இங்கே 'payType' பயன்படுத்தப்பட்டுள்ளது
                payRate: selectedManpower ? selectedManpower.payRate : '',
            }));
        } else {
            // மற்ற புலங்களுக்கான உள்ளீட்டு மாற்றங்களைச் சேமிக்கவும்
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    console.log("Form Data State:", formData);

    // படிவ சமர்ப்பிப்பைக் கையாளவும்
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // அனுப்ப வேண்டிய தரவைத் தயார் செய்யவும் 
            const dataToSend = {
                projectId: formData.projectId,
                expenditureType: 'Salary', // செலவு வகை 'Salary' ஆக உறுதியானது
                amount: totalWages, // கணக்கிடப்பட்ட மொத்த ஊதியத்தை அனுப்பவும்
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                workingDays: Number(formData.workingDays), // கைமுறை உள்ளீட்டை அனுப்புதல்
                manpowerId: formData.manpowerId,
                manpowerName: formData.employeeName,
                // கூடுதல் விவரங்கள் Backend-க்கு தேவைப்பட்டால் அனுப்பலாம்
                manpowerDesignation: formData.designation,
                manpowerPayType: formData.payType,
                manpowerPayRate: formData.payRate,
            };

            // Validation
            if (!dataToSend.projectId) {
                setError("திட்ட ஐடி இல்லை. தயவுசெய்து ஒரு திட்டத்தைத் தேர்ந்தெடுக்கவும்.");
                setLoading(false);
                return;
            }
            
            if (!dataToSend.manpowerId || !dataToSend.workingDays || dataToSend.workingDays <= 0) {
                setError("ஊழியரைத் தேர்ந்தெடுத்து, வேலை நாட்களை உள்ளிடவும். வேலை நாட்கள் பூஜ்ஜியத்தை விட அதிகமாக இருக்க வேண்டும்.");
                setLoading(false);
                return;
            }
             if (dataToSend.amount <= 0) {
                setError("மொத்த சம்பளம் பூஜ்ஜியத்தை விட அதிகமாக இருக்க வேண்டும். சம்பள விகிதம் அல்லது வேலை நாட்களைச் சரிபார்க்கவும்.");
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) throw new Error("டோக்கன் கிடைக்கவில்லை. மீண்டும் உள்நுழையவும்.");

            const url = expenditure ? `${API_BASE_URL}/expenditures/${expenditure._id}` : `${API_BASE_URL}/expenditures`;
            const method = expenditure ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `செலவைச் சேமிப்பதில் பிழை: ${response.statusText}`);
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error("செலவைச் சேமிப்பதில் பிழை:", err);
            setError("செலவைச் சேமிப்பதில் பிழை ஏற்பட்டது: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-xl shadow-2xl border border-blue-100 max-w-2xl mx-auto">
            <div className="col-span-full flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-2xl font-extrabold text-blue-800 flex items-center">
                    <IndianRupee className="w-6 h-6 mr-2 text-blue-600"/>
                    {expenditure ? "Update ManPower" : "ManPower Allocation"}
                </h3>
                <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-red-600 rounded-full transition duration-150">
                    <X className="w-6 h-6" />
                </button>
            </div>
            
            {error && <p className="col-span-full bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg relative mb-2 font-medium text-sm" role="alert">{error}</p>}
            {success && <p className="col-span-full bg-green-100 border border-green-400 text-green-700 p-3 rounded-lg relative mb-2 font-medium text-sm" role="alert">Saved Successfully!</p>}

            {/* 1. மனிதவளத் தேர்வு (Manpower Selection) */}
            <div>
                <label htmlFor="manpowerId" className="block text-gray-700 text-sm font-bold mb-1">Manpower Selection <span className="text-red-500">*</span></label>
                <select
                    id="manpowerId"
                    name="manpowerId"
                    value={formData.manpowerId}
                    onChange={handleChange}
                    className="shadow-sm border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
                    required
                >
                    <option value="">-- Selected Manpower --</option>
                    {manpowerList.map(mp => (
                        <option key={mp._id} value={mp._id}>{mp.name} ({mp.role})</option>
                    ))}
                </select>
            </div>

            {/* 2. ஊழியர் பெயர் (Employee Name - Read-only) */}
            <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Employee Name</label>
                <input
                    type="text"
                    value={formData.employeeName || 'Selected Manpower Name'}
                    disabled
                    className="shadow-sm border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 cursor-not-allowed"
                />
            </div>
            
            {/* 3. பதவி (Designation - Read-only) */}
            <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Designation</label>
                <input
                    type="text"
                    // இங்கே 'designation' ஸ்டேட் மதிப்பை நேரடியாகப் பயன்படுத்துகிறோம்
                    value={formData.designation || 'Selected Manpower Designation'} 
                    disabled
                    className="shadow-sm border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 cursor-not-allowed"
                />
            </div>
            {/* 4. சம்பள வகை (Pay Type - Read-only) */}
            <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Pay Type</label>
                <input
                    type="text"
                    // இங்கே 'payType' ஸ்டேட் மதிப்பை நேரடியாகப் பயன்படுத்துகிறோம்
                    value={formData.payType || 'Selected Manpower Pay Type'} 
                    disabled
                    className="shadow-sm border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 cursor-not-allowed"
                />
            </div>
            
            {/* 5. சம்பள விகிதம் (Pay Rate - Read-only) */}
            <div className="sm:col-span-1">
                <label className="block text-gray-700 text-sm font-bold mb-1">Pay Rate</label>
                <input
                    type="text"
                    value={formData.payRate ? `₹${Number(formData.payRate).toLocaleString('en-IN')} / ${formData.payType || '1Days'}` : 'N/A'}
                    disabled
                    className="shadow-sm border border-blue-300 rounded-lg w-full py-2 px-3 text-blue-800 font-bold leading-tight bg-blue-50 cursor-not-allowed"
                />
            </div>

            {/* 6. வேலை நாட்கள் (Working Days / Hours) - கைமுறை உள்ளீடு */}
            <div className="sm:col-span-1">
                <label htmlFor="workingDays" className="block text-gray-700 text-sm font-bold mb-1">
                    Working Days / Hours <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    id="workingDays"
                    name="workingDays"
                    value={formData.workingDays}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="shadow-sm border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-150"
                    placeholder="e.g., 15 or 120.5"
                    required
                />
            </div>

            {/* 7. தேதியிலிருந்து (From Date) - தகவலுக்காக மட்டும் */}
            <div>
                <label htmlFor="fromDate" className="block text-gray-700 text-sm font-bold mb-1">From Date</label>
                <input
                    type="date"
                    id="fromDate"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleChange}
                    className="shadow-sm border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-150"
                />
            </div>
            {/* 8. தேதி வரை (To Date) - தகவலுக்காக மட்டும் */}
            <div>
                <label htmlFor="toDate" className="block text-gray-700 text-sm font-bold mb-1">To Date</label>
                <input
                    type="date"
                    id="toDate"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleChange}
                    className="shadow-sm border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-150"
                />
            </div>
            
            {/* 10. மொத்த சம்பளம் (Total Wages - Calculated, Read-only) */}
            <div className="col-span-full mt-2">
                <label className="block text-gray-700 text-lg font-bold mb-1">
                    Total Wages
                </label>
                <input
                    type="text"
                    value={`₹${totalWages.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    disabled
                    className="shadow-md border border-green-500 rounded-lg w-full py-3 px-4 text-2xl text-green-800 font-extrabold leading-tight bg-green-50 cursor-not-allowed"
                    placeholder="வேலை நாட்கள் x சம்பள விகிதம்"
                />
            </div>


            {/* 11. சமர்ப்பிப்பு பொத்தான்கள் */}
            <div className="col-span-full flex justify-end space-x-3 mt-6">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg shadow-inner hover:bg-gray-300 transition duration-200"
                    disabled={loading}
                >
                    <X className="w-5 h-5 mr-2"/> Cancel
                </button>
                <button
                    type="submit"
                    className={`flex items-center px-6 py-2 text-white font-medium rounded-lg shadow-lg transition duration-200 
                        ${loading || totalWages <= 0 
                            ? 'bg-blue-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        }`}
                    disabled={loading || totalWages <= 0}
                >
                    {loading ? (
                        <>
                            <RefreshCcw className="w-5 h-5 mr-2 animate-spin"/> Loading...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2"/> {expenditure ? 'Update' : 'Save'}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default ExpenditureForm;
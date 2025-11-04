import React, { useState, useEffect } from 'react';

// API அடிப்படை URL
const API_BASE_URL = 'http://localhost:5000/api';

const ExpenditureForm = ({ expenditure, projectId, onClose }) => {
    // படிவத் தரவுகளுக்கான ஆரம்ப நிலை அமைவு
    const [formData, setFormData] = useState({
        expenditureType: '',
        expenditureName: '',
        manpowerId: '',
        manpowerName: '',
        fromDate: '',
        toDate: '',
        amount: '',
        description: '',
        projectId: projectId || null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [manpowerList, setManpowerList] = useState([]);

    // கூறு ஏற்றும்போது மனிதவளப் பட்டியலை மீட்டெடுக்கவும்
    useEffect(() => {
        const fetchManpower = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error("டோக்கன் கிடைக்கவில்லை. மீண்டும் உள்நுழையவும்.");
                }

                // இங்கே API URL-ஐ `/manpowers`-இலிருந்து `/manpower`-ஆக மாற்றியுள்ளோம்
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
                setManpowerList(data);
            } catch (err) {
                console.error("மனிதவளத்தைப் பெறுவதில் பிழை:", err);
                setError("மனிதவளப் பட்டியலை ஏற்றத் தவறிவிட்டது. " + err.message);
            }
        };
        fetchManpower();
    }, []);

    // ஏற்கனவே உள்ள செலவைத் திருத்தும்போது அல்லது புதியதை உருவாக்கும்போது படிவத் தரவை நிரப்புவதற்கான விளைவு
    useEffect(() => {
        if (expenditure) {
            setFormData({
                expenditureType: expenditure.expenditureType || '',
                expenditureName: expenditure.expenditureName || '',
                manpowerId: expenditure.manpowerId || '',
                manpowerName: expenditure.manpowerName || '',
                fromDate: expenditure.fromDate ? new Date(expenditure.fromDate).toISOString().split('T')[0] : '',
                toDate: expenditure.toDate ? new Date(expenditure.toDate).toISOString().split('T')[0] : '',
                amount: expenditure.amount || '',
                description: expenditure.description || '',
                projectId: expenditure.projectId || projectId || null,
            });
        } else {
            setFormData({
                expenditureType: '',
                expenditureName: '',
                manpowerId: '',
                manpowerName: '',
                // புதிய உள்ளீட்டிற்கான இயல்புநிலை தேதிகளை அமைக்கவும்
                fromDate: new Date().toISOString().split('T')[0],
                toDate: new Date().toISOString().split('T')[0],
                amount: '',
                description: '',
                projectId: projectId || null,
            });
        }
        setError(null);
        setSuccess(false);
    }, [expenditure, projectId]);

    // உள்ளீட்டு மாற்றங்களைக் கையாளவும்
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'expenditureType') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                // மற்ற வகை-சார்ந்த புலங்களை அழிக்கவும்
                manpowerId: value === 'Salary' ? prev.manpowerId : '',
                manpowerName: value === 'Salary' ? prev.manpowerName : '',
                expenditureName: value === 'Other' ? prev.expenditureName : '',
            }));
        } else if (name === 'manpowerId') {
            const selectedManpower = manpowerList.find(mp => mp._id === value);
            setFormData(prev => ({
                ...prev,
                manpowerId: value,
                manpowerName: selectedManpower ? selectedManpower.name : '',
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // படிவ சமர்ப்பிப்பைக் கையாளவும்
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // அனுப்ப வேண்டிய தரவைத் தயார் செய்யவும், அனைத்து வகைகளுக்கும் கட்டாயமான புலங்கள் உட்பட
            const dataToSend = {
                projectId: formData.projectId,
                expenditureType: formData.expenditureType,
                amount: Number(formData.amount),
                description: formData.description,
                fromDate: formData.fromDate, // எப்போதும் fromDate ஐ அனுப்பவும்
                toDate: formData.toDate,     // எப்போதும் toDate ஐ அனுப்பவும்
            };
            
            // expenditureType ஐப் பொறுத்து புலங்களைச் சேர்க்கவும்
            if (formData.expenditureType === 'Salary') {
                dataToSend.manpowerId = formData.manpowerId;
                dataToSend.manpowerName = formData.manpowerName;
            } else if (formData.expenditureType === 'Other') {
                dataToSend.expenditureName = formData.expenditureName;
            }

            // Client-side சரிபார்த்தல்
            if (!dataToSend.projectId) {
                setError("திட்ட ஐடி இல்லை. தயவுசெய்து ஒரு திட்டத்தைத் தேர்ந்தெடுக்கவும்.");
                setLoading(false);
                return;
            }
            if (!dataToSend.expenditureType || !dataToSend.amount || !dataToSend.fromDate || !dataToSend.toDate) {
                setError("செலவு வகை, தொகை, தொடக்க தேதி மற்றும் இறுதி தேதி ஆகியவற்றை உள்ளிடவும்.");
                setLoading(false);
                return;
            }
            if (dataToSend.expenditureType === 'Other' && !dataToSend.expenditureName) {
                setError("செலவு பெயரை உள்ளிடவும்.");
                setLoading(false);
                return;
            }
            if (dataToSend.expenditureType === 'Salary' && !dataToSend.manpowerId) {
                setError("மனிதவளத்தைத் தேர்ந்தெடுக்கவும்.");
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
        <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="col-span-full text-xl font-semibold mb-4">{expenditure ? "செலவைத் திருத்து" : "செலவைச் சேர்"}</h3>
            {error && <p className="col-span-full text-red-500 mb-4">{error}</p>}
            {success && <p className="col-span-full text-green-500 mb-4">வெற்றிகரமாக சேமிக்கப்பட்டது!</p>}

            <div>
                <label htmlFor="expenditureType" className="block text-gray-700 text-sm font-bold mb-2">
                    செலவு வகையைத் தேர்ந்தெடுக்கவும் <span className="text-red-500">*</span>
                </label>
                <select
                    id="expenditureType"
                    name="expenditureType"
                    value={formData.expenditureType}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                >
                    <option value="">தேர்ந்தெடுக்கவும்</option>
                    <option value="Salary">சம்பளம்</option>
                    <option value="Other">மற்றவை</option>
                </select>
            </div>

            {formData.expenditureType === 'Other' && (
                <div>
                    <label htmlFor="expenditureName" className="block text-gray-700 text-sm font-bold mb-2">
                        செலவு பெயர் <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="expenditureName"
                        name="expenditureName"
                        value={formData.expenditureName}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="செலவு பெயரை உள்ளிடவும்"
                        required
                    />
                </div>
            )}

            {formData.expenditureType === 'Salary' && (
                <div>
                    <label htmlFor="manpowerId" className="block text-gray-700 text-sm font-bold mb-2">மனிதவளத்தைத் தேர்ந்தெடுக்கவும் *</label>
                    <select
                        id="manpowerId"
                        name="manpowerId"
                        value={formData.manpowerId}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    >
                        <option value="">தேர்ந்தெடுக்கவும்</option>
                        {manpowerList.map(mp => (
                            <option key={mp._id} value={mp._id}>{mp.name} ({mp.role})</option>
                        ))}
                    </select>
                </div>
            )}

            {/* எப்போதும் fromDate மற்றும் toDate புலங்களைக் காண்பிக்கவும், ஏனெனில் அவை இப்போது பின்தளத்தில் தேவைப்படுகின்றன */}
            <div>
                <label htmlFor="fromDate" className="block text-gray-700 text-sm font-bold mb-2">
                    தேதியிலிருந்து <span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    id="fromDate"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                />
            </div>
            <div>
                <label htmlFor="toDate" className="block text-gray-700 text-sm font-bold mb-2">
                    தேதி வரை <span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    id="toDate"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                />
            </div>

            <div>
                <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">
                    தொகை <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="தொகையை உள்ளிடவும்"
                    required
                />
            </div>
            <div className="col-span-full">
                <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                    விளக்கம்
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="விளக்கத்தை உள்ளிடவும்"
                    rows="3"
                ></textarea>
            </div>

            <div className="col-span-full flex justify-end space-x-3 mt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-red-800 text-white-800 rounded-md hover:bg-red-400 transition duration-200"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-800 text-white-800 rounded-md hover:bg-blue-400 transition duration-200"
                    disabled={loading}
                >
                    {loading ? 'சேமிக்கிறது...' : (expenditure ? 'Update' : 'Save')}
                </button>
            </div>
        </form>
    );
};

export default ExpenditureForm;

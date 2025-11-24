import React, { useState, useEffect } from 'react';
import { Edit, Trash2, PlusCircle, Save, Undo2, XCircle } from 'lucide-react';
import { formatDateToInput, formatInr } from '../utils/formatter';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const SalaryConfigForm = ({ projectConfigs, roleOptions, onSaveSuccess, onClose, projectId, handleDelete }) => {
    const [formRows, setFormRows] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        const initialRows = projectConfigs.map(config => ({
            ...config,
            fromDate: formatDateToInput(config.fromDate),
            toDate: formatDateToInput(config.toDate),
            isNew: false,
            isEditing: false,
        }));
        setFormRows(initialRows);
    }, [projectConfigs]);

    const handleAddRow = () => {
        const newRow = {
            projectId: projectId,
            roleId: '',
            roleName: '',
            fromDate: '',
            toDate: '',
            salaryPerHead: '',
            count: '',
            totalSalary: 0,
            isNew: true,
            isEditing: true,
        };
        setFormRows(prevRows => [...prevRows, newRow]);
    };

    const handleEditRow = (index) => {
        setFormRows(prevRows => {
            const updatedRows = [...prevRows];
            updatedRows[index] = { ...updatedRows[index], isEditing: true };
            return updatedRows;
        });
    };

    const handleCancelEdit = (index) => {
        setFormRows(prevRows => {
            const updatedRows = [...prevRows];
            if (updatedRows[index].isNew) {
                updatedRows.splice(index, 1);
            } else {
                updatedRows[index].isEditing = false;
                // A more robust solution would be to re-fetch or store original state here
            }
            return updatedRows;
        });
    };

    const handleRowChange = (index, e) => {
        const { name, value } = e.target;
        setFormRows(prevRows => {
            const updatedRows = [...prevRows];
            const updatedRow = { ...updatedRows[index], [name]: value };

            if (name === 'roleId') {
                const selectedRole = roleOptions.find(role => role._id === value);
                updatedRow.roleName = selectedRole ? selectedRole.name : '';
            }

            const salaryPerHead = parseFloat(updatedRow.salaryPerHead) || 0;
            const count = parseInt(updatedRow.count) || 0;
            updatedRow.totalSalary = salaryPerHead * count;

            updatedRows[index] = updatedRow;
            return updatedRows;
        });
    };

    const handleSave = async (index) => {
        setSubmitting(true);
        setFormError(null);

        const rowToSave = formRows[index];

        // Front-end validation checks
        if (!rowToSave.projectId || !rowToSave.roleId || !rowToSave.fromDate || !rowToSave.toDate || rowToSave.salaryPerHead === '' || rowToSave.count === '') {
            setFormError("அனைத்து கட்டங்களும் கட்டாயம் நிரப்பப்பட வேண்டும்.");
            setSubmitting(false);
            return;
        }

        if (new Date(rowToSave.fromDate) > new Date(rowToSave.toDate)) {
            setFormError("From Date, To Date-க்கு பிறகு இருக்க முடியாது.");
            setSubmitting(false);
            return;
        }

        try {
            const dataToSend = {
                projectId: rowToSave.projectId,
                roleId: rowToSave.roleId,
                fromDate: rowToSave.fromDate,
                toDate: rowToSave.toDate,
                salaryPerHead: parseFloat(rowToSave.salaryPerHead),
                count: parseInt(rowToSave.count),
            };

            let response;
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Token not found. Please log in again.');

            if (rowToSave.isNew) {
                response = await fetch(`${API_BASE_URL}/salary-configs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(dataToSend),
                });
            } else {
                response = await fetch(`${API_BASE_URL}/salary-configs/${rowToSave._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(dataToSend),
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to save salary configuration: ${response.statusText}`);
            }

            onSaveSuccess();

        } catch (err) {
            console.error("Error saving salary config:", err);
            setFormError("Failed to save: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const totalProjectSalary = formRows.reduce((acc, row) => acc + (row.totalSalary || 0), 0);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">Project Salary Configurations</h2>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-700">Add/Edit Salary Configurations</h3>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-full shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 flex items-center"
                        >
                            <Undo2 size={20} className="mr-2" /> Back
                        </button>
                    </div>
                </div>

                {formError && <p className="p-4 text-center text-red-600 font-medium border border-red-300 bg-red-50 rounded-md mb-4">{formError}</p>}

                <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">S.No</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">From Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">To Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Salary Per Head</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Count</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total Salary</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {formRows.map((row, index) => (
                                <tr key={row._id || `new-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {row.isEditing ? (
                                            <select
                                                name="roleId"
                                                value={row.roleId}
                                                onChange={(e) => handleRowChange(index, e)}
                                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                                disabled={!row.isNew}
                                            >
                                                <option value="">Select Role</option>
                                                {roleOptions.map(role => (
                                                    <option key={role._id} value={role._id}>{role.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p>{row.roleName}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {row.isEditing ? (
                                            <input
                                                type="date"
                                                name="fromDate"
                                                value={row.fromDate}
                                                onChange={(e) => handleRowChange(index, e)}
                                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                            />
                                        ) : (
                                            <p>{new Date(row.fromDate).toLocaleDateString()}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {row.isEditing ? (
                                            <input
                                                type="date"
                                                name="toDate"
                                                value={row.toDate}
                                                onChange={(e) => handleRowChange(index, e)}
                                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                            />
                                        ) : (
                                            <p>{new Date(row.toDate).toLocaleDateString()}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {row.isEditing ? (
                                            <input
                                                type="number"
                                                name="salaryPerHead"
                                                value={row.salaryPerHead}
                                                onChange={(e) => handleRowChange(index, e)}
                                                min="0"
                                                step="any"
                                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                            />
                                        ) : (
                                            <p>{formatInr(row.salaryPerHead)}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {row.isEditing ? (
                                            <input
                                                type="number"
                                                name="count"
                                                value={row.count}
                                                onChange={(e) => handleRowChange(index, e)}
                                                min="0"
                                                step="1"
                                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                            />
                                        ) : (
                                            <p>{row.count}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatInr(row.totalSalary)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            {row.isEditing ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSave(index)}
                                                        disabled={submitting}
                                                        className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-100 disabled:opacity-50 transition duration-200"
                                                        title="Save"
                                                    >
                                                        <Save size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelEdit(index)}
                                                        className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition duration-200"
                                                        title="Cancel"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEditRow(index)}
                                                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 transition duration-200"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(row._id)}
                                                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition duration-200"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                            <tr>
                                <td colSpan="6" className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase tracking-wider">மொத்த சம்பளம்:</td>
                                <td className="px-6 py-3 text-sm text-gray-800 font-bold">{formatInr(totalProjectSalary)}</td>
                                <td className="px-6 py-3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="flex justify-center mt-6 space-x-4">
                    <button
                        onClick={handleAddRow}
                        className="px-6 py-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center"
                    >
                        <PlusCircle size={20} className="mr-2" /> Add New Role
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalaryConfigForm;
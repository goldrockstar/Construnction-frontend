// ProjectClientForm.js
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AlertCircle, Loader2 } from 'lucide-react';

import authenticatedFetch from '../utils/api'; // புதிய API helper-ஐ இறக்குமதி செய்யவும்

const ProjectClientForm = ({ client, projectId, onClose, onSaveSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const validationSchema = Yup.object({
        clientName: Yup.string().required('கிளையன்ட் பெயர் தேவை'),
        phoneNumber: Yup.string()
            .matches(/^[0-9]+$/, 'தொலைபேசி எண்ணில் எண்கள் மட்டுமே இருக்க வேண்டும்')
            .min(10, 'தொலைபேசி எண் குறைந்தது 10 இலக்கங்கள் இருக்க வேண்டும்')
            .max(15, 'தொலைபேசி எண் அதிகபட்சம் 15 இலக்கங்கள் இருக்க வேண்டும்')
            .required('தொலைபேசி எண் தேவை'),
        gstNo : Yup.string().max(16, 'கிஸ்ட் எண் அதிகபட்சம் 15 இலக்கங்கள் இருக்க வேண்டும்'),
        email: Yup.string().email('தகுந்த மின்னஞ்சல் வடிவம் இல்லை').required('மின்னஞ்சல் தேவை'),
        address: Yup.string(),
        description: Yup.string(),
    });

    const formik = useFormik({
        initialValues: {
            clientName: client?.clientName || '',
            phoneNumber: client?.phoneNumber || '',
            gstNo: client?.gstNo || '',
            email: client?.email || '',
            address: client?.address || '',
            description: client?.description || '',
        },
        validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            setServerError(null);
            setSuccessMessage(null);

            const formData = new FormData();
            formData.append('clientName', values.clientName);
            formData.append('phoneNumber', values.phoneNumber);
            formData.append('gstNo', values.gstNo);
            formData.append('email', values.email);
            formData.append('address', values.address);
            formData.append('description', values.description);
            if (selectedFile) {
                formData.append('photo', selectedFile);
            }

            const isEditing = !!client?._id;
            const method = isEditing ? 'PUT' : 'POST';

            const endpoint = isEditing
                ? `/projects/${projectId}/clients/${client._id}`
                : `/projects/${projectId}/clients`;

            try {
                // authenticatedFetch என்ற helper-ஐ பயன்படுத்தவும்
                const response = await authenticatedFetch(endpoint, {
                    method,
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'ஏதோ தவறு நடந்துவிட்டது.' }));
                    throw new Error(errorData.message || 'கிளையன்ட் விவரங்களைச் சேமிக்க முடியவில்லை.');
                }

                setSuccessMessage(isEditing ? "கிளையன்ட் விவரங்கள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன!" : "கிளையன்ட் வெற்றிகரமாக சேர்க்கப்பட்டார்!");
                setTimeout(onSaveSuccess, 1500);

            } catch (err) {
                console.error("API பிழை:", err);
                if (err.message.includes('அங்கீகார டோக்கன்')) {
                    // authenticatedFetch பிழையை கையாளுதல்
                    setServerError(err.message);
                } else {
                    setServerError(err.message || "கிளையன்ட் விவரங்களைச் சேமிக்க முடியவில்லை. பிணையத்தை சரிபார்க்கவும்.");
                }
            } finally {
                setLoading(false);
            }
        },
    });

    const handleFileChange = (event) => {
        const file = event.currentTarget.files[0];
        setSelectedFile(file);
    };

    useEffect(() => {
        if (client) {
            formik.setValues({
                clientName: client.clientName || '',
                phoneNumber: client.phoneNumber || '',
                gstNo: client.gstNo || '',
                email: client.email || '',
                address: client.address || '',
                description: client.description || '',
            });
            setSelectedFile(null);
        } else {
            formik.resetForm();
            setSelectedFile(null);
        }
    }, [client]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {client ? 'கிளையன்ட் விவரங்களைத் திருத்து' : 'புதிய கிளையன்ட்டைச் சேர்'}
            </h2>
            <form onSubmit={formik.handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Client Name Field */}
                    <div>
                        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">கிளையன்ட் பெயர்<span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="clientName"
                            name="clientName"
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${formik.touched.clientName && formik.errors.clientName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.clientName}
                            placeholder="கிளையன்ட் பெயர்"
                        />
                        {formik.touched.clientName && formik.errors.clientName && (
                            <p className="mt-1 text-sm text-red-500">{formik.errors.clientName}</p>
                        )}
                    </div>

                    {/* Phone Number Field */}
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">தொலைபேசி எண்<span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="phoneNumber"
                            name="phoneNumber"
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${formik.touched.phoneNumber && formik.errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.phoneNumber}
                            placeholder="எ.கா., 9876543210"
                        />
                        {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                            <p className="mt-1 text-sm text-red-500">{formik.errors.phoneNumber}</p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className="md:col-span-2">
                        <label htmlFor="gstNo" className="block text-sm font-medium text-gray-700 mb-1">GST NO<span className="text-red-500">*</span></label>
                        <input
                            type="gstNo"
                            id="gstNo"
                            name="gstNo"
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${formik.touched.email && formik.errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.gstNo}
                            placeholder="Gst No"
                        />
                        {formik.touched.gstNo && formik.errors.gstNo && (
                            <p className="mt-1 text-sm text-red-500">{formik.errors.gstNo}</p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className="md:col-span-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">மின்னஞ்சல்<span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${formik.touched.email && formik.errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.email}
                            placeholder="example@example.com"
                        />
                        {formik.touched.email && formik.errors.email && (
                            <p className="mt-1 text-sm text-red-500">{formik.errors.email}</p>
                        )}
                    </div>

                    {/* Photo File Upload Field */}
                    <div className="md:col-span-2">
                        <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">புகைப்படம்</label>
                        <input
                            type="file"
                            id="photo"
                            name="photo"
                            className="w-full px-3 py-2 border rounded-md shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            onChange={handleFileChange}
                        />
                        {selectedFile && (
                            <p className="mt-2 text-sm text-gray-500">தேர்ந்தெடுக்கப்பட்ட கோப்பு: {selectedFile.name}</p>
                        )}
                    </div>

                    {/* Address Field */}
                    <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">முகவரி</label>
                        <textarea
                            id="address"
                            name="address"
                            rows="2"
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${formik.touched.address && formik.errors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.address}
                            placeholder="கிளையன்ட்டின் முகவரியை உள்ளிடவும்"
                        />
                    </div>

                    {/* Description Field */}
                    <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">விளக்கம்</label>
                        <textarea
                            id="description"
                            name="description"
                            rows="3"
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${formik.touched.description && formik.errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.description}
                            placeholder="ஒரு சிறிய விளக்கம் அல்லது குறிப்புகளைச் சேர்க்கவும்"
                        />
                    </div>
                </div>

                {/* Loading and Error states */}
                {loading && (
                    <div className="flex items-center justify-center my-4 text-indigo-600 space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>சேமிக்கப்படுகிறது...</span>
                    </div>
                )}
                {serverError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md flex items-center space-x-2 mb-4" role="alert">
                        <AlertCircle className="h-5 w-5" />
                        <span>{serverError}</span>
                    </div>
                )}
                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded relative mb-4">
                        {successMessage}
                    </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                        disabled={loading}
                    >
                        ரத்துசெய்
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={loading}
                    >
                        {client ? 'புதுப்பி' : 'சேமி'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectClientForm;

import React from 'react';

const FormComponent = ({
  title,
  fields,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  loading = false,
  children
}) => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field, index) => (
              <div key={index}>
                <label htmlFor={field.name} className="block text-gray-700 text-sm font-bold mb-2">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    required={field.required}
                    className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={field.readOnly}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((option, optIndex) => (
                      <option key={optIndex} value={option.value || option}>
                        {option.label || option}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    required={field.required}
                    placeholder={field.placeholder}
                    readOnly={field.readOnly}
                    rows="4"
                    className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    required={field.required}
                    placeholder={field.placeholder}
                    readOnly={field.readOnly}
                    min={field.min}
                    max={field.max}
                    className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
          {children}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
              disabled={loading}
            >
              {loading ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormComponent;

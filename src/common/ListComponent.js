import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

/**
 * ListComponent: ஒரு பொதுவான கூறு, இது தரவுப் பட்டியலைக் காண்பிக்கவும், திருத்தவும், நீக்கவும் பயன்படுத்தப்படுகிறது.
 * இது ஒரு அட்டவணை வடிவத்தில் தரவைக் காட்டுகிறது.
 *
 * @param {object} props - கூறிற்கான ப்ராப்ஸ்.
 * @param {Array<object>} props.data - அட்டவணையில் காட்டப்பட வேண்டிய தரவு வரிசை.
 * @param {Array<object>} props.columns - அட்டவணையின் நெடுவரிசை வரையறைகள்.
 * ஒவ்வொரு நெடுவரிசைக்கும்:
 * - {string} header: நெடுவரிசை தலைப்பு.
 * - {string} accessor: தரவுப் பொருளில் உள்ள புலம் பெயர்.
 * - {function} [render]: தனிப்பயன் ரெண்டரிங் செயல்பாடு (விரும்பினால்).
 * @param {function} props.onEdit - ஒரு பொருளைத் திருத்தும்போது அழைக்கப்படும் செயல்பாடு.
 * @param {function} props.onDelete - ஒரு பொருளை நீக்கும்போது அழைக்கப்படும் செயல்பாடு.
 * @param {string} props.title - பட்டியலின் தலைப்பு.
 * @param {function} [props.onAdd] - புதிய பொருளைச் சேர்க்கும்போது அழைக்கப்படும் செயல்பாடு (விரும்பினால்).
 * @param {string} [props.addLabel] - சேர் பொத்தானின் லேபிள் (விரும்பினால்).
 */
const ListComponent = ({ data, columns, onEdit, onDelete, title, onAdd, addLabel }) => {
  if (!data || !Array.isArray(data)) {
    return <p className="text-gray-500 text-center py-4">தரவு ஏற்றப்படவில்லை அல்லது தவறானது.</p>; // Data not loaded or invalid.
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-custom overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {onAdd && (
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-blue-700 shadow-md flex items-center transition duration-200"
          >
            <span className="mr-2">+</span>{addLabel || 'புதியதைச் சேர்'} {/* Add New */}
          </button>
        )}
      </div>
      {data.length > 0 ? (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                வரிசை எண் {/* S.No */}
              </th>
              {columns.map((col, index) => (
                <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                செயல்கள் {/* Actions */}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={item.id || index}> {/* Use item.id if available, otherwise index */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {index + 1}
                </td>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {col.render ? col.render(item) : item[col.accessor]}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4 p-1 rounded-full hover:bg-indigo-100 transition duration-200"
                      title="திருத்து"
                    >
                      <Edit size={18} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition duration-200"
                      title="நீக்கு"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 text-center py-4">தரவு எதுவும் காணப்படவில்லை</p> 
      )}
    </div>
  );
};

export default ListComponent;

const MessageBox = ({ message, type, onClose }) => {
  const bgColor = type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
  return (
    <div title={type === 'error' ? 'Error' : 'Success'} onClose={onClose}>
      <div className={`p-4 rounded-md ${bgColor}`}>
        <p className="text-sm font-medium">{message}</p>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default MessageBox;
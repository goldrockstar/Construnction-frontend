const PrintableReceipt = ({ receipt }) => {
    if (!receipt) return null;
    return (
        <div className="p-8 font-sans">
            <div className="max-w-4xl mx-auto bg-white border-2 border-black p-8">
                <h1 className="text-2xl font-bold mb-4 text-center">Receipt</h1>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <p><strong>Receipt No:</strong> {receipt.receiptNo}</p>
                        <p><strong>Date:</strong> {new Date(receipt.date).toLocaleDateString()}</p>
                    </div>
                    <div className="col-span-1 text-right">
                        <p><strong>Amount:</strong> ₹{Number(receipt.amount).toFixed(2)}</p>
                    </div>
                </div>
                <div className="my-4 border-t border-b border-gray-300 py-4">
                    <p><strong>Description:</strong> {receipt.description}</p>
                </div>
                <div className="flex justify-between items-end mt-8">
                    <div>
                        <p><strong>Signed Date:</strong> {new Date(receipt.signedDate).toLocaleDateString()}</p>
                    </div>
                    {receipt.signatureImage && (
                        <div className="text-center">
                            <img src={receipt.signatureImage} alt="Signature" className="h-16 w-auto" />
                            <p className="mt-2 text-sm">Signature</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrintableReceipt;
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const PrintReceipt = () => {
    const { id } = useParams();
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // முதல் useEffect: டேட்டாவை fetch செய்ய
    useEffect(() => {
        const fetchReceiptForPrint = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Authentication token not found.");

                const response = await fetch(`${API_BASE_URL}/receipts/${id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to fetch receipt: ${response.statusText}`);
                }

                const data = await response.json();
                setReceipt(data);
            } catch (err) {
                console.error("Error fetching receipt for print:", err);
                setError("Failed to load receipt data for printing.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchReceiptForPrint();
        }
    }, [id]);

    // இரண்டாவது useEffect: டேட்டா வந்ததும் பிரிண்ட் செய்ய
    useEffect(() => {
        if (receipt && !loading && !error) {
            // DOM ரெண்டர் ஆவதற்காக ஒரு சிறிய தாமதம்
            const timer = setTimeout(() => {
                window.print();
            }, 500); // 500ms தாமதம் போதுமானது

            return () => clearTimeout(timer); // Cleanup function
        }
    }, [receipt, loading, error]);

    if (loading) {
        return <div className="p-4 text-center">Loading receipt data...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-600">{error}</div>;
    }

    if (!receipt) {
        return <div className="p-4 text-center">No receipt data found.</div>;
    }

    // டேட்டா ரெண்டரிங் பகுதி
    return (
        <div className="p-8 font-sans bg-gray-100 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
                <div className="flex justify-between items-start border-b border-gray-300 pb-4 mb-6">
                    {/* ... உங்கள் receipt layout-ஐ இங்கே சேர்க்கவும் ... */}
                </div>
                {/* ... */}
                {/* இப்போது பிரிண்ட் பட்டனை நீக்கிவிடவும், ஏனெனில் அது தானாகவே இயங்கும் */}
            </div>
        </div>
    );
};

export default PrintReceipt;
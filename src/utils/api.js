// src/utils/api.js
// இது அங்கீகார டோக்கனுடன் API அழைப்புகளைச் செய்வதற்கான ஒரு helper function.
// இது குறியீட்டை மீண்டும் பயன்படுத்தக்கூடியதாகவும், பராமரிக்க எளிதாகவும் மாற்ற உதவுகிறது.

const API_BASE_URL = 'https://construction-backend-uwd8.onrender.com/api';

const authenticatedFetch = async (endpoint, options = {}) => {
    // localStorage-ல் இருந்து அங்கீகார டோக்கனைப் பெறவும்.
    const token = localStorage.getItem('token');
    
    // டோக்கன் இல்லையென்றால், ஒரு பிழையை எறியவும்.
    // இந்த பிழையை அழைக்கும் component கையாண்டு, உள்நுழைவு பக்கத்திற்குத் திருப்பிவிடும்.
    if (!token) {
        throw new Error("அங்கீகார டோக்கன் கிடைக்கவில்லை. உள்நுழையவும்.");
    }

    // அங்கீகார header-ஐ சேர்க்கவும்
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    // API அழைப்பை மேற்கொள்ளவும்
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    // 401 பிழையைக் கண்டால், டோக்கனை நீக்கிவிட்டு பிழையை எறியவும்
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        throw new Error('செல்லாத அல்லது காலாவதியான டோக்கன். மீண்டும் உள்நுழையவும்.');
    }

    return response;
};

export default authenticatedFetch;

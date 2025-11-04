// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageModal from '../model/MessageModal'; // Custom modal for alerts

// URL-ஐ சரிசெய்யவும்
const API_BASE_URL = 'http://localhost:5000/api';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) { 
          localStorage.setItem('token', data.token);
          localStorage.setItem('userRole', data.role);
          localStorage.setItem('userId', data._id); 

          setSuccess(true);
          
          if (onLoginSuccess) {
            onLoginSuccess(data.role);
          }

          setTimeout(() => {
            navigate('/dashboard');
          }, 1500); 
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed.');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.message || 'உள்நுழைவின்போது எதிர்பாராத பிழை ஏற்பட்டது.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username</label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4">Login successful! Redirecting...</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? 'Logging In...' : 'Login'}
            </button>
            <a href="#" className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800">
              கடவுச்சொல்லை மறந்துவிட்டீர்களா?
            </a>
          </div>
        </form>
      </div>
      {success && (
        <MessageModal
          message="உள்நுழைவு வெற்றிகரமாக முடிந்தது!"
          onClose={() => setSuccess(false)}
        />
      )}
      {error && (
        <MessageModal
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
};

export default Login;
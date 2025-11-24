import React, { useState } from 'react';
import { 
    Menu, 
    ChevronDown,
    User,
    Settings,
    LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ onToggleSidebar, currentUser = { name: 'John Doe', role: 'Administrator' }, onLogout }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);

    const navigate = useNavigate()

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-3 py-1.5">
            <h2 className='text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent'>Biz Master</h2>
            {/* Left Section - Menu Button Only */}
            <div className="flex items-center">
                <button
                    onClick={onToggleSidebar}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200 lg:hidden"
                >
                    <Menu className="h-4 w-4 text-gray-600" />
                </button>
            </div>

            {/* Right Section - User Only */}
            <div className="flex items-center">
                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
                    >
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow">
                            <span className="text-white text-xs font-bold">
                                {currentUser.name?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${
                            showUserMenu ? 'rotate-180' : ''
                        }`} />
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                        <div className="absolute right-0 top-8 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                            <div className="p-1">
                                <button className="flex items-center w-full p-2 rounded-md hover:bg-gray-50 transition-colors duration-200 text-gray-700 text-xs"
                                onClick={() => navigate('/profile')}
                                >
                                    <User className="h-3 w-3 mr-2" />
                                    <span>Profile</span>
                                </button>
                                <div className="border-t border-gray-200 my-1"></div>
                                <button
                                    onClick={onLogout} 
                                className="flex items-center w-full p-2 rounded-md hover:bg-red-50 transition-colors duration-200 text-red-600 text-xs">
                                    <LogOut className="h-3 w-3 mr-2" />
                                    <span>Log Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </header>
);
};

export default TopBar;



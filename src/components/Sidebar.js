import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    UserCircle,
    Settings,
    Users,
    Package,
    Briefcase,
    PlusSquare,
    DollarSign,
    Receipt,
    LogOut,
    ClipboardList,
    FileText,
    Warehouse,
    LineChart,
    ChevronRight,
    Building2,
    BarChart3 // Replacing Report with BarChart3
} from 'lucide-react';

const Sidebar = ({  currentUserRole }) => {
    const [openMenus, setOpenMenus] = useState({});

    const toggleMenu = (menuName) => {
        setOpenMenus(prev => ({
            ...prev,
            [menuName]: !prev[menuName]
        }));
    };

    const menuItems = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard,
            type: 'link'
        },
        // {
        //     name: 'Profile',
        //     path: '/profile',
        //     icon: UserCircle,
        //     type: 'link'
        // },
        {
            name: 'Settings',
            icon: Settings,
            type: 'dropdown',
            items: [
                { name: 'Role', path: '/roles', icon: Users },
                { name: 'Material', path: '/materials', icon: Package },
                { name: 'Manpower', path: '/manpower', icon: Users }
            ]
        },
        {
            name: 'Projects',
            icon: Briefcase,
            type: 'dropdown',
            items: [
                { name: 'Project List', path: '/projects', icon: PlusSquare },
            ]
        },
        { 
          name: 'Quotation', 
          path: '/quotation', 
          icon: FileText ,
          type: 'link'
        },
        { 
          name: 'Invoice List', 
          path: '/invoices/:invoiceId', 
          icon: ClipboardList, 
          type: 'link'
        },
        // {
        //     name: 'Expenditure',
        //     path: '/personal-expenditure',
        //     icon: DollarSign,
        //     type: 'link'
        // },
        {
            name: 'Reports',
            icon: BarChart3, // Using BarChart3 instead of Report
            type: 'dropdown',
            items: [
                { name: 'Business Report', path: '/salary-report', icon: FileText },
                { name: 'Material Report', path: '/stock-report', icon: Warehouse },
                { name: 'Financial Report', path: '/profit-loss-report', icon: LineChart }
            ]
        },
        {
            name: 'Receipt',
            path: '/receipt',
            icon: Receipt,
            type: 'link'
        }
    ];

    return (
        <aside className="bg-gradient-to-b from-gray-900 to-gray-800 text-white w-72 min-h-screen p-6 flex flex-col shadow-2xl border-r border-gray-700">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-10 pb-6 border-b border-gray-700">
                <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                    <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        Biz Master
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">Business Management Suite</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => (
                    <div key={item.name}>
                        {item.type === 'link' ? (
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center p-3 rounded-xl transition-all duration-300 group no-underline ${
                                        isActive 
                                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-l-4 border-yellow-400 text-yellow-400 shadow-lg' 
                                        : 'hover:bg-gray-750 hover:translate-x-1 text-gray-300 hover:text-white'
                                    }`
                                }
                            >
                                <item.icon className={`h-5 w-5 mr-3 transition-transform duration-300 ${
                                    item.name === 'Dashboard' ? 'group-hover:scale-110' : ''
                                }`} />
                                <span className="font-medium">{item.name}</span>
                            </NavLink>
                        ) : (
                            <div className="group">
                                <button
                                    onClick={() => toggleMenu(item.name)}
                                    className={`flex items-center justify-between w-full p-3 rounded-xl transition-all duration-300 ${
                                        openMenus[item.name] 
                                        ? 'bg-gray-750 text-yellow-400' 
                                        : 'hover:bg-gray-750 text-gray-300 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <item.icon className="h-5 w-5 mr-3" />
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    <ChevronRight 
                                        className={`h-4 w-4 transition-transform duration-300 ${
                                            openMenus[item.name] ? 'rotate-90' : ''
                                        }`} 
                                    />
                                </button>
                                
                                <div className={`overflow-hidden transition-all duration-300 ${
                                    openMenus[item.name] ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                    <ul className="ml-6 mt-2 space-y-1 border-l-2 border-gray-600 pl-3 py-2">
                                        {item.items.map((subItem) => (
                                            <li key={subItem.name}>
                                                <NavLink
                                                    to={subItem.path}
                                                    className={({ isActive }) =>
                                                        `flex items-center p-2 rounded-lg transition-all duration-200 group no-underline ${
                                                            isActive 
                                                            ? 'text-yellow-400 font-medium' 
                                                            : 'text-gray-400 hover:text-white hover:translate-x-1'
                                                        }`
                                                    }
                                                >
                                                    <subItem.icon className="h-4 w-4 mr-2" />
                                                    <span className="text-sm">{subItem.name}</span>
                                                </NavLink>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
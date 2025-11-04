import React from 'react';
import { NavLink } from 'react-router-dom';

// The original icons were from an older version of Heroicons.
// This new set of imports uses 'lucide-react', a popular and modern icon library.
// You will need to install this library by running 'npm install lucide-react'
// in your project's terminal.
import {
    LayoutDashboard,
    UserCircle,
    Settings,
    Users,
    // The 'Cubes' and 'Toolbox' icons don't exist in the 'lucide-react' library.
    // I've replaced them with 'Package' and 'Briefcase' which are a good match for the intent.
    Package, // Replaced Cubes
    Briefcase, // Replaced Toolbox
    PlusSquare,
    DollarSign,
    Report,
    Receipt,
    LogOut,
    ClipboardList,
    FileText,
    Warehouse,
    LineChart
} from 'lucide-react';

const Sidebar = ({ onLogout, currentUserRole }) => {
    return (
        <aside className="bg-gray-800 text-white w-64 min-h-screen p-4 flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-xl font-bold">Biz Master</h1>
            </div>

            <nav className="flex-1">
                <ul className="space-y-2">
                    {/* Dashboard */}
                    <li>
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                                `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-700'}`
                            }
                        >
                            <LayoutDashboard className="h-5 w-5 mr-3" />
                            Dashboard
                        </NavLink>
                    </li>
                    {/* Profile */}
                    <li>
                        <NavLink
                            to="/profile"
                            className={({ isActive }) =>
                                `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-700'}`
                            }
                        >
                            <UserCircle className="h-5 w-5 mr-3" />
                            Profile
                        </NavLink>
                    </li>
                    {/* Settings */}
                    <li>
                        <details className="group">
                            <summary className="flex items-center p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors duration-200">
                                <Settings className="h-5 w-5 mr-3" />
                                Settings
                                <span className="ml-auto transform group-open:rotate-90 transition-transform">
                                    &gt;
                                </span>
                            </summary>
                            <ul className="ml-6 mt-2 space-y-1">
                                <li>
                                    <NavLink
                                        to="/roles"
                                        className={({ isActive }) =>
                                            `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-700'}`
                                        }
                                    >
                                        <Users className="h-5 w-5 mr-3" />
                                        Role
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/materials"
                                        className={({ isActive }) =>
                                            `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-700'}`
                                        }
                                    >
                                        {/* Replaced GiMaterialsScienceIcon with Cubes, now replaced Cubes with Package */}
                                        <Package className="h-5 w-5 mr-3" />
                                        Material
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/manpower"
                                        className={({ isActive }) =>
                                            `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-700'}`
                                        }
                                    >
                                        <Users className="h-5 w-5 mr-3" />
                                        Manpower
                                    </NavLink>
                                </li>
                            </ul>
                        </details>
                    </li>
                    {/* Projects */}
                    <li>
                        <details className="group">
                            <summary className="flex items-center p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors duration-200">
                                {/* Replaced Toolbox with Briefcase */}
                                <Briefcase className="h-5 w-5 mr-3" />
                                Projects
                                <span className="ml-auto transform group-open:rotate-90 transition-transform">
                                    &gt;
                                </span>
                            </summary>
                            <ul className="ml-6 mt-2 space-y-1">
                                <li>
                                    <NavLink
                                        to="/projects"
                                        className={({ isActive }) =>
                                            `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-700'}`
                                        }
                                    >
                                        <PlusSquare className="h-5 w-5 mr-3" />
                                        Project List
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/quotation"
                                        className={({ isActive }) =>
                                            `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-700'}`
                                        }
                                    >
                                        <PlusSquare className="h-5 w-5 mr-3" />
                                        Quotation
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/invoices/:invoiceId"
                                        className={({ isActive }) =>
                                            `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-700'}`
                                        }
                                    >
                                        <PlusSquare className="h-5 w-5 mr-3" />
                                        Invoice List
                                    </NavLink>
                                </li>
                            </ul>
                        </details>
                    </li>
                    {/* Expenditure */}
                    <li>
                        <NavLink
                            to="/personal-expenditure"
                            className={({ isActive }) =>
                                `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-700'}`
                            }
                        >
                            <DollarSign className="h-5 w-5 mr-3" />
                            Expenditure
                        </NavLink>
                    </li>
                    {/* Reports */}
                    <li>
                        <details className="group">
                            <summary className="flex items-center p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors duration-200">
                                <ClipboardList className="h-5 w-5 mr-3" />
                                Reports
                                <span className="ml-auto transform group-open:rotate-90 transition-transform">
                                    &gt;
                                </span>
                            </summary>
                            <ul className="ml-6 mt-2 space-y-1">
                                <li>
                                    <NavLink
                                        to="/salary-report"
                                        className={({ isActive }) =>
                                            `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-700'}`
                                        }
                                    >
                                        <FileText className="h-5 w-5 mr-3" />
                                        Salary Report
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/stock-report"
                                        className={({ isActive }) =>
                                            `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-700'}`
                                        }
                                    >
                                        {/* Replaced GiMaterialsScienceIcon with Cubes, now replaced Cubes with Package */}
                                        <Warehouse className="h-5 w-5 mr-3" />
                                        Stock Report
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/profit-loss-report"
                                        className={({ isActive }) =>
                                            `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-700'}`
                                        }
                                    >
                                        <LineChart className="h-5 w-5 mr-3" />
                                        Profit/Loss Report
                                    </NavLink>
                                </li>
                            </ul>
                        </details>
                    </li>
                    {/* Receipt */}
                    <li>
                        <NavLink
                            to="/receipt"
                            className={({ isActive }) =>
                                `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-yellow-400' : 'hover:bg-gray-700'}`
                            }
                        >
                            <Receipt className="h-5 w-5 mr-3" />
                            Receipt
                        </NavLink>
                    </li>
                </ul>
            </nav>
            {/* Logout button at the bottom */}
            <div className="mt-auto">
                <button
                    onClick={onLogout}
                    className="flex items-center p-3 w-full rounded-lg transition-colors duration-200 text-red-400 hover:bg-red-700 hover:text-white"
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react'; // Three dots icon

const Dropdown = ({ children, align = 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const alignClass = align === 'right' ? 'right-0' : 'left-0';

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div>
                <button
                    type="button"
                    onClick={toggleDropdown}
                    className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition duration-200"
                    id="menu-button"
                    aria-expanded="true"
                    aria-haspopup="true"
                >
                    <MoreVertical size={20} />
                </button>
            </div>

            {isOpen && (
                <div
                    className={`origin-top-right absolute ${alignClass} mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10`}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                    tabIndex="-1"
                >
                    <div className="py-1" role="none">
                        {/* Children will be the dropdown items */}
                        {React.Children.map(children, child =>
                            React.cloneElement(child, {
                                onClick: () => {
                                    if (child.props.onClick) child.props.onClick();
                                    setIsOpen(false); // Close dropdown after item click
                                }
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;
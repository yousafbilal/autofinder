import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown } from "react-icons/fa";
import { useLanguage } from '../Context/LanguageContext';

const CustomSelect = ({
    options,
    value,
    onChange,
    placeholder = "Select",
    className = "",
    icon = null,
    searchable = false,
}) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter options if searchable
    const filteredOptions = searchable
        ? options.filter((option) =>
            option.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
        : options;

    const handleSelect = (option) => {
        onChange(option);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button" // Prevent form submission
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-[9px] xs:text-[10px] sm:text-xs border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-between gap-2"
            >
                <span className="truncate flex-1 text-left">
                    {value || placeholder}
                </span>
                <FaChevronDown
                    className={`text-gray-400 text-[10px] sm:text-xs transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""
                        }`}
                />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    {searchable && (
                        <div className="sticky top-0 p-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('search')}
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                                autoFocus
                            />
                        </div>
                    )}
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <div
                                key={index}
                                onClick={() => handleSelect(option)}
                                className={`px-3 py-2 text-[10px] sm:text-xs cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors ${value === option
                                    ? "bg-red-50 dark:bg-red-900/10 text-red-600 font-medium"
                                    : "text-gray-700 dark:text-gray-300"
                                    }`}
                            >
                                {option}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-[10px] sm:text-xs text-gray-400 text-center">
                            {t('noData')}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;

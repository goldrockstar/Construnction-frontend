// This file contains helper functions for formatting data.

/**
 * Formats a number as Indian Rupees.
 * @param {number} amount
 * @returns {string} Formatted currency string.
 */
export const formatInr = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * Formats a date string to a human-readable format.
 * @param {string} dateString
 * @returns {string} Formatted date string (e.g., DD/MM/YYYY).
 */
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Formats a date string to the 'yyyy-mm-dd' format required for HTML date inputs.
 * @param {string} dateString
 * @returns {string} Formatted date string for input.
 */
export const formatDateToInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

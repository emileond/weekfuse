import { useState, useEffect } from 'react';

// Custom Hook
export function useDarkMode() {
    const [darkMode, setDarkMode] = useState(() => {
        // Initialize dark mode from local storage or default to false
        return localStorage.getItem('darkMode') === 'true';
    });

    // Update the `classList` of the document body when darkMode changes
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        // Save the preference to local storage
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    // Function to toggle dark mode
    const toggleDarkMode = (b) => setDarkMode(!darkMode);

    return [darkMode, toggleDarkMode];
}

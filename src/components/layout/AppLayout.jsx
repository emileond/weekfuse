import { useState, useEffect } from 'react';
import Sidebar from '../nav/Sidebar';
import Appbar from '../nav/Appbar';
import TakuWidget from '../marketing/TakuWidget.js';

function AppLayout({ children }) {
    const [showSidebar, setShowSidebar] = useState(true);

    // Check screen size and set showSidebar
    useEffect(() => {
        const handleResize = () => {
            setShowSidebar(window.innerWidth >= 639); // md breakpoint is typically 768px
        };

        handleResize(); // Set initial value
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className={`flex ${!showSidebar && 'flex-col'} h-screen w-screen overflow-hidden`}>
            <TakuWidget />
            {showSidebar && <Sidebar />}
            {!showSidebar && <Appbar />}
            {children}
        </div>
    );
}

export default AppLayout;

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import Footer from '../components/marketing/Footer.jsx';
import NavBar from '../components/marketing/Nav.jsx';

function TOSPage() {
    const location = useLocation();
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        const scriptId = 'getterms-embed-js';

        // Function to reinitialize the GetTerms embed
        const initializeEmbed = () => {
            if (window.GetTermsEmbed) {
                window.GetTermsEmbed.init();
            } else {
                // GetTermsEmbed might not be immediately available, retry after a short delay
                setTimeout(initializeEmbed, 200); // Check every 200ms
            }
        };

        // Check if script is already added
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://app.getterms.io/dist/js/embed.js';
            script.async = true;
            script.onload = () => {
                setScriptLoaded(true);
                initializeEmbed();
            };
            script.onerror = () => {
                console.error('Failed to load GetTerms embed script.');
            };
            document.body.appendChild(script);
        } else {
            setScriptLoaded(true);
            initializeEmbed();
        }

        // Cleanup function: remove the script when the component unmounts (optional but good practice)
        return () => {
            const existingScript = document.getElementById(scriptId);
            if (existingScript) {
                document.body.removeChild(existingScript);
            }
            setScriptLoaded(false); // Reset the scriptLoaded state
        };
    }, [location.pathname]);

    return (
        <div className="w-screen">
            <NavBar />
            <PageLayout title="">
                <div
                    className="w-full getterms-document-embed"
                    data-getterms="CUkTN"
                    data-getterms-document="tos"
                    data-getterms-lang="en-us"
                    data-getterms-mode="direct"
                ></div>
            </PageLayout>
            <Footer />
        </div>
    );
}

export default TOSPage;

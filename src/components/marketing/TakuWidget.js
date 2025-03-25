import { useEffect } from 'react';

const TakuWidget = () => {
    useEffect(() => {
        let scriptElement = null;
        if (!document.getElementById('taku-js')) {
            scriptElement = document.createElement('script');
            scriptElement.id = 'taku-js';
            scriptElement.src = 'https://cdn.taku-app.com/js/latest.js';
            scriptElement.async = true;

            const handleError = () => {
                console.error('Failed to load Taku widget script');
            };

            scriptElement.addEventListener('error', handleError);
            scriptElement.onload = () => {
                if (window.Taku) {
                    window.Taku('news:boot', {
                        api_public_key: import.meta.env.VITE_TAKU_PUBLIC_KEY,
                        position: 'right',
                        custom_launcher: '.taku-launcher',
                        custom_launcher_options: {
                            show_unread_badge: true,
                        },
                    });
                }
            };

            document.body.appendChild(scriptElement);
        }
        return () => {
            if (scriptElement) {
                scriptElement.remove();
            }
        };
    }, []);

    return null; // No UI, just loading the script
};

export default TakuWidget;

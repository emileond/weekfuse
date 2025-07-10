import Paywall from '../../components/marketing/Paywall.jsx';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PaywallPage() {
    const [currentWorkspace] = useCurrentWorkspace();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentWorkspace?.subscription_status !== 'trial ended') {
            navigate('/dashboard');
        }
    }, [currentWorkspace, navigate]);
    
    const handleOpenChange = () => {
        // Do nothing. This effectively prevents the user from closing the modal.
    };

    return (
        <div className="w-screen h-screen bg-gray-100 dark:bg-gray-900">
            <Paywall
                isOpen={true}
                onOpenChange={handleOpenChange}
                title="Your trial has ended"
                feature="unlimited access"
                volumePricing={false}
            />
        </div>
    );
}

export default PaywallPage;

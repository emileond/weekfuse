import Paywall from '../../components/marketing/Paywall.jsx'; // Adjust the import path

function PaywallPage() {
    // This is the page the user is redirected to when their trial ends.
    // It's a simple, empty shell that hosts your Paywall modal.

    // The key here is that the modal is always "open" and cannot be closed
    // because there's nothing else on the page to go back to.
    // We pass a dummy onOpenChange function.
    const handleOpenChange = () => {
        // Do nothing. This effectively prevents the user from closing the modal.
    };

    return (
        <div className="w-screen h-screen bg-gray-100 dark:bg-gray-900">
            {/* Render your existing Paywall component.
              It's always open and configured for the "trial ended" scenario.
            */}
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

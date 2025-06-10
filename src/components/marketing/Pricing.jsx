import VolumePricingCard from './VolumePricingCard';
import PricingPlans from './PricingPlans';

function Pricing({ volumePricing = false, isLanding }) {
    return (
        <div id="pricing" className="w-full max-w-5xl mx-auto py-32 px-6 flex flex-col gap-6">
            <h2 className="text-3xl font-bold text-center">Simple pricing</h2>
            <p className="text-center text-default-500">Choose the plan that works best for you.</p>

            <div className="py-6 mx-auto w-full max-w-5xl flex flex-col gap-6 items-center justify-center">
                {volumePricing ? <VolumePricingCard isLanding={isLanding} /> : <PricingPlans />}
            </div>
            <p className="text-center text-sm text-default-500">All prices are in USD.</p>
        </div>
    );
}

export default Pricing;

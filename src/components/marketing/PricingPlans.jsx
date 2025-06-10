import { Button, ButtonGroup, Chip } from '@heroui/react';
import PricingCard from './PricingCard';
import { useState } from 'react';

function PricingPlans() {
    const [isYearly, setIsYearly] = useState(true);

    const plans = [
        {
            name: 'Personal Plan',
            price: 12,
            yearlyPrice: 108,
            features: ['1 User', '3 Guests', 'All Weekfuse Features'],
        },
        {
            name: 'Team Plan',
            price: 49,
            yearlyPrice: 432,
            features: ['Up to 50 Users & Guests', 'All Weekfuse Features'],
            highlight: true,
        },
    ];

    return (
        <>
            <ButtonGroup size="sm" className="mb-3">
                <Button
                    color={isYearly ? 'primary' : 'default'}
                    variant={isYearly ? 'flat' : 'faded'}
                    endContent={
                        <Chip size="sm" color="primary">
                            Save 20%
                        </Chip>
                    }
                    onPress={() => setIsYearly(true)}
                >
                    Yearly
                </Button>
                <Button
                    color={isYearly ? 'default' : 'primary'}
                    variant={isYearly ? 'faded' : 'flat'}
                    onPress={() => setIsYearly(false)}
                >
                    Monthly
                </Button>
            </ButtonGroup>
            <div className="w-full flex flex-wrap gap-6">
                {plans.map((plan, index) => (
                    <PricingCard
                        key={index}
                        name={plan?.name}
                        price={plan?.price}
                        yearlyPrice={plan?.yearlyPrice}
                        isYearly={isYearly}
                        features={plan?.features}
                        highlight={plan?.highlight}
                    />
                ))}
            </div>
        </>
    );
}

export default PricingPlans;

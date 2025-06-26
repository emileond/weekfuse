import { Button, Card, CardBody } from '@heroui/react';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import Paywall from './Paywall';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { RiArrowRightLine } from 'react-icons/ri';

function TrialEndsCard() {
    const [currentWorkspace] = useCurrentWorkspace();
    const [isPaywallOpen, setIsPaywallOpen] = useState(false);
    const navigate = useNavigate();

    const trialEndDate = dayjs(currentWorkspace.trial_ends_at);
    const daysLeft = trialEndDate.diff(dayjs(), 'day');
    const hoursLeft = trialEndDate.diff(dayjs(), 'hour');

    const handleClick = () => {
        if (currentWorkspace?.is_ltd) {
            navigate('/settings');
        } else {
            setIsPaywallOpen(true);
        }
    };

    return (
        <>
            <Card
                shadow="none"
                isPressable
                className="bg-content3 border-1 border-default-300 shadow-none hover:scale-105 cursor-pointer"
                onPress={handleClick}
            >
                <CardBody className="text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <span className="font-medium text-sm text-default-700">
                            {daysLeft > 1 ? (
                                `Your trial ends in ${daysLeft} days`
                            ) : daysLeft === 1 ? (
                                "Your trial ends in 1 day"
                            ) : hoursLeft > 0 ? (
                                `Your trial ends in less than a day`
                            ) : (
                                "Your trial ends today"
                            )}
                        </span>

                        <Button
                            isDisabled
                            size="sm"
                            color="secondary"
                            className="text-secondary-900 opacity-90 font-medium"
                            endContent={<RiArrowRightLine fontSize="1rem" />}
                        >
                            Get the LTD Plan
                        </Button>
                    </div>
                </CardBody>
            </Card>
            <Paywall
                volumePricing={false}
                isOpen={isPaywallOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsPaywallOpen(false);
                    }
                }}
                feature="lifetime access"
            />
        </>
    );
}

export default TrialEndsCard;

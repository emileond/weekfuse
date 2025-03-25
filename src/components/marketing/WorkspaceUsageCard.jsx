import { Card, CardBody, Progress } from '@heroui/react';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { useWorkspaceCredits } from '../../hooks/react-query/credits/useWorkspaceCredits';
import Paywall from './Paywall';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function WorkspaceUsageCard() {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: credits } = useWorkspaceCredits(currentWorkspace);
    const [isPaywallOpen, setIsPaywallOpen] = useState(false);
    const navigate = useNavigate();

    const handleClick = () => {
        if (currentWorkspace?.is_ltd) {
            navigate('/settings');
        } else {
            setIsPaywallOpen(true);
        }
    };

    return (
        <>
            <Card shadow="none" isPressable className="hover:bg-content2" onPress={handleClick}>
                <CardBody className="text-center">
                    <span className="font-medium text-sm text-default-600">
                        {Intl.NumberFormat().format(credits?.available_credits)} credits
                    </span>
                    <Progress
                        size="sm"
                        color="success"
                        minValue={0}
                        maxValue={25000}
                        value={credits?.available_credits}
                        className="my-2"
                        aria-label="credits usage"
                    />
                    <p className="p-1 font-semibold text-secondary text-sm">Get more</p>
                </CardBody>
            </Card>
            <Paywall
                hideTitle
                isOpen={isPaywallOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsPaywallOpen(false);
                    }
                }}
                feature="more credits"
            />
        </>
    );
}

export default WorkspaceUsageCard;

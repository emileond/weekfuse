import { Card, CardBody, CardHeader, Chip } from '@heroui/react';
import {
    PiRankingDuotone,
    PiTextboxDuotone,
    PiAddressBookDuotone,
    PiTargetDuotone,
    PiGhostDuotone,
    PiMailboxDuotone,
    PiAtDuotone,
    PiTerminalWindowDuotone,
    PiLegoDuotone,
} from 'react-icons/pi';

function FeaturesGrid() {
    const ICON_SIZE = 38;
    const features = [
        {
            icon: <PiMailboxDuotone fontSize={ICON_SIZE} />,
            title: 'Delivery Verification',
            description:
                'Ensure the deliverability of an email address by connecting to the mail server.',
            color: 'text-yellow-500',
        },
        {
            icon: <PiGhostDuotone fontSize={ICON_SIZE} />,
            title: 'Disposable Email Detection',
            description:
                'Guard against fleeting addresses. Spot and filter out temporary emails to maintain list integrity.',
            color: 'text-yellow-500',
        },
        {
            icon: <PiAtDuotone fontSize={ICON_SIZE} />,
            title: 'Domain Validation',
            description:
                'Ensure that the domain hosting the email address exists and is working properly.',
            color: 'text-blue-500',
        },
        {
            icon: <PiTextboxDuotone fontSize={ICON_SIZE} />,
            title: 'Syntax Validation',
            description:
                'Perfect formatting every time. Ensure email addresses adhere to standard structures for flawless delivery.',
            color: 'text-blue-500',
        },
        {
            icon: <PiAddressBookDuotone fontSize={ICON_SIZE} />,
            title: 'Role Detection',
            description:
                'Identify role-based email addresses that do not belong to a person, but rather a group of people.',
            color: 'text-orange-500',
        },
        {
            icon: <PiRankingDuotone fontSize={ICON_SIZE} />,
            title: 'Email Quality Score',
            description: 'Every email address on your list will get a quality score from 0 to 100.',
            color: 'text-blue-500',
        },
        {
            icon: <PiTargetDuotone fontSize={ICON_SIZE} />,
            title: 'Character Pattern Detection',
            description: 'Identify email addresses with irregular character patterns.',
            color: 'text-orange-500',
        },
        {
            icon: <PiTerminalWindowDuotone fontSize={ICON_SIZE} />,
            title: 'Email Verification API',
            description:
                'Verify emails in real-time within your applications, ensuring clean communication every time.',
            color: 'text-orange-500',
        },
        {
            icon: <PiLegoDuotone fontSize={ICON_SIZE} />,
            title: 'Integrations',
            description:
                'Integrate with your email marketing platforms, clean your mailing lists automatically.',
            color: 'text-orange-500',
            isSoon: true,
        },
    ];

    return (
        <div className="max-w-6xl mx-auto py-32 px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
                Everything You Need for Flawless Email Deliverability
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <Card key={index} className="flex h-full p-3" shadow="none">
                        <CardHeader className="flex flex-col items-start gap-3">
                            <span className="text-secondary">{feature.icon}</span>
                            <div className="flex gap-3">
                                <h3 className="text-lg font-semibold">{feature.title}</h3>
                                {feature.isSoon && (
                                    <Chip size="sm" variant="flat" color="primary">
                                        Soon
                                    </Chip>
                                )}
                            </div>
                        </CardHeader>
                        <CardBody>
                            <p className="text-default-500">{feature.description}</p>
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default FeaturesGrid;

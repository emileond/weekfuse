import { useState } from 'react';
import { Button, Card, CardBody, CardFooter, CardHeader, Link, Slider } from '@heroui/react';
import { RiCheckFill } from 'react-icons/ri';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace.js';

function VolumePricingCard({ isLanding }) {
    const [currentWorkspace] = useCurrentWorkspace();
    const COST_PER_CREDIT = 0.002;

    const [price, setPrice] = useState(6);
    const [credits, setCredits] = useState(5000);

    const features = ['All features included', 'No monthly payments', 'Credits never expire'];

    const URL = `https://snapseditor.lemonsqueezy.com/buy/1150162c-1878-4ef6-bb31-6d418e6b8553?quantity=${credits}&checkout[custom][workspace_id]=${currentWorkspace?.workspace_id}`;

    const handleChange = (val) => {
        switch (val) {
            case 1:
                setPrice(0);
                setCredits(1000);
                break;
            case 2:
                setPrice(5000 * COST_PER_CREDIT);
                setCredits(5000);
                break;
            case 3:
                setPrice(10000 * COST_PER_CREDIT);
                setCredits(10000);
                break;
            case 4:
                setPrice(25000 * COST_PER_CREDIT);
                setCredits(25000);
                break;
            case 5:
                setPrice(50000 * COST_PER_CREDIT);
                setCredits(50000);
                break;
            case 6:
                setPrice(100000 * COST_PER_CREDIT);
                setCredits(100000);
                break;
            case 7:
                setPrice(250000 * COST_PER_CREDIT);
                setCredits(250000);
                break;
            case 8:
                setPrice(500000 * COST_PER_CREDIT);
                setCredits(500000);
                break;
            case 9:
                setPrice(1000000 * COST_PER_CREDIT);
                setCredits(1000000);
                break;
            default:
                setPrice(0);
                break;
        }
    };

    return (
        <div className="flex flex-col gap-9">
            <h3 className="text-xl font-semibold text-center text-default-700">
                How many emails do you need to validate?
            </h3>
            <Slider
                aria-label="credits picker"
                step={1}
                formatOptions={{ style: 'percent' }}
                maxValue={9}
                minValue={0}
                marks={[
                    {
                        value: 1,
                        label: '1,000',
                    },
                    {
                        value: 2,
                        label: '5,000',
                    },
                    {
                        value: 3,
                        label: '10,000',
                    },
                    {
                        value: 4,
                        label: '25,000',
                    },
                    {
                        value: 5,
                        label: '50,000',
                    },
                    {
                        value: 6,
                        label: '100,000',
                    },
                    {
                        value: 7,
                        label: '250,000',
                    },
                    {
                        value: 8,
                        label: '500,000',
                    },
                    {
                        value: 9,
                        label: '1,000,000',
                    },
                ]}
                defaultValue={2}
                className="w-full mb-9"
                onChange={(v) => handleChange(v)}
            />
            <div className="flex flex-wrap justify-center">
                <Card className="basis-[360px] p-3">
                    <CardHeader>
                        <div>
                            <p className="font-medium text-default-700 mb-2">
                                {Intl.NumberFormat().format(credits)} emails
                            </p>
                            <h3 className="text-4xl font-bold mb-3">
                                {Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                }).format(price)}
                            </h3>
                            <p className="text-small text-default-500">
                                {price > 0
                                    ? `Cost per credit: ${COST_PER_CREDIT}`
                                    : 'Our Free tier includes 250 emails every month'}
                            </p>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="flex flex-col gap-2 py-3">
                            {features?.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="text-xl text-success">{<RiCheckFill />}</span>
                                    <p className="font-medium text-default-600">{feature}</p>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                    <CardFooter>
                        <Button
                            as={Link}
                            className="w-full lemonsqueezy-button"
                            color="primary"
                            href={!isLanding ? URL : `${import.meta.env.VITE_PUBLIC_URL}/signup`}
                            isDisabled={!price}
                        >
                            Get credits
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default VolumePricingCard;

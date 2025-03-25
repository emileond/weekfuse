import { Button } from '@heroui/button';
import { Chip } from '@heroui/react';
import { RiArrowRightLine } from 'react-icons/ri';
import { Link } from 'react-router-dom';

export default function Hero() {
    return (
        <div className="bg-gradient-to-b from-secondary-50/50 to-primary-50/0 relative justify-center items-center py-32 ">
            <section className="max-w-screen-xl mx-auto px-4 gap-9 md:px-8 flex flex-col justify-center items-center text-center">
                <Chip variant="flat" color="secondary" endContent={<RiArrowRightLine />}>
                    Get 1,000 credits for free
                </Chip>
                <h1 className="text-4xl font-bold tracking-tighter mx-auto md:text-6xl text-pretty">
                    Reach Every Inbox
                </h1>
                <p className="max-w-2xl text-lg mx-auto text-default-600 text-balance">
                    Ensure your emails connect with real people. Our powerful verification tool
                    boosts deliverability and protects your sender reputation.
                </p>
                <Button as={Link} to="/signup" color="primary" variant="shadow">
                    Verify my list
                </Button>
            </section>
        </div>
    );
}

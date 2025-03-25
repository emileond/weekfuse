import { Divider, Link, Image } from '@heroui/react';

const Footer = () => {
    return (
        <footer className="bg-content2/50 w-full">
            <Divider />
            <div className="container mx-auto flex flex-col md:flex-row justify-around flex-wrap gap-8 text-center md:text-left py-16">
                {/* Logo Column */}
                <div className="flex justify-center md:block">
                    <Image src="logo.svg" width={140} />
                </div>
                <div>
                    <h5 className="font-semibold text-lg mb-4">Product</h5>
                    <ul className="space-y-2">
                        <li>
                            <Link
                                href={`${import.meta.env.VITE_PUBLIC_URL}/blog`}
                                className="text-default-600 font-medium"
                            >
                                Blog
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={`${import.meta.env.VITE_PUBLIC_URL}#features`}
                                className="text-default-600 font-medium"
                            >
                                Features
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={`${import.meta.env.VITE_PUBLIC_URL}#pricing`}
                                className="text-default-600 font-medium"
                            >
                                Pricing
                            </Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-semibold text-lg mb-4">Feedback</h5>
                    <ul className="space-y-2">
                        <li>
                            <Link
                                href={`${import.meta.env.VITE_PUBLIC_URL}/feature-requests`}
                                className="text-default-600 font-medium"
                            >
                                Suggest a feature
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={`${import.meta.env.VITE_PUBLIC_URL}/roadmap`}
                                className="text-default-600 font-medium"
                            >
                                Roadmap
                            </Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-semibold text-lg mb-4">Legal</h5>
                    <ul className="space-y-2">
                        <li>
                            <Link
                                href={`${import.meta.env.VITE_PUBLIC_URL}/privacy-policy`}
                                className="text-default-600 font-medium"
                            >
                                Privacy Policy
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={`${import.meta.env.VITE_PUBLIC_URL}/tos`}
                                className="text-default-600 font-medium"
                            >
                                Terms of Service
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={`${import.meta.env.VITE_PUBLIC_URL}/acceptable-use-policy`}
                                className="text-default-600 font-medium"
                            >
                                Acceptable Use Policy
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="w-full py-4 text-sm font-medium text-center text-default-600">
                {new Date().getFullYear()} &copy; Mailerfuse
            </div>
        </footer>
    );
};

export default Footer;

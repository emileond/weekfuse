import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { RiVipCrownFill } from 'react-icons/ri';
import PricingPlans from './PricingPlans';
import VolumePricingCard from './VolumePricingCard';
import { Link } from 'react-router-dom';

function Paywall({ isOpen, onOpenChange, feature, volumePricing = true, hideTitle }) {
    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="4xl"
            scrollBehavior="inside"
            className="p-3"
        >
            <ModalContent>
                <ModalHeader>
                    {!hideTitle && (
                        <div className="w-full text-center">
                            <span className="text-sm inline-flex gap-1 items-center text-default-600 mb-3">
                                <RiVipCrownFill className="text-md text-warning-500" /> Upgrade to
                                use this feature
                            </span>
                            <h2 className="text-2xl font-bold">
                                Get the most out of {import.meta.env.VITE_APP_NAME} with {feature}
                            </h2>
                        </div>
                    )}
                </ModalHeader>
                <ModalBody>{volumePricing ? <VolumePricingCard /> : <PricingPlans />}</ModalBody>
                <ModalFooter>
                    {!volumePricing && (
                        <div className="w-full text-center">
                            <Link to="#" className="font-medium text-blue-500">
                                Compare plans
                            </Link>
                        </div>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default Paywall;

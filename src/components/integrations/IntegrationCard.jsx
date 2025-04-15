import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Image,
    Divider,
    Spinner,
    Skeleton,
} from '@heroui/react';
import { RiShutDownLine, RiEqualizer3Fill, RiLoginCircleLine } from 'react-icons/ri';

function IntegrationCard({
    id,
    icon,
    name,
    description,
    status,
    isLoading,
    isPending,
    onConnect,
    onDisconnect,
    hasConfigOptions,
    onConfigure,
}) {
    const BTN_ICON_SIZE = '1rem';

    // Modal for connect action
    const {
        isOpen: isConnectModalOpen,
        onOpen: onConnectModalOpen,
        onClose: onConnectModalClose,
    } = useDisclosure();

    // Modal for disconnect confirmation
    const {
        isOpen: isDisconnectModalOpen,
        onOpen: onDisconnectModalOpen,
        onClose: onDisconnectModalClose,
    } = useDisclosure();

    // Drawer for configuration
    const {
        isOpen: isConfigDrawerOpen,
        onOpen: onConfigDrawerOpen,
        onClose: onConfigDrawerClose,
    } = useDisclosure();

    // Handle connect action
    const handleConnect = () => {
        if (onConnect) {
            onConnect();
        } else {
            onConnectModalOpen();
        }
    };

    // Handle disconnect action
    const handleDisconnect = () => {
        onDisconnectModalOpen();
    };

    // Handle configure action
    const handleConfigure = () => {
        if (onConfigure) {
            onConfigure();
        } else {
            onConfigDrawerOpen();
        }
    };

    // Determine status chip color
    const getStatusChipColor = () => {
        switch (status) {
            case 'active':
                return 'success';
            case 'error':
                return 'danger';
            case 'soon':
                return 'primary';
            default:
                return 'default';
        }
    };

    return (
        <>
            <Card shadow="sm" className="w-full p-1">
                <CardHeader className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="text-2xl">
                            {id === 'github' ? (
                                icon
                            ) : (
                                <Image alt="logo" src={`/integrations/${id}.png`} width={32} />
                            )}
                        </div>
                        <h3 className="text-lg font-semibold">{name}</h3>
                    </div>
                    {isLoading ? (
                        <Spinner size="sm" color="default" variant="wave" aria-label="loading" />
                    ) : (
                        <>
                            {status !== 'inactive' && (
                                <Skeleton isLoaded={!isPending}>
                                    <Chip variant="flat" color={getStatusChipColor()} size="sm">
                                        {status?.toLocaleString()}
                                    </Chip>
                                </Skeleton>
                            )}
                        </>
                    )}
                </CardHeader>
                <CardBody className="py-3">
                    <Skeleton isLoaded={!isPending}>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 ">
                            {description}
                        </p>
                    </Skeleton>
                </CardBody>
                {status !== 'soon' && (
                    <>
                        <Divider />
                        <CardFooter className="flex justify-end gap-2 pt-4">
                            {status === 'active' ? (
                                <>
                                    {hasConfigOptions && (
                                        <Button
                                            size="sm"
                                            variant="bordered"
                                            onPress={handleConfigure}
                                            startContent={
                                                <RiEqualizer3Fill fontSize={BTN_ICON_SIZE} />
                                            }
                                        >
                                            Configure
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        color="danger"
                                        onPress={handleDisconnect}
                                        startContent={<RiShutDownLine fontSize={BTN_ICON_SIZE} />}
                                        isDisabled={isLoading}
                                    >
                                        Disconnect
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="bordered"
                                    size="sm"
                                    onPress={handleConnect}
                                    startContent={<RiLoginCircleLine fontSize={BTN_ICON_SIZE} />}
                                    isLoading={isLoading}
                                >
                                    Connect
                                </Button>
                            )}
                        </CardFooter>
                    </>
                )}
            </Card>

            {/* Connect Modal */}
            <Modal isOpen={isConnectModalOpen} onClose={onConnectModalClose}>
                <ModalContent>
                    <ModalHeader>Connect {name}</ModalHeader>
                    <ModalBody>
                        <p>Configure your connection to {name}.</p>
                        {/* Connection form would go here */}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onConnectModalClose}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={onConnectModalClose}>
                            Connect
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Disconnect Confirmation Dialog */}
            <Modal isOpen={isDisconnectModalOpen} onClose={onDisconnectModalClose}>
                <ModalContent>
                    <ModalHeader>Disconnect integration</ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to disconnect from {name}?</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onDisconnectModalClose}>
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            onPress={() => {
                                if (onDisconnect) {
                                    onDisconnect();
                                }
                                onDisconnectModalClose();
                            }}
                        >
                            Disconnect
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Configuration Drawer */}
            <Drawer isOpen={isConfigDrawerOpen} onClose={onConfigDrawerClose} placement="right">
                <DrawerContent>
                    <DrawerHeader>{name} Configuration</DrawerHeader>
                    <DrawerBody>
                        <p>Configure your {name} integration settings.</p>
                        {/* Configuration form would go here */}
                    </DrawerBody>
                    <DrawerFooter>
                        <Button variant="flat" onPress={onConfigDrawerClose} isDisabled={isLoading}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={onConfigDrawerClose} isLoading={isLoading}>
                            Save
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
}

export default IntegrationCard;

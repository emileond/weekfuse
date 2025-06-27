import {
    Chip,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Divider,
    Alert,
    Tooltip,
} from '@heroui/react';
import {
    RiFileExcel2Line,
    RiFileGifLine,
    RiFileImageLine,
    RiFileLine,
    RiFileMusicFill,
    RiFilePdf2Line,
    RiFilePpt2Fill,
    RiFileTextLine,
    RiFileVideoLine,
    RiFileWord2Line,
    RiFileZipLine,
    RiCloseCircleFill,
} from 'react-icons/ri';

const AttachmentChip = ({ name, url, type, size, onDelete }) => {
    const { isOpen, onOpenChange } = useDisclosure();

    const ICON_SIZE = '1.2rem';

    const getFileIcon = () => {
        switch (true) {
            case type?.includes('pdf'):
                return <RiFilePdf2Line fontSize={ICON_SIZE} className="text-danger" />;
            case type?.includes('excel') || type?.includes('spreadsheet') || type?.includes('csv'):
                return <RiFileExcel2Line fontSize={ICON_SIZE} className="text-success" />;
            case type?.includes('word') || type?.includes('document'):
                return <RiFileWord2Line fontSize={ICON_SIZE} className="text-blue" />;
            case type?.includes('powerpoint') || type?.includes('presentation'):
                return <RiFilePpt2Fill fontSize={ICON_SIZE} className="text-orange" />;
            case type?.includes('image') ||
                type?.includes('png') ||
                type?.includes('jpg') ||
                type?.includes('jpeg'):
                return <RiFileImageLine fontSize={ICON_SIZE} className="text-indigo" />;
            case type?.includes('video'):
                return <RiFileVideoLine fontSize={ICON_SIZE} className="text-danger" />;
            case type?.includes('audio') || type?.includes('music'):
                return <RiFileMusicFill fontSize={ICON_SIZE} className="text-info" />;
            case type?.includes('zip') || type?.includes('archive') || type?.includes('compressed'):
                return <RiFileZipLine fontSize={ICON_SIZE} className="text-default" />;
            case type?.includes('gif'):
                return <RiFileGifLine fontSize={ICON_SIZE} className="text-violet" />;
            case type?.includes('text'):
                return <RiFileTextLine fontSize={ICON_SIZE} className="text-default" />;
            default:
                return <RiFileLine fontSize={ICON_SIZE} className="text-default" />;
        }
    };

    const handleOpenFile = () => {
        if (url) {
            window.open(url, '_blank');
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete();
        }
        onOpenChange(false);
    };

    return (
        <>
            <Chip
                variant="bordered"
                onClose={() => onOpenChange(true)}
                startContent={getFileIcon()}
                endContent={
                    <Tooltip content="Delete file" delay={1200}>
                        <RiCloseCircleFill className="text-default-500 hover:text-danger" />
                    </Tooltip>
                }
                onClick={handleOpenFile}
                className="cursor-pointer hover:bg-content2/50 hover:border-primary-200"
            >
                <span className="max-w-[150px] truncate mr-1">{name}</span>
            </Chip>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">Delete Attachment?</ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4 py-3">
                            <p>
                                Are you sure you want to delete{' '}
                                <span className="font-semibold">{name}</span>?{' '}
                                <span>This action cannot be undone.</span>
                            </p>
                            <Alert
                                color="danger"
                                description="The file will be permanently deleted."
                            />
                        </div>
                    </ModalBody>
                    <Divider />
                    <ModalFooter>
                        <Button variant="light" onPress={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button color="danger" onPress={handleDelete}>
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default AttachmentChip;

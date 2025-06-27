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
    RiFileMusicLine,
    RiFilePdf2Line,
    RiFilePpt2Fill,
    RiFileTextLine,
    RiFileVideoLine,
    RiFileWord2Line,
    RiFileZipLine,
    RiCloseCircleFill,
} from 'react-icons/ri';
import { useState } from 'react';
import ky from 'ky';
import toast from 'react-hot-toast';

const AttachmentChip = ({ id, name, url, type, size, onDelete, task_id }) => {
    const { isOpen, onOpenChange } = useDisclosure();
    const [isLoading, setIsLoading] = useState(false);

    const ICON_SIZE = '1.2rem';

    // Extract filename from URL
    const getFilenameFromUrl = (url) => {
        if (!url) return '';
        return url?.split('/').pop();
    };

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
                return <RiFileMusicLine fontSize={ICON_SIZE} className="text-primary" />;
            case type?.includes('zip') || type?.includes('archive') || type?.includes('compressed'):
                return <RiFileZipLine fontSize={ICON_SIZE} className="text-default" />;
            case type?.includes('gif'):
                return <RiFileGifLine fontSize={ICON_SIZE} className="text-violet" />;
            case type?.includes('text'):
                return <RiFileTextLine fontSize={ICON_SIZE} className="text-primary" />;
            default:
                return <RiFileLine fontSize={ICON_SIZE} className="text-primary" />;
        }
    };

    const handleOpenFile = async () => {
        try {
            setIsLoading(true);

            // Create a blob URL from the response and open it
            const response = await ky
                .get(`/api/task/attachments?filename=${name}`, {
                    timeout: 30000, // 30 seconds timeout
                })
                .blob();

            const blobUrl = URL.createObjectURL(response);
            window.open(blobUrl, '_blank');

            // Clean up the blob URL after opening
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (error) {
            console.error('Error downloading file:', error);
            toast({
                title: 'Error',
                description: 'Failed to download the file',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsLoading(true);
            const filename = getFilenameFromUrl(url);

            if (!filename || !id) {
                toast({
                    title: 'Error',
                    description: 'Missing required information to delete the file',
                    status: 'error',
                    duration: 3000,
                });
                return;
            }

            await ky.delete(`/api/task/attachments?filename=${filename}&id=${id}`, {
                timeout: 30000, // 30 seconds timeout
            });

            toast({
                title: 'Success',
                description: 'File deleted successfully',
                status: 'success',
                duration: 3000,
            });

            if (onDelete) {
                onDelete();
            }

            onOpenChange(false);
        } catch (error) {
            console.error('Error deleting file:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete the file',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
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
                isDisabled={isLoading}
            >
                <span className="max-w-[150px] truncate mr-1">
                    {isLoading ? 'Processing...' : name}
                </span>
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
                        <Button
                            variant="light"
                            onPress={() => onOpenChange(false)}
                            isDisabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button color="danger" onPress={handleDelete} isLoading={isLoading}>
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default AttachmentChip;

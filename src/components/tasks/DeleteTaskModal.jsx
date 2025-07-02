import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

const DeleteTaskModal = ({ isOpen, onClose, onDelete, taskName, isDeleting }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader>Delete Task</ModalHeader>
                <ModalBody>
                    <p>
                        Are you sure you want to delete &#34;{taskName}&#34;? This action
                        cannot be undone.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose} isDisabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button color="danger" onPress={onDelete} isLoading={isDeleting}>
                        Delete
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DeleteTaskModal;
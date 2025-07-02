import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    useDisclosure,
} from '@heroui/react';
import { RiDeleteBin7Line, RiMoreLine } from 'react-icons/ri';

const TaskOptionsDropdown = ({ onAction, sm = false }) => {
    const { isOpen, onOpenChange } = useDisclosure();

    const handleAction = (key) => {
        if (onAction) {
            onAction(key);
        }
    };

    return (
        <Dropdown isOpen={isOpen} onOpenChange={onOpenChange}>
            <DropdownTrigger>
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenChange();
                    }}
                    className={`${sm ? 'p-1' : 'p-2'} hover:bg-default-200 rounded-lg cursor-pointer transition-bg duration-300 ease-in-out`}
                >
                    <RiMoreLine size="1.2rem" />
                </div>
            </DropdownTrigger>
            <DropdownMenu onAction={(key) => handleAction(key)}>
                {/*<DropdownItem key="move">Move...</DropdownItem>*/}
                <DropdownItem
                    key="delete"
                    className="text-danger"
                    variant="flat"
                    color="danger"
                    startContent={<RiDeleteBin7Line fontSize="1rem" />}
                >
                    Delete
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
};

export default TaskOptionsDropdown;

import { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    ModalContent,
    Button,
    Input,
    useDisclosure,
    Spinner,
} from '@heroui/react';
import { RiCommandLine, RiAddLine, RiSearchLine } from 'react-icons/ri';
import { useFuzzySearchTasks } from '../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace.js';
import NewTaskModal from './tasks/NewTaskModal.jsx';
import debounce from '../utils/debounceUtils.js';

const CommandPalette = () => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isNewTaskModalOpen, onOpenChange: onNewTaskModalOpenChange } = useDisclosure();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    
    // Create a debounced function to update search term
    const debouncedSetSearchTerm = useCallback(
        debounce((value) => {
            setDebouncedSearchTerm(value);
        }, 300),
        []
    );
    
    // Update debounced search term when search term changes
    useEffect(() => {
        debouncedSetSearchTerm(searchTerm);
    }, [searchTerm, debouncedSetSearchTerm]);
    
    // Use the hook for fuzzy search with debounced search term
    const { data: searchData, isLoading: isSearching } = useFuzzySearchTasks(
        currentWorkspace,
        debouncedSearchTerm,
        10, // Limit results to 10
        'pending'
    );
    
    // Handle keyboard shortcut to open command palette
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Open command palette on Cmd+K or Ctrl+K
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                onOpen();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onOpen]);
    
    // Handle command selection
    const handleCommandSelect = (command) => {
        if (command === 'new-task') {
            onOpenChange(false); // Close command palette
            onNewTaskModalOpenChange(true); // Open new task modal
        }
    };
    
    // Handle task selection
    const handleTaskSelect = (task) => {
        // Here you would typically open the task detail modal
        console.log('Selected task:', task);
        onOpenChange(false); // Close command palette
    };
    
    return (
        <>
            {/* Command Palette Button */}
            <Button
                size="sm"
                variant="light"
                startContent={<RiCommandLine />}
                onPress={onOpen}
                className="ml-2"
            >
                Command Palette
            </Button>
            
            {/* Command Palette Modal */}
            <Modal 
                isOpen={isOpen} 
                onOpenChange={onOpenChange}
                size="lg"
                placement="top"
                classNames={{
                    base: "mt-16",
                    backdrop: "bg-black/50 backdrop-blur-sm"
                }}
            >
                <ModalContent>
                    <div className="p-2">
                        {/* Search Input */}
                        <Input
                            autoFocus
                            size="lg"
                            placeholder="Search tasks or type a command..."
                            startContent={<RiSearchLine />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mb-2"
                        />
                        
                        {/* Commands Section */}
                        <div className="mb-4">
                            <div className="text-xs text-default-500 mb-1 px-2">Commands</div>
                            <div 
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-default-100 cursor-pointer"
                                onClick={() => handleCommandSelect('new-task')}
                            >
                                <RiAddLine className="text-primary" />
                                <span>New Task</span>
                            </div>
                        </div>
                        
                        {/* Search Results Section */}
                        {debouncedSearchTerm && (
                            <div>
                                <div className="text-xs text-default-500 mb-1 px-2">Tasks</div>
                                {isSearching ? (
                                    <div className="flex justify-center p-4">
                                        <Spinner size="sm" />
                                    </div>
                                ) : searchData?.data?.length > 0 ? (
                                    <div className="max-h-60 overflow-y-auto">
                                        {searchData.data.map((task) => (
                                            <div
                                                key={task.id}
                                                className="p-2 rounded-lg hover:bg-default-100 cursor-pointer"
                                                onClick={() => handleTaskSelect(task)}
                                            >
                                                <div className="font-medium">{task.name}</div>
                                                {task.description && (
                                                    <div className="text-xs text-default-500 truncate">
                                                        {task.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-4 text-default-500">
                                        No tasks found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </ModalContent>
            </Modal>
            
            {/* New Task Modal */}
            <NewTaskModal 
                isOpen={isNewTaskModalOpen} 
                onOpenChange={onNewTaskModalOpenChange} 
                defaultDate={null}
            />
        </>
    );
};

export default CommandPalette;
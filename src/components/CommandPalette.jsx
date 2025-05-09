import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Modal,
    ModalContent,
    Button,
    Input,
    useDisclosure,
    Spinner,
    ModalBody,
} from '@heroui/react';
import {
    RiCommandLine,
    RiAddLine,
    RiSearchLine,
    RiQuestionLine,
    RiPaletteLine,
    RiLightbulbLine,
    RiRobot2Line,
} from 'react-icons/ri';
import { useFuzzySearchTasks } from '../hooks/react-query/tasks/useTasks.js';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace.js';
import NewTaskModal from './tasks/NewTaskModal.jsx';
import debounce from '../utils/debounceUtils.js';
import { useHotkeys } from 'react-hotkeys-hook';
import UFuzzy from '@leeoniya/ufuzzy';

const CommandPalette = () => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isNewTaskModalOpen, onOpenChange: onNewTaskModalOpenChange } = useDisclosure();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [activeSection, setActiveSection] = useState('commands'); // 'commands' or 'tasks'
    const searchInputRef = useRef(null);

    // Define the list of commands
    const commands = [
        { id: 'ask-ai', name: 'Ask AI', icon: <RiRobot2Line className="text-primary" /> },
        { id: 'new-task', name: 'New task', icon: <RiAddLine className="text-primary" /> },
        {
            id: 'change-theme',
            name: 'Change theme',
            icon: <RiPaletteLine className="text-primary" />,
        },
        {
            id: 'suggest-feature',
            name: 'Suggest a feature',
            icon: <RiLightbulbLine className="text-primary" />,
        },
        { id: 'help', name: 'Help', icon: <RiQuestionLine className="text-primary" /> },
    ];

    // Setup UFuzzy for command filtering
    const uf = useMemo(
        () =>
            new UFuzzy({
                intraMode: 1,
                intraIns: 1,
                intraSub: 1,
                intraTrn: 1,
                intraDel: 1,
            }),
        [],
    );

    // Filter commands based on search term
    const filteredCommands = useMemo(() => {
        if (!searchTerm) return commands;

        const commandNames = commands.map((cmd) => cmd.name);
        const results = uf.search(commandNames, searchTerm);

        if (!results) return commands;

        return results?.ids?.map((id) => commands[id]);
    }, [commands, searchTerm, uf]);

    // Create a debounced function to update search term
    const debouncedSetSearchTerm = useCallback(
        debounce((value) => {
            setDebouncedSearchTerm(value);
        }, 300),
        [],
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
        'pending',
    );

    // Handle keyboard shortcut to toggle the command palette
    useHotkeys('meta+k', () => {
        onOpenChange();
    });

    // Reset selected index when command palette opens or search term changes
    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
            setActiveSection('commands');

            // Focus the search input when the command palette opens
            setTimeout(() => {
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }, 0);
        }
    }, [isOpen, searchTerm]);

    // Handle keyboard navigation
    useHotkeys(
        'down',
        (e) => {
            if (!isOpen) return;
            e.preventDefault();

            const commandItems = filteredCommands || [];
            const taskItems = searchData?.data || [];

            if (activeSection === 'commands') {
                if (selectedIndex < commandItems.length - 1) {
                    // Move to next command
                    setSelectedIndex(selectedIndex + 1);
                } else if (taskItems.length > 0 && debouncedSearchTerm) {
                    // Move from commands to tasks section
                    setActiveSection('tasks');
                    setSelectedIndex(0);
                }
            } else if (activeSection === 'tasks') {
                if (selectedIndex < taskItems.length - 1) {
                    // Move to next task
                    setSelectedIndex(selectedIndex + 1);
                }
            }
        },
        { enableOnFormElements: true },
        [isOpen, activeSection, selectedIndex, filteredCommands, searchData, debouncedSearchTerm],
    );

    useHotkeys(
        'up',
        (e) => {
            if (!isOpen) return;
            e.preventDefault();

            const commandItems = filteredCommands || [];
            const taskItems = searchData?.data || [];

            if (activeSection === 'commands') {
                if (selectedIndex > 0) {
                    // Move to previous command
                    setSelectedIndex(selectedIndex - 1);
                }
            } else if (activeSection === 'tasks') {
                if (selectedIndex > 0) {
                    // Move to previous task
                    setSelectedIndex(selectedIndex - 1);
                } else if (commandItems.length > 0) {
                    // Move from tasks to commands section
                    setActiveSection('commands');
                    setSelectedIndex(commandItems.length - 1);
                }
            }
        },
        { enableOnFormElements: true },
        [isOpen, activeSection, selectedIndex, filteredCommands, searchData],
    );

    useHotkeys(
        'enter',
        (e) => {
            if (!isOpen) return;
            e.preventDefault();

            if (activeSection === 'commands' && filteredCommands.length > 0) {
                handleCommandSelect(filteredCommands[selectedIndex].id);
            } else if (activeSection === 'tasks' && searchData?.data?.length > 0) {
                handleTaskSelect(searchData.data[selectedIndex]);
            }
        },
        { enableOnFormElements: true },
        [isOpen, activeSection, selectedIndex, filteredCommands, searchData],
    );

    // Handle command selection
    const handleCommandSelect = (commandId) => {
        onOpenChange(); // Close command palette

        switch (commandId) {
            case 'ask-ai':
                console.log('Ask AI command selected');
                // Implement Ask AI functionality
                break;
            case 'new-task':
                onNewTaskModalOpenChange(true); // Open new task modal
                break;
            case 'change-theme':
                console.log('Change theme command selected');
                // Implement theme change functionality
                break;
            case 'suggest-feature':
                console.log('Suggest a feature command selected');
                // Implement feature suggestion functionality
                break;
            case 'help':
                console.log('Help command selected');
                // Implement help functionality
                break;
            default:
                console.log('Unknown command:', commandId);
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
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" placement="top">
                <ModalContent>
                    <ModalBody>
                        <div className="p-2">
                            {/* Search Input */}
                            <Input
                                ref={searchInputRef}
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
                                {filteredCommands?.length > 0 ? (
                                    filteredCommands?.map((command, index) => (
                                        <div
                                            key={command.id}
                                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                                                activeSection === 'commands' &&
                                                selectedIndex === index
                                                    ? 'bg-primary-100'
                                                    : 'hover:bg-default-100'
                                            }`}
                                            onClick={() => handleCommandSelect(command.id)}
                                            onMouseEnter={() => {
                                                setActiveSection('commands');
                                                setSelectedIndex(index);
                                            }}
                                        >
                                            {command.icon}
                                            <span>{command.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-4 text-default-500">
                                        No commands found
                                    </div>
                                )}
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
                                            {searchData.data.map((task, index) => (
                                                <div
                                                    key={task.id}
                                                    className={`p-2 rounded-lg cursor-pointer ${
                                                        activeSection === 'tasks' &&
                                                        selectedIndex === index
                                                            ? 'bg-primary-100'
                                                            : 'hover:bg-default-100'
                                                    }`}
                                                    onClick={() => handleTaskSelect(task)}
                                                    onMouseEnter={() => {
                                                        setActiveSection('tasks');
                                                        setSelectedIndex(index);
                                                    }}
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
                    </ModalBody>
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

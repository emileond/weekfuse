import { useState, useCallback } from 'react';
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    Button,
    ButtonGroup,
    Tooltip,
} from '@heroui/react';
import { RiFlowerLine } from 'react-icons/ri';
import { BreathExerciseModal } from './BreathExerciseModal';

export function BreathExerciseWidget() {
    // State to control the visibility of the popover
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    // State to store the selected exercise length ('short', 'medium', 'long')
    const [selectedLength, setSelectedLength] = useState('short'); // Default to 'short'
    // State to control the visibility of the fullscreen modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Callback to handle starting the exercise
    const handleStartExercise = useCallback(() => {
        setIsPopoverOpen(false); // Close the popover
        setIsModalOpen(true); // Open the fullscreen modal
    }, []);

    // Callback to handle closing the fullscreen modal
    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    return (
        <>
            {/* Popover for selecting exercise length */}
            <Popover isOpen={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <Tooltip content="Need a break?">
                    <div>
                        <PopoverTrigger>
                            <Button
                                variant="flat"
                                isIconOnly
                                startContent={<RiFlowerLine className="text-xl" />} // Leaf icon for breath exercise
                                aria-label="Start Breath Exercise"
                            />
                        </PopoverTrigger>
                    </div>
                </Tooltip>

                <PopoverContent className="w-64 p-3">
                    <div className="flex flex-col gap-2">
                        <h4 className="text-default-600 font-medium text-center">Take a break</h4>
                        <p className="text-sm text-default-500 text-center text-pretty mb-3">
                            Relax and take a deep breath.
                            <br />
                            When you&#39;re ready, choose a duration and click start.
                        </p>
                        {/* Buttons to select exercise length */}
                        <ButtonGroup>
                            <Button
                                size="sm"
                                variant={selectedLength === 'short' ? 'solid' : 'bordered'}
                                onPress={() => setSelectedLength('short')}
                            >
                                30s
                            </Button>
                            <Button
                                size="sm"
                                variant={selectedLength === 'medium' ? 'solid' : 'bordered'}
                                onPress={() => setSelectedLength('medium')}
                            >
                                1 min
                            </Button>
                            <Button
                                size="sm"
                                variant={selectedLength === 'long' ? 'solid' : 'bordered'}
                                onPress={() => setSelectedLength('long')}
                            >
                                3 min
                            </Button>
                        </ButtonGroup>
                        {/* Button to start the exercise */}
                        <Button
                            variant="shadow"
                            color="primary"
                            onPress={handleStartExercise}
                            className="mt-4"
                        >
                            Start
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Render the fullscreen modal when isModalOpen is true */}
            {isModalOpen && (
                <BreathExerciseModal
                    length={selectedLength} // Pass the selected length to the modal
                    onClose={handleCloseModal} // Pass the close handler to the modal
                />
            )}
        </>
    );
}

import { useState, useCallback } from 'react';
import { Popover, PopoverTrigger, PopoverContent, Button } from '@heroui/react';
import { RiLeafLine } from 'react-icons/ri'; // Using a leaf icon for relaxation
import { BreathExerciseModal } from './BreathExerciseModal'; // Import the modal component

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
            <Popover isOpen={isPopoverOpen} onOpenChange={setIsPopoverOpen} placement="bottom-end">
                <PopoverTrigger>
                    {/* Button to open the popover, similar to PomodoroWidget */}
                    <Button
                        variant="flat"
                        isIconOnly
                        startContent={<RiLeafLine className="text-xl" />} // Leaf icon for breath exercise
                        aria-label="Start Breath Exercise"
                    />
                </PopoverTrigger>

                <PopoverContent className="w-64 p-3">
                    <div className="flex flex-col gap-2">
                        <h5 className="text-lg font-semibold text-center mb-2">Select Length</h5>
                        {/* Buttons to select exercise length */}
                        <Button
                            variant={selectedLength === 'short' ? 'solid' : 'light'}
                            color="primary"
                            onPress={() => setSelectedLength('short')}
                        >
                            Short (30s)
                        </Button>
                        <Button
                            variant={selectedLength === 'medium' ? 'solid' : 'light'}
                            color="primary"
                            onPress={() => setSelectedLength('medium')}
                        >
                            Medium (1 min)
                        </Button>
                        <Button
                            variant={selectedLength === 'long' ? 'solid' : 'light'}
                            color="primary"
                            onPress={() => setSelectedLength('long')}
                        >
                            Long (3 min)
                        </Button>
                        {/* Button to start the exercise */}
                        <Button
                            variant="shadow"
                            color="success" // Green color for a calming effect
                            onPress={handleStartExercise}
                            className="mt-4"
                        >
                            Start Exercise
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

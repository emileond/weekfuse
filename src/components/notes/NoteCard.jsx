import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    Input,
    Tooltip,
} from '@heroui/react';
import BlockEditor from '../editor/BlockEditor.jsx';
import { useState, useRef, useEffect } from 'react';
import { RiEdit2Line } from 'react-icons/ri';

const NoteCard = ({ note }) => {
    const [isEditable, setIsEditable] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);

    const contentRef = useRef(null);

    // Handle card click to expand/collapse
    const handleCardClick = () => {
        if (hasOverflow && !isEditable) {
            setIsExpanded(!isExpanded);
        }
    };

    const handleEdit = () => {
        setIsEditable(true);
        setIsExpanded(true);
    };

    // Check if content overflows
    useEffect(() => {
        const checkOverflow = () => {
            if (contentRef.current) {
                const hasContentOverflow =
                    contentRef.current.scrollHeight > contentRef.current.clientHeight;
                setHasOverflow(hasContentOverflow);
            }
        };

        // Initial check
        checkOverflow();

        // Add resize listener to recheck on window resize
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [note.content]);

    return (
        <Card
            shadow={isEditable ? 'md' : 'none'}
            className={`border-1 border-default-200 transition-height duration-300 ease-in-out`}
        >
            <CardHeader className="pb-0">
                <Input
                    size="lg"
                    placeholder="Untitled note"
                    variant="bordered"
                    value={note.title}
                    classNames={{
                        inputWrapper: 'shadow-none border-0',
                        input: 'text-xl font-semibold',
                    }}
                    isReadOnly={!isEditable}
                    // onChange={handleTitleChange}
                />
                {!isEditable && (
                    <Tooltip content="Edit note">
                        <Button variant="flat" size="sm" isIconOnly onPress={handleEdit}>
                            <RiEdit2Line fontSize="1.2rem" />
                        </Button>
                    </Tooltip>
                )}
            </CardHeader>
            <CardBody
                className={`p-6 pt-0 overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[2000px]' : 'max-h-80 '
                }`}
                ref={contentRef}
            >
                {hasOverflow && !isEditable && (
                    <div
                        className="flex items-center justify-center absolute bottom-0 left-0 z-10 w-full text-sm text-center text-default-500 bg-content1 hover:bg-content2 h-8 cursor-pointer transition-opacity duration-300 ease-in-out"
                        onClick={handleCardClick}
                    >
                        {isExpanded ? 'See less' : 'See more'}
                    </div>
                )}
                <div key={isEditable ? 'edit' : 'read'}>
                    <BlockEditor
                        isEditable={isEditable}
                        defaultContent={note.content}
                        // onChange={handleContentChange}
                        placeholder="Start writing your notes here..."
                    />
                </div>
            </CardBody>
            <Divider />
            <CardFooter className="flex text-justify">
                {isEditable && (
                    <div>
                        <Button size="sm" onPress={() => setIsEditable(false)}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            color="primary"
                            // onPress={handleSave} isLoading={isSaving}
                        >
                            Save
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};

export default NoteCard;

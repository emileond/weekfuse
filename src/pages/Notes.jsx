import { useState } from 'react';
import { Card, CardBody, CardHeader, CardFooter, Button, Input, Divider } from '@heroui/react';
import BlockEditor from '../components/editor/BlockEditor';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import toast from 'react-hot-toast';
import PageLayout from '../components/layout/PageLayout.jsx';
import AppLayout from '../components/layout/AppLayout.jsx';
import { useNotes, useCreateNote } from '../hooks/react-query/notes/useNotes';

const Notes = () => {
    const [currentWorkspace] = useCurrentWorkspace();
    const [noteData, setNoteData] = useState({ title: 'Untitled Note', content: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Fetch notes for the current workspace
    const { data: notes } = useNotes(currentWorkspace);

    // Create note mutation
    const createNoteMutation = useCreateNote(currentWorkspace);

    const handleTitleChange = (e) => {
        setNoteData((prev) => ({ ...prev, title: e.target.value }));
    };

    const handleContentChange = (newContent) => {
        setNoteData((prev) => ({ ...prev, content: newContent }));
    };

    const handleSave = () => {
        setIsSaving(true);

        // Create a new note in the database
        createNoteMutation.mutate(
            {
                note: {
                    title: noteData.title,
                    content: noteData.content,
                    workspace_id: currentWorkspace.workspace_id
                }
            },
            {
                onSuccess: () => {
                    toast.success('Note saved successfully!');
                    setIsSaving(false);
                },
                onError: (error) => {
                    toast.error('Failed to save note: ' + error.message);
                    setIsSaving(false);
                }
            }
        );
    };

    return (
        <AppLayout>
            <PageLayout title="Notes" maxW={'3xl'}>
                <Card>
                    <CardHeader className="pb-0">
                        <Input
                            size="lg"
                            placeholder="Untitled note"
                            variant="bordered"
                            value={noteData.title}
                            classNames={{
                                inputWrapper: 'shadow-none border-0',
                                input: 'text-xl font-semibold',
                            }}
                            onChange={handleTitleChange}
                        />
                    </CardHeader>
                    <CardBody className="p-6 pt-0 ">
                        <BlockEditor
                            defaultContent={noteData.content}
                            onChange={handleContentChange}
                            placeholder="Start writing your notes here..."
                        />
                    </CardBody>
                    <Divider />
                    <CardFooter className="flex text-justify">
                        <Button size="sm" color="primary" onPress={handleSave} isLoading={isSaving}>
                            Save
                        </Button>
                    </CardFooter>
                </Card>
            </PageLayout>
        </AppLayout>
    );
};

export default Notes;

import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import PageLayout from '../components/layout/PageLayout.jsx';
import AppLayout from '../components/layout/AppLayout.jsx';
import { useNotes } from '../hooks/react-query/notes/useNotes';
import NoteCard from '../components/notes/NoteCard.jsx';
import NewNoteCard from '../components/notes/NewNoteCard.jsx';
import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

const Notes = () => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: notes } = useNotes(currentWorkspace);
    const [isOpen, setIsOpen] = useState(false);
    const [parent] = useAutoAnimate();

    return (
        <AppLayout>
            <PageLayout
                title="Notes"
                maxW="2xl"
                onClick={() => setIsOpen(true)}
                primaryAction="New note"
            >
                <div ref={parent} className="flex flex-col gap-3 py-6">
                    {isOpen && <NewNoteCard />}
                    {notes?.map((note) => (
                        <NoteCard note={note} />
                    ))}
                </div>
            </PageLayout>
        </AppLayout>
    );
};

export default Notes;

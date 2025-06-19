import AppLayout from '../../components/layout/AppLayout';
import PageLayout from '../../components/layout/PageLayout';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { useUser } from '../../hooks/react-query/user/useUser.js';
import {
    useReflectSessions,
    useCreateReflectSession,
} from '../../hooks/react-query/reflect-sessions/useReflectSessions.js';
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Divider,
} from '@heroui/react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import toast from 'react-hot-toast';
import EmptyState from '../../components/EmptyState';
import { RiAddFill } from 'react-icons/ri';
import RangeDatepicker from '../../components/form/RangeDatepicker.jsx';
import ProjectSelect from '../../components/form/ProjectSelect.jsx';
import { toUTC } from '../../utils/dateUtils.js';
import { useNavigate } from 'react-router-dom';
import ReflectSessionCard from './ReflectSessionCard.jsx';

function ReflectPage() {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: user } = useUser();
    const navigate = useNavigate();
    const { data: reflectSessionsData } = useReflectSessions(user?.id); // Renamed to avoid conflict
    const { mutate: createReflectSession, isPending } = useCreateReflectSession(user?.id);

    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [selectedProjects, setSelectedProjects] = useState([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    // --- REFACTORED onSubmit FUNCTION ---
    const onSubmit = () => {
        if (!dateRange.from || !dateRange.to) {
            toast.error('Please select a date range');
            return;
        }

        const payload = {
            start_date: toUTC(dateRange.from),
            end_date: toUTC(dateRange.to),
            projects: selectedProjects,
            user_id: user.id,
            workspace_id: currentWorkspace?.workspace_id,
        };

        createReflectSession(payload, {
            onSuccess: (newSession) => {
                toast.success('Reflection session created successfully');
                // The invalidation happens automatically via the hook's onSuccess.
                // We just need to navigate.
                navigate(`/reflect/session/${newSession.id}`);
                onClose();
                reset();
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to create reflection session');
            },
        });
    };
    
    return (
        <AppLayout>
            <PageLayout
                title="Reflect"
                maxW="3xl"
                primaryAction="New session"
                icon={<RiAddFill fontSize="1.2rem" />}
                description="Understand your progress and identify opportunities for improvement with AI-powered retrospectives."
                onClick={onOpen}
            >
                <div className="flex flex-col gap-3 mb-12">
                    {reflectSessionsData?.length ? (
                        reflectSessionsData.map((session) => (
                            <ReflectSessionCard key={session?.id} session={session} />
                        ))
                    ) : (
                        <EmptyState
                            title="No reflect sessions yet"
                            description="Start a new session to gain insights from your completed tasks and projects."
                            primaryAction="Start new session"
                            onClick={onOpen}
                        />
                    )}
                </div>
                <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                    <ModalContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                onSubmit();
                            }}
                        >
                            <ModalHeader className="flex flex-col gap-1">
                                Start a reflection session
                            </ModalHeader>
                            <ModalBody>
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <p className="font-medium text-sm text-gray-700">
                                            Timeframe
                                        </p>
                                        <p className="text-default-500 text-xs">
                                            Choose the period you&#39;d like to focus on.
                                        </p>
                                        <div className="mt-1">
                                            <RangeDatepicker onChange={setDateRange} />
                                        </div>
                                    </div>
                                    <Divider />
                                    <div className="flex flex-col gap-2">
                                        <p className="font-medium text-sm text-gray-700">
                                            Projects
                                        </p>
                                        <p className="text-default-500 text-xs">
                                            Select specific projects, or leave blank to review
                                            everything.
                                        </p>
                                        <div className="mt-1">
                                            <ProjectSelect
                                                multiSelect
                                                onChange={setSelectedProjects}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose} isDisabled={isPending}>
                                    Cancel
                                </Button>
                                <Button color="primary" type="submit" isLoading={isPending}>
                                    Start session
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalContent>
                </Modal>
            </PageLayout>
        </AppLayout>
    );
}

export default ReflectPage;

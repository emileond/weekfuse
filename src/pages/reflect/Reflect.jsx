import AppLayout from '../../components/layout/AppLayout';
import PageLayout from '../../components/layout/PageLayout';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { useUser } from '../../hooks/react-query/user/useUser.js';
import { useReflectSessions } from '../../hooks/react-query/reflect-sessions/useReflectSessions.js';
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
import ky from 'ky';
import { toUTC } from '../../utils/dateUtils.js';
import { useNavigate } from 'react-router-dom';
import ReflectSessionCard from './ReflectSessionCard.jsx';

function ReflectPage() {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: user } = useUser();
    const { data } = useReflectSessions(user?.id);
    const navigate = useNavigate();

    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

    // State for form data
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [isPending, setIsPending] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    const onSubmit = async (formData) => {
        try {
            setIsPending(true);

            if (!dateRange.from || !dateRange.to) {
                toast.error('Please select a date range');
                return;
            }

            // Convert dates to UTC format
            const startDate = toUTC(dateRange.from);
            const endDate = toUTC(dateRange.to);

            // Prepare data for API call
            const payload = {
                start_date: startDate,
                end_date: endDate,
                projects: selectedProjects,
                user_id: user.id,
                workspace_id: currentWorkspace?.workspace_id,
            };

            // Make API call to create a new reflect session
            const response = await ky
                .post('/api/ai/reflect/start', {
                    json: payload,
                    timeout: 180000, // 3 min timeout for AI processing
                })
                .json();

            // After a success response, redirect user to /reflect/session/{id}
            if (response?.id) {
                toast.success('Reflection session created successfully');
                navigate(`/reflect/session/${response.id}`);
            } else {
                toast.error('Failed to create reflection session');
            }

            onClose();
            reset();
        } catch (error) {
            console.error('Error creating reflection session:', error);
            toast.error('Failed to create reflection session');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <AppLayout>
            <PageLayout
                title="Reflect"
                maxW="4xl"
                primaryAction="Start new session"
                icon={<RiAddFill fontSize="1.2rem" />}
                description="Understand your progress and identify opportunities for improvement with AI-powered retrospectives."
                onClick={onOpen}
            >
                <div className="flex flex-col gap-3 mb-12">
                    {data?.length ? (
                        data.map((session) => (
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
                        <form onSubmit={handleSubmit(onSubmit)}>
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

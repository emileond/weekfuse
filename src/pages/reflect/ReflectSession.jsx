import { useParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import PageLayout from '../../components/layout/PageLayout';
import {
    useReflectSessionById,
    useUpdateReflectSession,
} from '../../hooks/react-query/reflect-sessions/useReflectSessions.js';
import { useForm } from 'react-hook-form';
import {
    Alert,
    Button,
    Textarea,
    Card,
    CardBody,
    CardHeader,
    CardFooter,
    Divider,
    Chip,
    Tabs,
    Tab,
} from '@heroui/react';
import {
    RiErrorWarningLine,
    RiSparkling2Line,
    RiThumbUpLine,
    RiCalendar2Line,
} from 'react-icons/ri';
import { useUser } from '../../hooks/react-query/user/useUser.js';
import { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils.js';
import ky from 'ky';
import toast from 'react-hot-toast';

function ReflectSessionPage() {
    const { id } = useParams();
    const { data: user } = useUser();
    const { data: session, isLoading, refetch } = useReflectSessionById(id);
    const updateSession = useUpdateReflectSession(user?.id);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('insights');

    // Set the active tab based on whether ai_summary exists
    useEffect(() => {
        if (session?.ai_summary) {
            setActiveTab('recommendations');
        } else {
            setActiveTab('insights');
        }
    }, [session?.ai_summary]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            went_well: '',
            could_be_better: '',
            ideas: '',
        },
    });

    // Update form values when session data loads
    useEffect(() => {
        if (session?.user_notes) {
            reset({
                went_well: session.user_notes.went_well || '',
                could_be_better: session.user_notes.could_be_better || '',
                ideas: session.user_notes.ideas || '',
            });
        }
    }, [session, reset]);

    const onSubmit = async (formData) => {
        setIsSubmitting(true);
        setSubmitSuccess(false);

        try {
            const userNotes = {
                went_well: formData.went_well,
                could_be_better: formData.could_be_better,
                ideas: formData.ideas,
            };

            // Make a POST request to the new API endpoint using ky
            const response = await ky
                .post('/api/ai/reflect/complete', {
                    json: {
                        session_id: id,
                        ai_insights: session.ai_insights,
                        user_notes: userNotes,
                    },
                    timeout: 180000, // 3 min timeout for AI processing
                })
                .json();

            // Refetch the session data to get the updated ai_summary
            await refetch();
            setSubmitSuccess(true);
            toast.success('Reflection completed successfully');
        } catch (error) {
            console.error('Error completing session:', error);
            toast.error('Failed to complete reflection session');
        } finally {
            setIsSubmitting(false);
        }
    };

    console.log(session);

    // Create custom elements for the page header
    const headerElements = session && (
        <>
            {session.status && (
                <Chip size="sm" variant="dot">
                    {session.status}
                </Chip>
            )}
        </>
    );

    return (
        <AppLayout>
            <PageLayout
                backBtn
                maxW="screen-xl"
                title="Reflect session"
                startElements={!isLoading && headerElements}
                description="Use the insights on the left to guide your thoughts. Fill out what went
                            well and what could improve. Once you save, we'll offer suggestions to
                            help you cultivate balance and intention."
            >
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <p>Loading session data...</p>
                    </div>
                ) : (
                    <div>
                        <div className="flex gap-3 pb-6">
                            {session.start_date && session.end_date && (
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    startContent={<RiCalendar2Line fontSize="1rem" />}
                                >
                                    {formatDate(session.start_date, { dateStyle: 'short' })} -{' '}
                                    {formatDate(session.end_date, { dateStyle: 'short' })}
                                </Chip>
                            )}
                            {session.projects && Array.isArray(session.projects) && (
                                <Chip size="sm" variant="light">
                                    {session.projects.length} projects
                                </Chip>
                            )}
                        </div>
                        <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab}>
                            <Tab key="insights" title="Insights">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                    {/* Left section - AI Insights */}
                                    <Card>
                                        <CardBody className="space-y-3">
                                            <div className="flex gap-3">
                                                {session?.ai_insights?.key_metrics?.total_tasks && (
                                                    <Card className="basis-1/5" shadow="none">
                                                        <CardBody>
                                                            <span className="font-semibold text-xl text-default-600">
                                                                {
                                                                    session.ai_insights.key_metrics
                                                                        .total_tasks
                                                                }
                                                            </span>
                                                        </CardBody>
                                                        <CardFooter className="pt-0">
                                                            <span className="font-medium text-xs text-default-500">
                                                                Tasks completed
                                                            </span>
                                                        </CardFooter>
                                                    </Card>
                                                )}
                                                {session?.ai_insights?.key_metrics
                                                    ?.on_time_percentage && (
                                                    <Card className="basis-1/5" shadow="none">
                                                        <CardBody>
                                                            <span className="font-semibold text-xl text-default-600">
                                                                {
                                                                    session.ai_insights.key_metrics
                                                                        .on_time_percentage
                                                                }
                                                            </span>
                                                        </CardBody>
                                                        <CardFooter className="pt-0">
                                                            <span className="font-medium text-xs text-default-500">
                                                                On-time
                                                            </span>
                                                        </CardFooter>
                                                    </Card>
                                                )}

                                                {session?.ai_insights?.key_metrics
                                                    ?.overdue_tasks !== undefined && (
                                                    <Card className="basis-1/5" shadow="none">
                                                        <CardBody>
                                                            <span className="font-semibold text-xl text-default-600">
                                                                {
                                                                    session.ai_insights.key_metrics
                                                                        .overdue_tasks
                                                                }
                                                            </span>
                                                        </CardBody>
                                                        <CardFooter className="pt-0">
                                                            <span className="font-medium text-xs text-default-500">
                                                                Overdue tasks
                                                            </span>
                                                        </CardFooter>
                                                    </Card>
                                                )}
                                            </div>
                                            <Divider />
                                            <div className="space-y-3">
                                                <h2 className="text-sm font-medium text-default-600">
                                                    Achievements
                                                </h2>
                                                <Card shadow="none">
                                                    <CardBody className="space-y-3">
                                                        {session?.ai_insights?.achievements?.map(
                                                            (item, index) => (
                                                                <Alert
                                                                    key={index}
                                                                    description={item}
                                                                    classNames={{
                                                                        alertIcon: 'text-secondary',
                                                                    }}
                                                                    icon={
                                                                        <RiThumbUpLine fontSize="1.2rem" />
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </CardBody>
                                                </Card>
                                            </div>
                                            <Divider />
                                            <div className="space-y-3">
                                                <h2 className="text-sm font-medium text-default-600">
                                                    Patterns
                                                </h2>
                                                <Card shadow="none">
                                                    <CardBody className="space-y-3">
                                                        {session?.ai_insights?.patterns?.map(
                                                            (item, index) => (
                                                                <Alert
                                                                    key={index}
                                                                    description={item}
                                                                    classNames={{
                                                                        alertIcon: 'text-primary',
                                                                    }}
                                                                    icon={
                                                                        <RiSparkling2Line fontSize="1.2rem" />
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </CardBody>
                                                </Card>
                                            </div>
                                            <Divider />
                                            <div className="space-y-3">
                                                <h2 className="text-sm font-medium text-default-600">
                                                    Challenges
                                                </h2>
                                                <Card shadow="none">
                                                    <CardBody className="space-y-3">
                                                        {session?.ai_insights?.challenges?.map(
                                                            (item, index) => (
                                                                <Alert
                                                                    key={index}
                                                                    description={item}
                                                                    classNames={{
                                                                        alertIcon: 'text-danger',
                                                                    }}
                                                                    icon={
                                                                        <RiErrorWarningLine fontSize="1.2rem" />
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </CardBody>
                                                </Card>
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* Right section - User Notes Form */}
                                    <div>
                                        <Card shadow="sm">
                                            <CardHeader>
                                                <h2 className="text-xl font-semibold">
                                                    Your Reflection
                                                </h2>
                                            </CardHeader>
                                            <CardBody>
                                                <form
                                                    onSubmit={handleSubmit(onSubmit)}
                                                    className="space-y-6"
                                                >
                                                    <div className="space-y-2">
                                                        <label
                                                            htmlFor="went_well"
                                                            className="block font-medium"
                                                        >
                                                            What went well?
                                                        </label>
                                                        <Textarea
                                                            id="went_well"
                                                            placeholder="Enter what went well during this period..."
                                                            {...register('went_well', {
                                                                required: 'This field is required',
                                                            })}
                                                            isInvalid={!!errors.went_well}
                                                            errorMessage={errors.went_well?.message}
                                                            minRows={3}
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label
                                                            htmlFor="could_be_better"
                                                            className="block font-medium"
                                                        >
                                                            What could have gone better?
                                                        </label>
                                                        <Textarea
                                                            id="could_be_better"
                                                            placeholder="Enter what could have gone better..."
                                                            {...register('could_be_better', {
                                                                required: 'This field is required',
                                                            })}
                                                            isInvalid={!!errors.could_be_better}
                                                            errorMessage={
                                                                errors.could_be_better?.message
                                                            }
                                                            minRows={3}
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label
                                                            htmlFor="ideas"
                                                            className="block font-medium"
                                                        >
                                                            Ideas for improvement
                                                        </label>
                                                        <Textarea
                                                            id="ideas"
                                                            placeholder="Enter your ideas for improvement..."
                                                            {...register('ideas', {
                                                                required: 'This field is required',
                                                            })}
                                                            isInvalid={!!errors.ideas}
                                                            errorMessage={errors.ideas?.message}
                                                            minRows={3}
                                                        />
                                                    </div>

                                                    {submitSuccess && (
                                                        <div className="p-3 bg-green-100 text-green-700 rounded-md">
                                                            Your reflection has been saved
                                                            successfully!
                                                        </div>
                                                    )}

                                                    <Button
                                                        type="submit"
                                                        color="primary"
                                                        isLoading={isSubmitting}
                                                        className="w-full"
                                                    >
                                                        Save Reflection
                                                    </Button>
                                                </form>
                                            </CardBody>
                                        </Card>
                                    </div>
                                </div>
                            </Tab>

                            {session?.ai_summary && (
                                <Tab key="recommendations" title="Recommendations">
                                    <div className="mt-4">
                                        <Card>
                                            <CardHeader>
                                                <h2 className="font-semibold">
                                                    AI Recommendations
                                                </h2>
                                            </CardHeader>
                                            <CardBody className="space-y-6">
                                                <p>{session.ai_summary.summary}</p>
                                                {session.ai_summary.recommendations?.map(
                                                    (recommendation, index) => (
                                                        <Card
                                                            key={index}
                                                            shadow="sm"
                                                            className="border-none"
                                                        >
                                                            <CardHeader className="pb-0">
                                                                <div className="flex justify-between items-center">
                                                                    <h3 className="text-lg font-semibold">
                                                                        {recommendation.title}
                                                                    </h3>
                                                                    <Chip size="sm" variant="flat">
                                                                        {recommendation.category}
                                                                    </Chip>
                                                                </div>
                                                            </CardHeader>
                                                            <CardBody>
                                                                <p className="text-default-600">
                                                                    {recommendation.description}
                                                                </p>
                                                            </CardBody>
                                                        </Card>
                                                    ),
                                                )}
                                            </CardBody>
                                        </Card>
                                    </div>
                                </Tab>
                            )}
                        </Tabs>
                    </div>
                )}
            </PageLayout>
        </AppLayout>
    );
}

export default ReflectSessionPage;

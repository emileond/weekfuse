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
    Input,
    Textarea,
    Card,
    CardBody,
    CardHeader,
    Divider,
    CardFooter,
} from '@heroui/react';
import { RiErrorWarningLine, RiSparkling2Line, RiAwardLine, RiThumbUpLine } from 'react-icons/ri';
import { useUser } from '../../hooks/react-query/user/useUser.js';
import { useState, useEffect } from 'react';

function ReflectSessionPage() {
    const { id } = useParams();
    const { data: user } = useUser();
    const { data: session, isLoading } = useReflectSessionById(id);
    const updateSession = useUpdateReflectSession(user?.id);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

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
            await updateSession.mutateAsync({
                session_id: id,
                updates: {
                    user_notes: {
                        went_well: formData.went_well,
                        could_be_better: formData.could_be_better,
                        ideas: formData.ideas,
                    },
                },
            });
            setSubmitSuccess(true);
        } catch (error) {
            console.error('Error updating session:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    console.log(session?.ai_insights);

    if (isLoading) {
        return (
            <AppLayout>
                <PageLayout backBtn maxW="full" title="Reflect session">
                    <div className="flex justify-center items-center h-64">
                        <p>Loading session data...</p>
                    </div>
                </PageLayout>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <PageLayout backBtn maxW="screen-xl" title="Reflect session">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left section - AI Insights */}
                    <div className="space-y-9">
                        <div className="flex gap-3">
                            {session?.ai_insights?.key_metrics?.total_tasks !== undefined && (
                                <Card className="basis-1/5" shadow="sm">
                                    <CardBody>
                                        <span className="font-semibold text-xl text-default-600">
                                            {session.ai_insights.key_metrics.total_completed}
                                        </span>
                                    </CardBody>
                                    <CardFooter className="pt-0">
                                        <span className="font-medium text-xs text-default-500">
                                            Tasks completed
                                        </span>
                                    </CardFooter>
                                </Card>
                            )}
                            {session?.ai_insights?.key_metrics?.on_time_percentage && (
                                <Card className="basis-1/5" shadow="sm">
                                    <CardBody>
                                        <span className="font-semibold text-xl text-default-600">
                                            {session.ai_insights.key_metrics.on_time_percentage}
                                        </span>
                                    </CardBody>
                                    <CardFooter className="pt-0">
                                        <span className="font-medium text-xs text-default-500">
                                            On-time
                                        </span>
                                    </CardFooter>
                                </Card>
                            )}

                            {session?.ai_insights?.key_metrics?.overdue_tasks !== undefined && (
                                <Card className="basis-1/5" shadow="sm">
                                    <CardBody>
                                        <span className="font-semibold text-xl text-default-600">
                                            {session.ai_insights.key_metrics.overdue_tasks}
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

                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-default-600">Achievements</h2>
                            <Card shadow="sm">
                                <CardBody className="space-y-3">
                                    {session?.ai_insights?.achievements?.map((item, index) => (
                                        <Alert
                                            key={index}
                                            description={item}
                                            classNames={{
                                                alertIcon: 'text-secondary',
                                            }}
                                            icon={<RiThumbUpLine fontSize="1.2rem" />}
                                        />
                                    ))}
                                </CardBody>
                            </Card>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-default-600">Patterns</h2>
                            <Card shadow="sm">
                                <CardBody className="space-y-3">
                                    {session?.ai_insights?.patterns?.map((item, index) => (
                                        <Alert
                                            key={index}
                                            description={item}
                                            classNames={{
                                                alertIcon: 'text-primary',
                                            }}
                                            icon={<RiSparkling2Line fontSize="1.2rem" />}
                                        />
                                    ))}
                                </CardBody>
                            </Card>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-default-600">Challenges</h2>
                            <Card shadow="sm">
                                <CardBody className="space-y-3">
                                    {session?.ai_insights?.challenges?.map((item, index) => (
                                        <Alert
                                            key={index}
                                            description={item}
                                            classNames={{
                                                alertIcon: 'text-danger',
                                            }}
                                            icon={<RiErrorWarningLine fontSize="1.2rem" />}
                                        />
                                    ))}
                                </CardBody>
                            </Card>
                        </div>
                    </div>

                    {/* Right section - User Notes Form */}
                    <div>
                        <Card shadow="sm">
                            <CardHeader>
                                <h2 className="text-xl font-semibold">Your Reflection</h2>
                            </CardHeader>
                            <CardBody>
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="space-y-2">
                                        <label htmlFor="went_well" className="block font-medium">
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
                                            errorMessage={errors.could_be_better?.message}
                                            minRows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="ideas" className="block font-medium">
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
                                            Your reflection has been saved successfully!
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
            </PageLayout>
        </AppLayout>
    );
}

export default ReflectSessionPage;

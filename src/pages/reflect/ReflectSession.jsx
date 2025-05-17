import { useParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import PageLayout from '../../components/layout/PageLayout';
import { useReflectSessionById, useUpdateReflectSession } from '../../hooks/react-query/reflect-sessions/useReflectSessions.js';
import { useForm } from 'react-hook-form';
import { Button, Input, Textarea, Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { useUser } from '../../hooks/react-query/user/useUser.js';
import { useState, useEffect } from 'react';

function ReflectSessionPage() {
    const { id } = useParams();
    const { data: user } = useUser();
    const { data: session, isLoading } = useReflectSessionById(id);
    const updateSession = useUpdateReflectSession(user?.id);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        defaultValues: {
            went_well: '',
            could_be_better: '',
            ideas: '',
        }
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
                    }
                }
            });
            setSubmitSuccess(true);
        } catch (error) {
            console.error('Error updating session:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

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
            <PageLayout backBtn maxW="full" title="Reflect session">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left section - AI Insights */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <h2 className="text-xl font-semibold">Summary</h2>
                            </CardHeader>
                            <CardBody>
                                <p>{session?.ai_insights?.summary}</p>
                            </CardBody>
                        </Card>

                        <Card>
                            <CardHeader>
                                <h2 className="text-xl font-semibold">Achievements</h2>
                            </CardHeader>
                            <CardBody>
                                <ul className="list-disc pl-5 space-y-2">
                                    {session?.ai_insights?.achievements?.map((achievement, index) => (
                                        <li key={index}>{achievement}</li>
                                    ))}
                                </ul>
                            </CardBody>
                        </Card>

                        <Card>
                            <CardHeader>
                                <h2 className="text-xl font-semibold">Patterns</h2>
                            </CardHeader>
                            <CardBody>
                                <ul className="list-disc pl-5 space-y-2">
                                    {session?.ai_insights?.patterns?.map((pattern, index) => (
                                        <li key={index}>{pattern}</li>
                                    ))}
                                </ul>
                            </CardBody>
                        </Card>

                        <Card>
                            <CardHeader>
                                <h2 className="text-xl font-semibold">Challenges</h2>
                            </CardHeader>
                            <CardBody>
                                <ul className="list-disc pl-5 space-y-2">
                                    {session?.ai_insights?.challenges?.map((challenge, index) => (
                                        <li key={index}>{challenge}</li>
                                    ))}
                                </ul>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Right section - User Notes Form */}
                    <div>
                        <Card>
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
                                            {...register('went_well', { required: 'This field is required' })}
                                            isInvalid={!!errors.went_well}
                                            errorMessage={errors.went_well?.message}
                                            minRows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="could_be_better" className="block font-medium">
                                            What could have gone better?
                                        </label>
                                        <Textarea
                                            id="could_be_better"
                                            placeholder="Enter what could have gone better..."
                                            {...register('could_be_better', { required: 'This field is required' })}
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
                                            {...register('ideas', { required: 'This field is required' })}
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

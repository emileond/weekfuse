import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import { Button, Card, CardBody, CardFooter, Input, Tabs, Tab, Divider } from '@heroui/react';
import { useEffect, useState } from 'react';
import { useUser } from '../hooks/react-query/user/useUser.js';
import { useUserInvitations } from '../hooks/react-query/user/useUserInvitations.js';
import InvitationCard from '../components/team/InvitationCard.jsx';
import AvatarUploader from '../components/user/AvatarUploader.jsx';
import { useUserProfile } from '../hooks/react-query/user/useUserProfile.js';
import { useUpdateUserProfile } from '../hooks/react-query/user/useUserProfile.js';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState.jsx';

function ProfilePage() {
    const { data: user } = useUser();
    const { data: userProfile } = useUserProfile(user);
    const { data: invitations } = useUserInvitations(user);
    const { mutateAsync: updateUserProfile, isPending } = useUpdateUserProfile(user);
    const navigate = useNavigate();
    const { tab } = useParams();
    const [activeTab, setActiveTab] = useState('profile');

    // Form setup with react-hook-form
    const {
        control,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: { name: '' },
    });

    // Handle form submission
    const onSubmit = async (data) => {
        try {
            await updateUserProfile({ name: data.name });
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile.');
        }
    };

    // Reset form when `userProfile` loads
    useEffect(() => {
        if (userProfile?.name) {
            setValue('name', userProfile.name);
        }
    }, [userProfile, setValue]);

    // Handle resetting the form
    const handleReset = () => {
        reset({ name: userProfile?.name || '' });
    };

    useEffect(() => {
        if (tab) setActiveTab(tab);
    }, [tab]);

    return (
        <AppLayout>
            <PageLayout title="Account settings" maxW="3xl">
                <Tabs
                    selectedKey={activeTab}
                    onSelectionChange={(tab) => {
                        setActiveTab(tab);
                        navigate(`/account/${tab}`, { replace: true });
                    }}
                >
                    <Tab key="profile" title="Profile">
                        <div className="flex flex-col gap-3">
                            <Card shadow="sm">
                                <CardBody className="flex flex-col gap-6 p-4">
                                    <h4>Avatar</h4>
                                    <AvatarUploader />

                                    <h4>Name</h4>
                                    <form
                                        id="profile-form"
                                        onSubmit={handleSubmit(onSubmit)}
                                        className="max-w-sm"
                                    >
                                        <Controller
                                            name="name"
                                            control={control}
                                            rules={{ required: 'Name is required' }}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Name"
                                                    isInvalid={!!errors.name}
                                                    errorMessage={errors.name?.message}
                                                />
                                            )}
                                        />
                                    </form>
                                </CardBody>
                                <Divider />
                                <CardFooter className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        color="default"
                                        size="sm"
                                        onClick={handleReset}
                                        isDisabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        form="profile-form"
                                        color="primary"
                                        size="sm"
                                        isLoading={isSubmitting}
                                        disabled={isPending}
                                    >
                                        Save
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </Tab>
                    <Tab key="invitations" title="Invitations">
                        <div className="flex flex-col gap-3">
                            {invitations?.length ? (
                                invitations?.map((inv) => (
                                    <InvitationCard key={inv.id} invitation={inv} />
                                ))
                            ) : (
                                <EmptyState
                                    title="No Invitations"
                                    description="When you receive an invitation to join another workspace, it will appear here."
                                />
                            )}
                        </div>
                    </Tab>
                </Tabs>
            </PageLayout>
        </AppLayout>
    );
}

export default ProfilePage;

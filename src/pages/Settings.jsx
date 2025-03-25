import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import {
    Alert,
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    Input,
    Progress,
} from '@heroui/react';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace.js';
import { useWorkspaceCredits } from '../hooks/react-query/credits/useWorkspaceCredits.js';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { supabaseClient } from '../lib/supabase.js';
import toast from 'react-hot-toast';
import Paywall from '../components/marketing/Paywall.jsx';
import { MdCelebration } from 'react-icons/md';
import dayjs from 'dayjs';
import ky from 'ky';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '../hooks/react-query/user/useUser.js';

// Function to get total credits based on LTD plan
const getTotalCredits = (ltdPlan) => {
    switch (ltdPlan) {
        case 'plan 1':
            return 10000;
        case 'plan 2':
            return 25000;
        case 'plan 3':
            return 50000;
        default:
            return 0;
    }
};

function SettingsPage() {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: credits } = useWorkspaceCredits(currentWorkspace);
    const [isLoading, setIsLoading] = useState(false);
    const { data: user } = useUser();
    const queryClient = useQueryClient();
    const [isPaywallOpen, setIsPaywallOpen] = useState(false);

    const {
        control, // Required for Controller
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: { workspace_name: '' },
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const id = currentWorkspace.workspace_id;
            const name = data.workspace_name;

            // Get the current session
            const { data: sessionData } = await supabaseClient.auth.getSession();

            // Make a request to the API endpoint using ky
            const result = await ky
                .post('/api/update-workspace', {
                    json: {
                        workspaceId: id,
                        name,
                        session: sessionData.session,
                    },
                })
                .json();

            toast.success('Changes saved');
            await queryClient.invalidateQueries(['workspaces', user?.id]);
        } catch (error) {
            console.error(error);
            if (error.response) {
                try {
                    const errorData = await error.response.json();
                    toast.error(errorData.error || 'Failed to update workspace');
                } catch (jsonError) {
                    console.error('Error parsing error response:', jsonError);
                    toast.error('Failed to save changes, try again');
                }
            } else {
                toast.error(error?.message || 'Failed to save changes, try again');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneralReset = () => {
        setValue('workspace_name', currentWorkspace.name);
    };

    useEffect(() => {
        if (currentWorkspace?.name) {
            setValue('workspace_name', currentWorkspace.name);
        }
    }, [currentWorkspace, setValue]);

    return (
        <AppLayout>
            <Paywall
                hideTitle
                isOpen={isPaywallOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsPaywallOpen(false);
                    }
                }}
                feature="more credits"
            />
            <PageLayout title="Workspace settings" maxW="2xl">
                <div className="flex flex-col gap-6">
                    <Card shadow="sm">
                        <CardHeader>
                            <h4 className="font-medium">General</h4>
                        </CardHeader>
                        <CardBody>
                            <form id="general-workspace-settings" onSubmit={handleSubmit(onSubmit)}>
                                <Controller
                                    name="workspace_name"
                                    control={control}
                                    rules={{ required: 'Workspace name is required' }}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            label="Workspace name"
                                            isInvalid={!!errors.workspace_name}
                                            errorMessage={errors.workspace_name?.message}
                                        />
                                    )}
                                />
                            </form>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                            <div className="w-full flex gap-2 justify-end">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    color="default"
                                    isDisabled={isLoading}
                                    onPress={handleGeneralReset}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    form="general-workspace-settings"
                                    size="sm"
                                    variant="solid"
                                    color="primary"
                                    isLoading={isLoading}
                                    disabled={isLoading}
                                >
                                    Save
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                    <Card shadow="sm">
                        <CardHeader>
                            <h4 className="font-medium">Billing</h4>
                        </CardHeader>
                        <CardBody className="flex flex-col gap-1 pb-1">
                            <div className="flex flex-col gap-3 bg-gradient-to-b from-primary-50 to-blue-50/10 p-3 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <small>Available credits</small>
                                        <h3 className="text-xl font-semibold">
                                            {Intl.NumberFormat().format(credits?.available_credits)}
                                            {currentWorkspace?.is_ltd && (
                                                <span>
                                                    {' '}
                                                    /{' '}
                                                    {Intl.NumberFormat().format(
                                                        getTotalCredits(currentWorkspace?.ltd_plan),
                                                    )}
                                                </span>
                                            )}
                                        </h3>
                                    </div>
                                </div>
                                <Progress
                                    aria-label="credits usage"
                                    size="sm"
                                    color="primary"
                                    minValue={0}
                                    maxValue={
                                        currentWorkspace?.is_ltd
                                            ? getTotalCredits(currentWorkspace?.ltd_plan)
                                            : 25000
                                    }
                                    value={credits?.available_credits}
                                    className="my-2"
                                />
                            </div>
                        </CardBody>
                        <CardFooter className="pt-0">
                            {currentWorkspace?.is_ltd ? (
                                <Alert
                                    color="primary"
                                    variant="faded"
                                    title={`You have access to the LTD ${currentWorkspace?.ltd_plan}`}
                                    description={`Your credits will renew on ${Intl.DateTimeFormat(
                                        navigator.language,
                                        {
                                            dateStyle: 'long',
                                        },
                                    ).format(dayjs(credits?.updated_at).add(1, 'month'))}`}
                                    icon={<MdCelebration fontSize="1.4rem" />}
                                    radius="full"
                                />
                            ) : (
                                <div className="w-full flex justify-center">
                                    <Button
                                        variant="solid"
                                        color="primary"
                                        size="sm"
                                        onPress={() => setIsPaywallOpen(true)}
                                        isDisabled={currentWorkspace?.is_ltd}
                                    >
                                        Get more credits
                                    </Button>
                                </div>
                            )}
                        </CardFooter>
                        <Divider />
                    </Card>
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default SettingsPage;

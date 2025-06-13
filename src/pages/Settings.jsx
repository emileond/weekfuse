import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import { Card, CardBody, CardHeader, CardFooter, Divider, Input, Button } from '@heroui/react';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace.js';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { supabaseClient } from '../lib/supabase.js';
import toast from 'react-hot-toast';
import Paywall from '../components/marketing/Paywall.jsx';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '../hooks/react-query/user/useUser.js';
import SubscriptionInfo from '../components/billing/SubscriptionInfo'; // <-- Import the new component

function SettingsPage() {
    const [currentWorkspace] = useCurrentWorkspace();
    const [isLoading, setIsLoading] = useState(false);
    const { data: user } = useUser();
    const queryClient = useQueryClient();
    const [isPaywallOpen, setIsPaywallOpen] = useState(false);

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: { workspace_name: '' },
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const { error } = await supabaseClient
                .from('workspaces')
                .update({ name: data.workspace_name })
                .eq('id', currentWorkspace.workspace_id);

            if (error) throw error;

            toast.success('Workspace name saved');
            await queryClient.invalidateQueries({ queryKey: ['workspaces', user?.id] });
        } catch (error) {
            toast.error(error?.message || 'Failed to save changes, try again');
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
                isOpen={isPaywallOpen}
                onOpenChange={setIsPaywallOpen}
                feature="upgraded features"
                volumePricing={false}
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

                    {/* --- THIS IS THE UPDATED BILLING CARD --- */}
                    <Card shadow="sm">
                        <CardHeader>
                            <h4 className="font-medium">Billing</h4>
                        </CardHeader>
                        <CardBody>
                            <SubscriptionInfo onUpgradeClick={() => setIsPaywallOpen(true)} />
                        </CardBody>
                    </Card>
                </div>
            </PageLayout>
        </AppLayout>
    );
}

export default SettingsPage;

import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '../../lib/supabase';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { Button, Alert } from '@heroui/react';
import { RiStarSmileLine, RiErrorWarningLine, RiArrowRightLine } from 'react-icons/ri';

import dayjs from 'dayjs';
import PricingPlans from '../marketing/PricingPlans.jsx';

// Helper to format dates consistently using the user's locale
const formatDate = (date) => {
    if (!date) return 'N/A';
    // Use Intl for robust, locale-aware date formatting
    return new Intl.DateTimeFormat(navigator.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
};

// Hook to fetch the detailed subscription data (like the portal URL) for a workspace
const useSubscriptionDetails = (workspaceId) => {
    return useQuery({
        queryKey: ['subscriptionDetails', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return null;
            const { data, error } = await supabaseClient
                .from('subscriptions')
                .select('customer_portal_url, status')
                .eq('workspace_id', workspaceId)
                .in('status', ['active', 'trial', 'cancelled']) // Fetch only relevant subscriptions
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                // Ignore "No rows found" error
                throw new Error(error.message);
            }
            return data;
        },
        enabled: !!workspaceId,
    });
};

// The main component to display subscription status and actions
function SubscriptionInfo({ onUpgradeClick }) {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: subscription, isLoading } = useSubscriptionDetails(
        currentWorkspace?.workspace_id,
    );

    if (isLoading) {
        return <p className="text-sm text-default-500">Loading subscription details...</p>;
    }

    // --- State 1: Lifetime Deal (LTD) ---
    if (currentWorkspace?.is_ltd) {
        return (
            <Alert
                color="primary"
                variant="faded"
                title={`You are on the ${currentWorkspace?.plan} Lifetime Plan!`}
                description="Thank you for being an early supporter. You have lifetime access."
                icon={<RiStarSmileLine fontSize="1.4rem" />}
            />
        );
    }

    // --- State 2: Active Recurring Subscription ---
    if (subscription?.status === 'active') {
        return (
            <div className="flex flex-col gap-6">
                <div className="p-4 bg-default-50 rounded-xl border border-default-200">
                    <p className="text-sm text-default-600">Current Plan</p>
                    <p className="text-lg font-semibold capitalize">{currentWorkspace.plan}</p>
                    <p className="text-sm text-default-500 mt-1">
                        Your plan renews on {formatDate(currentWorkspace.renews_at)}.
                    </p>
                </div>
                <Button
                    as="a"
                    href={subscription.customer_portal_url}
                    target="_blank"
                    color="default"
                    variant="bordered"
                    className="justify-between"
                    endContent={<RiArrowRightLine fontSize="1.2rem" />}
                >
                    Manage Subscription
                </Button>
            </div>
        );
    }

    // State 3: Subscription is Cancelled but still active
    if (subscription?.status === 'cancelled') {
        return (
            <div className="flex flex-col gap-6">
                <Alert
                    color="warning"
                    variant="flat"
                    icon={<RiErrorWarningLine fontSize="1.4rem" />}
                    title="Your plan is set to cancel"
                    description={`Your access will continue until the end of your billing period on ${formatDate(subscription.ends_at)}.`}
                />
                <Button
                    as="a"
                    href={subscription.customer_portal_url}
                    target="_blank"
                    color="default"
                    variant="bordered"
                    className="justify-between"
                    endContent={<RiArrowRightLine fontSize="1.2rem" />}
                >
                    Reactivate subscription
                </Button>
            </div>
        );
    }

    // --- State 4: User is in a trial period ---
    if (currentWorkspace?.subscription_status === 'trial') {
        const trialEndDate = dayjs(currentWorkspace.trial_ends_at);
        const daysLeft = trialEndDate.diff(dayjs(), 'day');

        return (
            <div className="flex flex-col gap-6">
                <Alert
                    color="default"
                    title={
                        daysLeft > 0
                            ? `You have ${daysLeft} days left in your trial.`
                            : 'Your trial ends today!'
                    }
                    description="Upgrade now to keep access to all features without interruption."
                />
                <PricingPlans />
            </div>
        );
    }

    // --- State 4: No active plan or trial has ended ---
    return (
        <div className="flex flex-col gap-6">
            <Alert
                color="danger"
                icon={<RiErrorWarningLine fontSize="1.4rem" />}
                title="No Active Subscription"
                description="Please choose a plan to unlock all features and continue using the app."
            />
            <PricingPlans />
        </div>
    );
}

export default SubscriptionInfo;

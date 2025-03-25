import { logger, schedules } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
);

export const updateLTDWorkspaces = schedules.task({
    id: 'update-ltd-credits',
    cron: '0 */8 * * *',
    run: async () => {
        // Define the threshold for outdated records (e.g., at least 30 days old)
        const aMonthAgo = dayjs().subtract(1, 'month');

        // **Step 1: Fetch workspaces where is_ltd = true**
        const { data: workspaces, error: workspaceError } = await supabase
            .from('workspaces')
            .select('id, ltd_plan')
            .eq('is_ltd', true);

        if (workspaceError) {
            logger.error(`Error fetching LTD workspaces: ${workspaceError.message}`);
            return { success: false };
        }

        if (!workspaces || workspaces.length === 0) {
            logger.log('No LTD workspaces found.');
            return { success: true };
        }

        const workspaceIds = workspaces.map((w) => w.id);

        // **Step 2: Fetch workspace_credits where updated_at is outdated**
        const { data: workspaceCredits, error: creditsError } = await supabase
            .from('workspace_credits')
            .select('workspace_id, updated_at')
            .in('workspace_id', workspaceIds)
            .lte('updated_at', aMonthAgo.toISOString());

        if (creditsError) {
            logger.error(`Error fetching workspace_credits: ${creditsError.message}`);
            return { success: false };
        }

        if (!workspaceCredits || workspaceCredits.length === 0) {
            logger.log('No outdated workspace_credits to update.');
            return { success: true };
        }

        logger.log(`Updating ${workspaceCredits.length} workspace_credits...`);

        // Define credit limits based on the LTD plan
        const creditLimits: Record<string, number> = {
            'plan 1': 10000,
            'plan 2': 25000,
            'plan 3': 50000,
        };

        for (const record of workspaceCredits) {
            const workspace = workspaces.find((w) => w.id === record.workspace_id);
            if (!workspace) continue;

            const newCredits = creditLimits[workspace.ltd_plan];

            if (newCredits !== undefined) {
                const { error: updateError } = await supabase
                    .from('workspace_credits')
                    .update({
                        available_credits: newCredits,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('workspace_id', record.workspace_id);

                if (updateError) {
                    logger.error(
                        `Error updating workspace_credits for workspace ${workspace.id}: ${updateError.message}`,
                    );
                } else {
                    logger.log(
                        `Updated workspace_credits for workspace ${workspace.id} with ${newCredits} credits.`,
                    );
                }
            } else {
                logger.warn(`Unknown plan for workspace ${workspace.id}: ${workspace.ltd_plan}`);
            }
        }

        return { success: true };
    },
});

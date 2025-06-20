import { logger, schedules } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
);

export const updateTrialStatus = schedules.task({
    id: 'update-trial-status',
    cron: '0 0 * * *', // Run daily at midnight
    maxDuration: 300, // 5 minutes max duration
    run: async () => {
        logger.log('Starting update trial status task');

        // Get current time in UTC
        const currentTime = dayjs().utc().toISOString();

        // Fetch workspaces with expired trials
        const { data: workspaces, error: fetchError } = await supabase
            .from('workspaces')
            .select('id, name, subscription_status, trial_ends_at')
            .eq('subscription_status', 'trial')
            .lt('trial_ends_at', currentTime)
            .limit(100);

        if (fetchError) {
            logger.error(`Error fetching workspaces: ${fetchError.message}`);
            return { success: false, error: fetchError.message };
        }

        if (!workspaces || workspaces.length === 0) {
            logger.log('No workspaces with expired trials found');
            return { success: true, updated: 0 };
        }

        logger.log(`Found ${workspaces.length} workspaces with expired trials`);

        let updatedCount = 0;
        let failedCount = 0;

        // Process each workspace
        for (const workspace of workspaces) {
            try {
                // Update the subscription_status to 'trial ended'
                const { error: updateError } = await supabase
                    .from('workspaces')
                    .update({
                        subscription_status: 'trial ended',
                    })
                    .eq('id', workspace.id);

                if (updateError) {
                    throw new Error(updateError.message);
                }

                updatedCount++;
                logger.log(
                    `Updated workspace ${workspace.id} (${workspace.name}) to 'trial ended'`,
                );
            } catch (error) {
                failedCount++;
                logger.error(`Error updating workspace ${workspace.id}: ${error.message}`);
            }
        }

        return {
            success: true,
            updated: updatedCount,
            failed: failedCount,
            total: workspaces.length,
        };
    },
});

import { logger, schedules, tasks } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { toUTC } from '../utils/dateUtils';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
);

export const trelloSync = schedules.task({
    id: 'sync-integrations',
    cron: '*/10 * * * *', // Every 10 minutes
    maxDuration: 3600, // 60 minutes max duration
    run: async () => {
        logger.log('Starting sync task');

        // Calculate the timestamp for 2 hours ago in UTC
        const timeRange = dayjs().utc().subtract(2, 'hours').toISOString();

        // Fetch active workspace integrations that need syncing
        const { data: integrations, error: fetchError } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('status', 'active')
            .lt('last_sync', timeRange)
            .limit(100);

        if (fetchError) {
            logger.error(`Error fetching integrations: ${fetchError.message}`);
            return { success: false, error: fetchError.message };
        }

        if (!integrations || integrations.length === 0) {
            logger.log('No integrations need syncing');
            return { success: true, synced: 0 };
        }

        logger.log(`Found ${integrations.length} integrations to sync`);

        let syncedCount = 0;
        let failedCount = 0;

        // Start a batch to process all integrations by type


        // Process each integration
        for (const integration of integrations) {
            try {
                await tasks.trigger(`${integration.type}-sync`, integration)
                // Update the last_sync timestamp
                await supabase
                    .from('user_integrations')
                    .update({
                        last_sync: toUTC(),
                    })
                    .eq('id', integration.id);

                const access_token = integration.access_token;

            } catch (error) {
                console.log(error);
                failedCount++;
                logger.error(
                    `Error syncing integration ${integration.id}: ${error.message}`,
                );
            }
        }

        return {
            success: true,
            synced: syncedCount,
            failed: failedCount,
            total: integrations.length,
        };
    },
});

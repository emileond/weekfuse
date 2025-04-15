import { logger, schedules } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { toUTC } from '../utils/dateUtils';
import ky from 'ky';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
);

export const githubSync = schedules.task({
    id: 'github-sync',
    cron: '0 * * * *', // Run every hour
    maxDuration: 3000, // 50 minutes max duration
    run: async () => {
        logger.log('Starting GitHub sync task');

        // Calculate the timestamp for 12 hours ago
        const twelveHoursAgo = dayjs().subtract(12, 'hours').toISOString();

        // Fetch active workspace integrations that need syncing
        const { data: integrations, error: fetchError } = await supabase
            .from('workspace_integrations')
            .select('*')
            .eq('type', 'github')
            .eq('status', 'active')
            .lt('last_sync', twelveHoursAgo);

        if (fetchError) {
            logger.error(`Error fetching GitHub integrations: ${fetchError.message}`);
            return { success: false, error: fetchError.message };
        }

        if (!integrations || integrations.length === 0) {
            logger.log('No GitHub integrations need syncing');
            return { success: true, synced: 0 };
        }

        logger.log(`Found ${integrations.length} GitHub integrations to sync`);

        let syncedCount = 0;
        let failedCount = 0;

        // Process each integration
        for (const integration of integrations) {
            try {
                // Use the existing access token
                let accessToken = integration.access_token;

                // If we need to refresh the token, we would do it here
                // GitHub's OAuth implementation doesn't support the standard refresh token flow
                // Instead, we'll use the existing access token which should be long-lived

                // If the token is invalid or expired, we'll catch it in the API call and mark this integration as failed

                // Fetch issues assigned to the user
                const issuesResponse = await ky.get('https://api.github.com/user/issues', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'User-Agent': 'Weekfuse',
                    },
                });

                const issuesData = await issuesResponse.json();

                // Process and store issues
                if (issuesData && Array.isArray(issuesData)) {
                    const upsertPromises = issuesData.map((issue) =>
                        supabase.from('tasks').upsert(
                            {
                                name: issue.title,
                                description: {
                                    type: 'doc',
                                    content: [
                                        {
                                            type: 'paragraph',
                                            content: [{ type: 'text', text: issue.body || '' }],
                                        },
                                    ],
                                },
                                workspace_id: integration.workspace_id,
                                integration_source: 'github',
                                external_id: issue.id,
                                created_at: issue.created_at,
                            },
                            {
                                onConflict: ['integration_source', 'external_id'],
                            },
                        ),
                    );

                    const results = await Promise.all(upsertPromises);

                    let issueSuccessCount = 0;
                    let issueFailCount = 0;

                    results.forEach((result, index) => {
                        if (result.error) {
                            logger.error(`Upsert error for issue ${issuesData[index].id}: ${result.error.message}`);
                            issueFailCount++;
                        } else {
                            issueSuccessCount++;
                        }
                    });

                    logger.log(`Processed ${issuesData.length} issues for workspace ${integration.workspace_id}: ${issueSuccessCount} succeeded, ${issueFailCount} failed`);
                }

                // Update the last_sync timestamp
                await supabase
                    .from('workspace_integrations')
                    .update({
                        last_sync: toUTC(),
                    })
                    .eq('id', integration.id);

                syncedCount++;
                logger.log(`Successfully synced GitHub integration for workspace ${integration.workspace_id}`);
            } catch (error) {
                failedCount++;
                logger.error(`Error syncing GitHub integration for workspace ${integration.workspace_id}: ${error.message}`);
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

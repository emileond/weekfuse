import { logger, schedules } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import { verifyRecords } from '../utils/verifyRecords';
import { cacheDate } from '../utils/cacheDate';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
);

export const emailVerificationTask = schedules.task({
    id: 'update-cache-dns',
    cron: '0 */6 * * *',
    run: async () => {
        // Fetch cached domains in one go
        const { data: cachedDomains, error: cacheError } = await supabase
            .from('domain_cache')
            .select('*')
            .lte('last_updated', cacheDate)
            .limit(500);

        logger.log(`Fetched ${cachedDomains?.length} domains to update.`);

        // Process each chunk
        for (const cDomain of cachedDomains) {
            logger.log(`Updating DNS records for ${cDomain.domain}`);
            const recordsResult = await verifyRecords(cDomain.domain);
            console.log(recordsResult);
            const { error } = await supabase
                .from('domain_cache')
                .update({
                    domain_status: recordsResult.domain_status,
                    mx_record: recordsResult.mx_record,
                    last_updated: new Date(Date.now()).toISOString(),
                })
                .eq('domain', cDomain.domain);

            if (error) {
                logger.error(`Error inserting data for ${cDomain.domain}: ${error.message}`);
            }
        }

        // Return a success message
        return { success: true };
    },
});

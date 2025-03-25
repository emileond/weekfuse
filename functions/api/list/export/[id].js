import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

export async function onRequestGet(context) {
    const listId = await context.params.id;
    const filters = JSON.parse(await context.request.headers.get('x-filters'));

    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

    const batchSize = 1000;
    let start = 0;
    let hasMore = true;
    const allData = [];

    while (hasMore) {
        const { data, error } = await supabase
            .from('list_records')
            .select('custom_fields')
            .eq('list_id', listId)
            .in('status', filters)
            .range(start, start + batchSize - 1);

        if (error) {
            return;
        }

        if (!data || data.length === 0) {
            hasMore = false;
            break;
        }

        // Add the current batch of data to the allData array
        allData.push(...data);

        // Increment the start for the next batch
        start += batchSize;
    }

    const transformedData = allData.map(({ custom_fields }) => custom_fields);
    const csvData = Papa.unparse(transformedData);

    // Create the CSV response
    return new Response(csvData, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${listId}.csv"`,
        },
    });
}

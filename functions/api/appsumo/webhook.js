import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

export async function onRequestPost(context) {
    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

    try {
        const timestamp = context.request.headers.get('X-Appsumo-Timestamp');
        const sha = context.request.headers.get('X-Appsumo-Signature');
        const body = await context.request.json();

        const apiKey = context.env.APPSUMO_PRIVATE_KEY;

        // build the message
        const message = `${timestamp}${JSON.stringify(body)}`;

        const signature = crypto.createHmac('SHA256', apiKey).update(message).digest('hex');

        if (signature !== sha) {
            return Response.json(
                { error: 'Unauthorized' },
                {
                    status: 401,
                },
            );
        }

        const { license_key, prev_license_key, event, license_status, tier, test, extra } = body;

        // Validate input
        if (!license_key || !event) {
            return Response.json(
                { error: 'Missing required fields' },
                {
                    status: 400,
                },
            );
        }

        const eventTimestamp = new Date().toISOString();

        // Define event handlers in an object
        const eventHandlers = {
            purchase: () =>
                supabase.from('appsumo_licenses').insert([
                    {
                        license_status,
                        license_key,
                        event,
                        event_timestamp: eventTimestamp,
                        extra,
                    },
                ]),
            activate: () =>
                supabase
                    .from('appsumo_licenses')
                    .update({
                        license_status: 'active',
                        event,
                        event_timestamp: eventTimestamp,
                        extra,
                    })
                    .eq('license_key', license_key)
                    .select(),
            deactivate: () =>
                supabase
                    .from('appsumo_licenses')
                    .update({
                        license_status: 'deactivated',
                        event,
                        event_timestamp: eventTimestamp,
                        extra,
                    })
                    .eq('license_key', license_key)
                    .select(),
            upgrade: () =>
                supabase
                    .from('appsumo_licenses')
                    .update({
                        tier,
                        prev_license_key,
                        event,
                        event_timestamp: eventTimestamp,
                        extra,
                    })
                    .eq('license_key', license_key)
                    .select(),
            downgrade: () =>
                supabase
                    .from('appsumo_licenses')
                    .update({
                        tier,
                        prev_license_key,
                        event,
                        event_timestamp: eventTimestamp,
                    })
                    .eq('license_key', license_key)
                    .select(),
        };

        // Check if the event exists
        if (!eventHandlers[event]) {
            return Response.json({ error: 'Invalid event type' }, { status: 400 });
        }

        // Execute the corresponding database operation

        const { error } = await eventHandlers[event]();

        // Handle Supabase errors
        if (error) {
            console.log(error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ event, success: true }, { status: 200 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

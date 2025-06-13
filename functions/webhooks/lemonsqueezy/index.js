import { createClient } from '@supabase/supabase-js';

/**
 * Normalizes the product name from Lemon Squeezy to the plan name in your database.
 * @param {string} productName - The product name from the webhook (e.g., "Personal Plan").
 * @returns {string|null} - The normalized plan name ("personal", "team") or null if not matched.
 */
const getPlanName = (productName) => {
    const lowerCaseName = productName.toLowerCase();
    if (lowerCaseName.includes('personal')) {
        return 'personal';
    }
    if (lowerCaseName.includes('team')) {
        return 'team';
    }
    return null;
};

/**
 * Verifies the Lemon Squeezy webhook signature.
 * @param {Request} request - The incoming request from Cloudflare.
 * @param {string} secret - The webhook secret from your environment variables.
 * @returns {Promise<boolean>} - True if the signature is valid, false otherwise.
 */
const verifySignature = async (request, secret) => {
    try {
        const signature = request.headers.get('X-Signature');
        if (!signature) {
            console.error('Signature header missing.');
            return false;
        }

        // The raw body is needed for the HMAC validation
        const rawBody = await request.clone().text();
        const encoder = new TextEncoder();

        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign'],
        );

        const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
        const hash = Array.from(new Uint8Array(signed))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');

        return crypto.timingSafeEqual(encoder.encode(hash), encoder.encode(signature));
    } catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
};

/**
 * The main Cloudflare Function to handle POST requests from Lemon Squeezy.
 */
export const onRequestPost = async (context) => {
    const { request, env } = context;

    // --- 1. Verify the webhook signature for security ---
    const secret = env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    if (!secret) {
        console.error('LEMON_SQUEEZY_WEBHOOK_SECRET environment variable not set.');
        return new Response('Internal Server Error', { status: 500 });
    }

    const isSignatureValid = await verifySignature(request, secret);
    if (!isSignatureValid) {
        return new Response('Invalid signature.', { status: 401 });
    }

    try {
        // --- 2. Parse the body and initialize Supabase client ---
        const body = await request.json();
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

        const { event_name: eventName, custom_data: customData, test_mode: isTestMode } = body.meta;
        const { workspace_id: workspaceId, user_id: userId } = customData;
        const attributes = body.data.attributes;

        // --- 3. Route events to the correct logic ---
        switch (eventName) {
            case 'order_created': {
                const orderData = {
                    lemon_id: body.data.id,
                    workspace_id: workspaceId,
                    user_id: userId,
                    order_status: attributes.status,
                    amount_total: attributes.total,
                    currency: attributes.currency,
                    receipt_url: attributes.urls.receipt,
                    purchased_at: attributes.created_at,
                };

                const { error } = await supabase.from('orders').upsert(orderData, {
                    onConflict: 'lemon_id',
                });

                if (error) throw error;
                break;
            }

            case 'subscription_created':
            case 'subscription_updated':
            case 'subscription_plan_changed':
            case 'subscription_resumed': {
                // This block handles creation and updates, ensuring data is always fresh.
                const subscriptionData = {
                    workspace_id: workspaceId,
                    lemon_id: attributes.first_order_item.subscription_id, // Get sub ID from the order item on creation
                    lemon_customer_id: attributes.customer_id,
                    status: attributes.status,
                    plan: getPlanName(attributes.product_name),
                    renews_at: attributes.renews_at,
                    ends_at: attributes.ends_at,
                    trial_ends_at: attributes.trial_ends_at,
                    update_payment_url: attributes.urls.update_payment_method,
                    customer_portal_url: attributes.urls.customer_portal,
                };

                // Update the detailed subscriptions table
                const { error: subError } = await supabase
                    .from('subscriptions')
                    .upsert(subscriptionData, {
                        onConflict: 'lemon_id',
                    });
                if (subError) throw subError;

                // Also update the 'snapshot' on the workspaces table for quick access
                const workspaceUpdate = {
                    plan: getPlanName(attributes.product_name),
                    subscription_status: attributes.status,
                    lemon_customer_id: attributes.customer_id,
                    // Set LTD flag on creation based on the variant name
                    is_ltd: attributes.first_order_item.variant_name === 'LTD',
                };

                const { error: workspaceError } = await supabase
                    .from('workspaces')
                    .update(workspaceUpdate)
                    .eq('id', workspaceId);

                if (workspaceError) throw workspaceError;
                break;
            }

            case 'subscription_cancelled':
            case 'subscription_expired': {
                const status = eventName === 'subscription_expired' ? 'expired' : 'cancelled';

                // Update the detailed subscription record
                const { error: subError } = await supabase
                    .from('subscriptions')
                    .update({ status: status, ends_at: attributes.ends_at })
                    .eq('lemon_id', body.data.id);
                if (subError) throw subError;

                // Update the workspace snapshot
                const { error: workspaceError } = await supabase
                    .from('workspaces')
                    .update({ subscription_status: status })
                    .eq('lemon_customer_id', attributes.customer_id); // Use customer_id to find the workspace
                if (workspaceError) throw workspaceError;

                break;
            }

            // --- Events for logging or simple status updates ---
            case 'subscription_payment_success':
            case 'subscription_payment_failed':
            case 'subscription_payment_recovered':
                console.log(
                    `Received payment event: ${eventName} for customer ${attributes.customer_id}`,
                );
                // You could add logic here to notify users of failed payments, etc.
                break;

            default:
                console.log(`Webhook event not handled: ${eventName}`);
                // Return 200 so Lemon Squeezy doesn't retry sending it
                return new Response('Webhook event not handled', { status: 200 });
        }

        return new Response('Webhook processed successfully', { status: 200 });
    } catch (error) {
        console.error('Error processing webhook:', error.message);
        return new Response('Internal Server Error', { status: 500 });
    }
};

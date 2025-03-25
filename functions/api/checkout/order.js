import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

export async function onRequestPost(context) {
    const signingSecret = context.env.LEMONSQUEEZY_SIGNING_SECRET;
    const receivedSignature = context.request.headers.get('x-signature');

    if (!receivedSignature) {
        return Response.json(
            { error: 'Unauthorized: No signature' },
            {
                status: 401,
            },
        );
    }

    const rawBody = await context.request.text();

    // Generate HMAC SHA-256 hash
    const hmac = crypto.createHmac('sha256', signingSecret);
    hmac.update(rawBody);
    const computedSignature = hmac.digest('hex'); // Output as hex

    // Convert both to Buffers before comparison
    const computedSignatureBuffer = Buffer.from(computedSignature, 'hex');
    const receivedSignatureBuffer = Buffer.from(receivedSignature, 'hex');

    // Ensure Buffers are of the same length before comparison
    if (
        computedSignatureBuffer.length !== receivedSignatureBuffer.length ||
        !crypto.timingSafeEqual(computedSignatureBuffer, receivedSignatureBuffer)
    ) {
        return Response.json(
            { error: 'Unauthorized: Invalid signature' },
            {
                status: 401,
            },
        );
    }

    const body = JSON.parse(rawBody);

    const { data, meta } = body;
    const { status, refunded, first_order_item } = data.attributes;
    const { product_id, quantity } = first_order_item;
    const { workspace_id } = meta.custom_data;

    // basic check
    if (!status || !product_id || !quantity || !workspace_id) {
        return Response.json(
            { error: 'Missing parameters' },
            {
                status: 400,
            },
        );
    }

    // order and product check
    if (product_id !== Number(context.env.LEMONSQUEEZY_PRODUCT_ID)) {
        return Response.json(null, { status: 204 }); // No content to process
    }

    if (status !== 'paid' && refunded !== false) {
        return Response.json(null, { status: 204 }); // No action needed
    }

    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_KEY);

    const { error } = await supabase.rpc('increase_credits', {
        w_id: workspace_id,
        value: quantity,
    });

    if (error) {
        return Response.json(
            { error: error.message },
            {
                status: 500,
            },
        );
    }

    return Response.json({ data: 'success' }, { status: 200 });
}

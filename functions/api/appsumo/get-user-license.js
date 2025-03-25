import ky from 'ky';
import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const { code, user_id, workspace_id } = body;
        if ((!code, !user_id, !workspace_id)) {
            return Response.json(
                { error: 'Missing fields' },
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        // Step 1: Exchange code for access token
        const tokenResponse = await ky
            .post('https://appsumo.com/openid/token/', {
                json: {
                    client_id: context.env.APPSUMO_CLIENT_ID,
                    client_secret: context.env.APPSUMO_CLIENT_SECRET,
                    code,
                    redirect_uri: context.env.APPSUMO_REDIRECT_URL,
                    grant_type: 'authorization_code',
                },
                headers: { 'Content-Type': 'application/json' },
                throwHttpErrors: false,
            })
            .json();

        console.log('Token Response:', tokenResponse);

        if (tokenResponse.error) {
            return Response.json(tokenResponse, {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Step 2: Retrieve license data
        const licenseResponse = await ky
            .get(
                `https://appsumo.com/openid/license_key/?access_token=${tokenResponse.access_token}`,
                { throwHttpErrors: false },
            )
            .json();

        console.log('License Response:', tokenResponse);

        if (licenseResponse.license_key) {
            const supabase = createClient(
                context.env.SUPABASE_URL,
                context.env.SUPABASE_SERVICE_KEY,
            );

            // link license to user data
            const { error } = await supabase
                .from('appsumo_licenses')
                .update({
                    user_id,
                    workspace_id,
                })
                .eq('license_key', licenseResponse.license_key);

            // Handle Supabase errors
            if (error) {
                return Response.json({ error: error.message }, { status: 500 });
            }
        }

        return Response.json(licenseResponse, {
            status: 200,
        });
    } catch (error) {
        return Response.json(
            {
                error: 'Internal server error',
                details: error.message || JSON.stringify(error),
            },
            {
                status: 500,
            },
        );
    }
}

import ky from 'ky';

export async function onRequestPost(context) {
    const apiKey = context.request.headers.get('x-api-key');

    // check if api key is valid
    if (!apiKey || apiKey !== context.env.WEBHOOK_API_KEY) {
        return Response.json(
            { error: 'Unauthorized' },
            {
                status: 401,
            },
        );
    }

    const body = await context.request.json();
    const { type, record } = body;

    // Basic 400 error handling
    if (!type || !record) {
        return Response.json(
            { error: 'Missing parameters' },
            {
                status: 400,
            },
        );
    }
    const { id: invitationId, invite_email: email, status, invited_by } = record;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
        return Response.json(
            { error: 'Invalid email format' },
            {
                status: 400,
            },
        );
    }

    if (status !== 'pending') {
        return Response.json(
            { error: 'Invite not pending' },
            {
                status: 400,
            },
        );
    }

    try {
        const addSubscriberUrl = `${context.env.LISTMONK_URL}/api/subscribers`;
        try {
            await ky.post(addSubscriberUrl, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `token ${context.env.LISTMONK_USERNAME}:${context.env.LISTMONK_ACCESS_TOKEN}`,
                },
                json: {
                    email,
                    status: 'enabled',
                    lists: [1],
                },
            });
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log('E-mail already exists, sending email invite.');
            } else {
                console.error('Error adding subscriber:', error);
                return Response.json(
                    { error: 'Error adding subscriber' },
                    {
                        status: 500,
                    },
                );
            }
        }

        const sendEmailUrl = `${context.env.LISTMONK_URL}/api/tx`;

        const invitation_link = `${context.env.VITE_PUBLIC_URL}/accept-invite?token=${invitationId}`;

        const response = await ky.post(sendEmailUrl, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `token ${context.env.LISTMONK_USERNAME}:${context.env.LISTMONK_ACCESS_TOKEN}`,
            },
            json: {
                subscriber_email: email,
                template_id: 4,
                data: {
                    inviter_name: invited_by,
                    invitation_link: invitation_link,
                },
                content_type: 'html',
            },
        });

        const data = await response.json();
        return Response.json({ data }, { status: 200 });
    } catch (error) {
        if (error.response) {
            // Handle non-successful responses
            const errorText = await error.response.text();
            return Response.json({ error: errorText }, { status: error.response.status });
        } else {
            // Handle network or other errors
            return Response.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    }
}

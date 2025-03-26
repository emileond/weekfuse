import ky from 'ky';

export async function onRequestPost(context) {
    const apiKey = context.request.headers.get('x-api-key');

    const { record } = await context.request.json();
    const { email } = record;

    // check if api key is valid
    if (!apiKey || apiKey !== context.env.WEBHOOK_API_KEY) {
        return Response.json({ error: 'Unauthorized' }, {
            status: 401,
        });
    }

    // Basic 400 error handling
    if (!email) {
        return Response.json({ error: 'Missing parameters' }, {
            status: 400,
        });
    }

    try {
        const url = `${context.env.LISTMONK_URL}/api/subscribers`;

        const response = await ky.post(url, {
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

        const data = await response.json();
        return Response.json({ data }, { status: 200 });
    } catch (error) {
        if (error.response) {
            // Handle non-successful responses
            const errorText = await error.response.text();
            return Response.json({ error: errorText }, { status: error.response.status });
        } else {
            // Handle network or other errors
            return Response.json({error: 'Internal Server Error' }, { status: 500 });
        }
    }
}

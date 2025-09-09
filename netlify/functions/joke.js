exports.handler = async (event, context) => {
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Get API key from environment variable
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'OpenAI API key not configured' })
            };
        }

        // Call OpenAI API for joke
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a funny joke generator. Create short, clean, and hilarious jokes. Keep them family-friendly and under 50 words. Make them cute and heartwarming.'
                    },
                    {
                        role: 'user',
                        content: 'Tell me a funny joke!'
                    }
                ],
                max_tokens: 100,
                temperature: 0.9
            })
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            console.error('OpenAI API error:', response.status, errText);
            return {
                statusCode: response.status,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'OpenAI API error', status: response.status, details: errText })
            };
        }

        const data = await response.json();
        const joke = data?.choices?.[0]?.message?.content?.trim?.() || '';

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ joke })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Internal server error', details: String(error && error.message || error) })
        };
    }
};

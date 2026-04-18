export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            error: { message: 'OPENROUTER_API_KEY 환경변수가 설정되지 않았습니다.' },
        });
    }

    try {
        const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': req.headers.origin || 'https://mindai.vercel.app',
                'X-Title': 'MindAI Platform',
            },
            body: JSON.stringify(req.body),
        });

        const data = await upstream.json();
        res.status(upstream.status).json(data);
    } catch (e) {
        res.status(502).json({ error: { message: `Upstream error: ${e.message}` } });
    }
}

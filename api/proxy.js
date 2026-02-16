const fetch = require('node-fetch');

// BASE URL LANGSUNG TANPA /KURA/
const BASE_URL = 'https://www.sankavollerei.com/anime';
const RATE_LIMIT = 60;
const requestCounts = new Map();

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const windowStart = now - 60000;
    
    if (!requestCounts.has(clientIp)) {
        requestCounts.set(clientIp, []);
    }
    
    const requests = requestCounts.get(clientIp).filter(time => time > windowStart);
    
    if (requests.length >= RATE_LIMIT) {
        return res.status(429).json({ 
            error: 'Rate limit exceeded. Sabar cuy!',
            retryAfter: 60
        });
    }
    
    requests.push(now);
    requestCounts.set(clientIp, requests);

    // Proxy request
    let { endpoint } = req.query;
    if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint diperlukan' });
    }

    try {
        // Handle query parameters untuk schedule
        if (endpoint.includes('schedule?') && req.query.day) {
            endpoint = `schedule?scheduled_day=${req.query.day}`;
        }
        
        // Bersihin endpoint dari slash berlebih
        const cleanEndpoint = endpoint.replace(/^\//, '');
        const url = `${BASE_URL}/${cleanEndpoint}`;
        
        console.log('Fetching:', url); // Debug log
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });
        
        // Cek response
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Gagal fetch data dari API',
            details: error.message,
            url: url // buat debugging
        });
    }
};

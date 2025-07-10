#!/usr/bin/env node

const https = require('https');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
    console.error('Error: Please set ANTHROPIC_API_KEY environment variable');
    process.exit(1);
}

const prompt = process.argv.slice(2).join(' ');

if (!prompt) {
    console.error('Usage: node claude-cli.js <your question>');
    console.error('Example: node claude-cli.js "Hello Claude, how are you?"');
    process.exit(1);
}

const data = JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
});

const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let body = '';
    
    res.on('data', (chunk) => {
        body += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(body);
            if (response.content && response.content[0]) {
                console.log(response.content[0].text);
            } else {
                console.error('Error:', body);
            }
        } catch (e) {
            console.error('Parse error:', e);
            console.error('Response:', body);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e);
});

req.write(data);
req.end(); 
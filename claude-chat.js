#!/usr/bin/env node

const https = require('https');
const readline = require('readline');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
    console.error('Error: Please set ANTHROPIC_API_KEY environment variable');
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🤖 Claude Terminal Chat Started!');
console.log('Type your questions and press Enter. Type "exit" to quit.\n');

function askClaude(prompt) {
    return new Promise((resolve, reject) => {
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
                        resolve(response.content[0].text);
                    } else {
                        reject(new Error('Invalid response: ' + body));
                    }
                } catch (e) {
                    reject(new Error('Parse error: ' + e.message));
                }
            });
        });

        req.on('error', (e) => {
            reject(new Error('Request error: ' + e.message));
        });

        req.write(data);
        req.end();
    });
}

function chat() {
    rl.question('You: ', async (input) => {
        if (input.toLowerCase() === 'exit') {
            console.log('\n👋 Goodbye! Thanks for chatting with Claude!');
            rl.close();
            return;
        }

        if (input.trim() === '') {
            chat();
            return;
        }

        try {
            console.log('\n🤖 Claude: Thinking...');
            const response = await askClaude(input);
            console.log('\n🤖 Claude:', response);
            console.log('\n' + '─'.repeat(50) + '\n');
        } catch (error) {
            console.error('\n❌ Error:', error.message);
            console.log('\n' + '─'.repeat(50) + '\n');
        }

        chat();
    });
}

// Start the chat
chat(); 
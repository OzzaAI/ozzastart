#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
    console.error('Error: Please set ANTHROPIC_API_KEY environment variable');
    process.exit(1);
}

// Read project context
function getProjectContext() {
    const context = {};
    
    try {
        // Read package.json
        if (fs.existsSync('package.json')) {
            context.packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        }
        
        // Read database schema
        if (fs.existsSync('db/schema.ts')) {
            context.dbSchema = fs.readFileSync('db/schema.ts', 'utf8');
        }
        
        // Read .env structure (without values)
        if (fs.existsSync('.env')) {
            const envContent = fs.readFileSync('.env', 'utf8');
            context.envStructure = envContent.split('\n')
                .filter(line => line.includes('='))
                .map(line => line.split('=')[0] + '=***')
                .join('\n');
        }
        
        // Read README if exists
        if (fs.existsSync('README.md')) {
            context.readme = fs.readFileSync('README.md', 'utf8');
        }
        
        // List main directories
        context.projectStructure = fs.readdirSync('.', { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.') && dirent.name !== 'node_modules')
            .map(dirent => dirent.name);
            
    } catch (error) {
        console.error('Warning: Could not read some project files:', error.message);
    }
    
    return context;
}

function buildContextPrompt(userPrompt, context) {
    let contextInfo = `You are helping with a Next.js project. Here's the current project context:

PROJECT STRUCTURE:
- Main directories: ${context.projectStructure?.join(', ') || 'unknown'}

TECHNOLOGY STACK:`;

    if (context.packageJson) {
        contextInfo += `
- Framework: Next.js ${context.packageJson.dependencies?.['next'] || 'unknown'}
- Key dependencies: ${Object.keys(context.packageJson.dependencies || {}).slice(0, 8).join(', ')}`;
    }

    if (context.envStructure) {
        contextInfo += `

ENVIRONMENT VARIABLES:
${context.envStructure}`;
    }

    if (context.dbSchema) {
        contextInfo += `

DATABASE SCHEMA (db/schema.ts):
\`\`\`typescript
${context.dbSchema.substring(0, 1000)}${context.dbSchema.length > 1000 ? '...' : ''}
\`\`\``;
    }

    contextInfo += `

USER QUESTION: ${userPrompt}

Please provide a helpful response considering this project context.`;

    return contextInfo;
}

async function askClaudeWithContext(prompt) {
    const context = getProjectContext();
    const contextualPrompt = buildContextPrompt(prompt, context);
    
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2048,
            messages: [{ role: 'user', content: contextualPrompt }]
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

const prompt = process.argv.slice(2).join(' ');

if (!prompt) {
    console.error('Usage: node claude-context.js <your question>');
    console.error('Example: node claude-context.js "How do I add a new table to my database?"');
    process.exit(1);
}

console.log('🔍 Reading project context...');
askClaudeWithContext(prompt)
    .then(response => {
        console.log('\n🤖 Claude (with project context):', response);
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
    }); 
#!/usr/bin/env node

/**
 * Grok 4 Integration Test Script
 * 
 * This script validates the Grok 4 upgrade implementation
 * Run with: node test-grok4.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Grok 4 Integration Test Suite');
console.log('================================');

// Test 1: Environment Variables
function testEnvironmentVariables() {
  console.log('\n📋 Test 1: Environment Variables');
  
  const requiredVars = ['LLM_PROVIDER', 'XAI_API_KEY', 'XAI_MODEL_ID'];
  const results = {};
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    results[varName] = {
      set: !!value,
      value: value ? (varName.includes('KEY') ? '***' : value) : 'Not set'
    };
  });
  
  console.log('Environment Variables:');
  Object.entries(results).forEach(([key, result]) => {
    console.log(`  ${result.set ? '✅' : '❌'} ${key}: ${result.value}`);
  });
  
  return Object.values(results).every(r => r.set);
}

// Test 2: File Structure
function testFileStructure() {
  console.log('\n📁 Test 2: File Structure');
  
  const requiredFiles = [
    'lib/langgraph-chatbot.ts',
    'lib/subscription.ts',
    'examples/grok4-agent-chat.ts',
    'GROK4_UPGRADE_README.md'
  ];
  
  const results = requiredFiles.map(file => {
    const fullPath = path.join(__dirname, file);
    const exists = fs.existsSync(fullPath);
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    return exists;
  });
  
  return results.every(r => r);
}

// Test 3: Code Validation
function testCodeValidation() {
  console.log('\n🔍 Test 3: Code Validation');
  
  try {
    // Check TypeScript compilation
    console.log('  🔧 Checking TypeScript compilation...');
    execSync('npx tsc --noEmit --skipLibCheck', { 
      stdio: 'pipe',
      cwd: __dirname 
    });
    console.log('  ✅ TypeScript compilation successful');
    
    return true;
  } catch (error) {
    console.log('  ❌ TypeScript compilation failed');
    console.log('  Error:', error.message);
    return false;
  }
}

// Test 4: Dependencies
function testDependencies() {
  console.log('\n📦 Test 4: Dependencies');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    '@langchain/core',
    '@langchain/langgraph', 
    '@langchain/openai',
    'zod'
  ];
  
  const results = requiredDeps.map(dep => {
    const exists = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
    console.log(`  ${exists ? '✅' : '❌'} ${dep}: ${exists || 'Missing'}`);
    return !!exists;
  });
  
  return results.every(r => r);
}

// Test 5: Configuration Validation
function testConfiguration() {
  console.log('\n⚙️ Test 5: Configuration Validation');
  
  try {
    const chatbotContent = fs.readFileSync('lib/langgraph-chatbot.ts', 'utf8');
    const subscriptionContent = fs.readFileSync('lib/subscription.ts', 'utf8');
    
    const checks = [
      {
        name: 'Grok 4 model support',
        test: chatbotContent.includes('grok-4-0709'),
        file: 'langgraph-chatbot.ts'
      },
      {
        name: 'XAI_MODEL_ID environment variable',
        test: chatbotContent.includes('XAI_MODEL_ID'),
        file: 'langgraph-chatbot.ts'
      },
      {
        name: 'Structured output schemas',
        test: chatbotContent.includes('TemperatureResponseSchema'),
        file: 'langgraph-chatbot.ts'
      },
      {
        name: 'Parallel tool execution',
        test: chatbotContent.includes('parallel'),
        file: 'langgraph-chatbot.ts'
      },
      {
        name: 'Grok Heavy tier support',
        test: subscriptionContent.includes('grok_heavy'),
        file: 'subscription.ts'
      },
      {
        name: 'Heavy tier access function',
        test: subscriptionContent.includes('hasGrokHeavyTierAccess'),
        file: 'subscription.ts'
      }
    ];
    
    checks.forEach(check => {
      console.log(`  ${check.test ? '✅' : '❌'} ${check.name} (${check.file})`);
    });
    
    return checks.every(c => c.test);
  } catch (error) {
    console.log('  ❌ Configuration validation failed:', error.message);
    return false;
  }
}

// Test 6: Example Validation
function testExamples() {
  console.log('\n🎯 Test 6: Example Validation');
  
  try {
    const exampleContent = fs.readFileSync('examples/grok4-agent-chat.ts', 'utf8');
    
    const examples = [
      'exampleParallelToolExecution',
      'exampleComplexWorkflow',
      'exampleStreamingExecution',
      'exampleMultiAgentCoordination',
      'exampleErrorHandling'
    ];
    
    examples.forEach(example => {
      const exists = exampleContent.includes(example);
      console.log(`  ${exists ? '✅' : '❌'} ${example}`);
    });
    
    return examples.every(ex => exampleContent.includes(ex));
  } catch (error) {
    console.log('  ❌ Example validation failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'File Structure', fn: testFileStructure },
    { name: 'Dependencies', fn: testDependencies },
    { name: 'Configuration', fn: testConfiguration },
    { name: 'Examples', fn: testExamples },
    { name: 'Code Validation', fn: testCodeValidation }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ ${test.name} failed with error:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  console.log(`\n🎯 Results: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All tests passed! Grok 4 integration is ready.');
    console.log('\n🚀 Next steps:');
    console.log('1. Set your XAI_API_KEY environment variable');
    console.log('2. Run: npm install to install new dependencies');
    console.log('3. Test with: npm run dev');
    console.log('4. Try the examples in examples/grok4-agent-chat.ts');
  } else {
    console.log('⚠️ Some tests failed. Please review the issues above.');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node test-grok4.js [options]

Options:
  --help, -h     Show this help message
  --env-only     Test only environment variables
  --files-only   Test only file structure
  
Environment Variables:
  LLM_PROVIDER   Set to 'xai' for xAI integration
  XAI_API_KEY    Your xAI API key
  XAI_MODEL_ID   Model ID (default: grok-4-0709)

Examples:
  node test-grok4.js
  LLM_PROVIDER=xai XAI_MODEL_ID=grok-4-0709 node test-grok4.js
  `);
  process.exit(0);
}

if (process.argv.includes('--env-only')) {
  testEnvironmentVariables();
  process.exit(0);
}

if (process.argv.includes('--files-only')) {
  testFileStructure();
  process.exit(0);
}

// Run all tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

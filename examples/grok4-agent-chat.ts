/**
 * Grok 4 Agent Chat Example
 * 
 * This example demonstrates the enhanced capabilities of Grok 4 with:
 * - Parallel tool execution
 * - Structured outputs with Zod validation
 * - Multi-agent orchestration (Heavy tier)
 * - 256K token context window
 */

import { runAgenticChatbot, streamAgenticChatbot } from "@/lib/langgraph-chatbot";
import { hasGrokHeavyTierAccess, getGrokTierInfo } from "@/lib/subscription";

// Example 1: Simple weather and web search with parallel execution
export async function exampleParallelToolExecution() {
  console.log("🚀 Example 1: Parallel Tool Execution with Grok 4");
  
  const userMessage = "What's the weather like in San Francisco and also search for recent news about AI developments?";
  
  try {
    const result = await runAgenticChatbot(userMessage);
    
    console.log("📊 Execution Results:");
    console.log("- Final Response:", result.finalResponse);
    console.log("- Tool Results:", JSON.stringify(result.mcpResults, null, 2));
    console.log("- Execution Step:", result.currentStep);
    
    return result;
  } catch (error) {
    console.error("❌ Error in parallel execution example:", error);
    throw error;
  }
}

// Example 2: Complex multi-step workflow with database and file operations
export async function exampleComplexWorkflow() {
  console.log("🔧 Example 2: Complex Multi-Step Workflow");
  
  const userMessage = `
    I need you to:
    1. Query our database for user analytics from the last month
    2. Create a summary report and save it to a file
    3. Search for industry benchmarks online
    4. Send an email summary to the team (requires approval)
  `;
  
  try {
    const result = await runAgenticChatbot(userMessage);
    
    console.log("📈 Workflow Results:");
    console.log("- Plan Created:", result.plan ? "✅" : "❌");
    console.log("- Tasks Executed:", Object.keys(result.mcpResults || {}).length);
    console.log("- Human Approval Needed:", result.needsHuman ? "✅" : "❌");
    console.log("- Final Response:", result.finalResponse);
    
    return result;
  } catch (error) {
    console.error("❌ Error in complex workflow example:", error);
    throw error;
  }
}

// Example 3: Streaming execution with real-time updates
export async function exampleStreamingExecution() {
  console.log("📡 Example 3: Streaming Execution with Real-Time Updates");
  
  const userMessage = "Analyze the current temperature in multiple cities: New York, London, Tokyo, and Sydney. Also search for weather patterns globally.";
  
  try {
    console.log("🔄 Starting streaming execution...");
    
    for await (const step of streamAgenticChatbot(userMessage)) {
      console.log(`📍 Step: ${step.currentStep}`);
      
      if (step.plan) {
        console.log(`📋 Plan: ${step.plan.tasks.length} tasks, complexity: ${step.plan.estimatedComplexity}`);
      }
      
      if (step.mcpResults && Object.keys(step.mcpResults).length > 0) {
        console.log(`🛠️ Tools executed: ${Object.keys(step.mcpResults).length}`);
      }
      
      if (step.finalResponse) {
        console.log("✅ Final response received");
        console.log("📝 Response:", step.finalResponse);
      }
      
      if (step.errorMessage) {
        console.error("❌ Error:", step.errorMessage);
      }
    }
    
    console.log("🎉 Streaming execution completed");
  } catch (error) {
    console.error("❌ Error in streaming example:", error);
    throw error;
  }
}

// Example 4: Heavy tier multi-agent coordination (requires subscription)
export async function exampleMultiAgentCoordination() {
  console.log("🤖 Example 4: Multi-Agent Coordination (Heavy Tier)");
  
  const hasHeavyAccess = await hasGrokHeavyTierAccess();
  const tierInfo = await getGrokTierInfo();
  
  console.log("🔍 Tier Information:");
  console.log(`- Current Tier: ${tierInfo.tier}`);
  console.log(`- Heavy Access: ${tierInfo.hasHeavyAccess ? '✅' : '❌'}`);
  console.log(`- Multi-Agent: ${tierInfo.multiAgentEnabled ? '✅' : '❌'}`);
  console.log(`- Context Limit: ${tierInfo.contextLimit}`);
  console.log(`- Parallel Processing: ${tierInfo.parallelProcessing ? '✅' : '❌'}`);
  
  if (!hasHeavyAccess) {
    console.log("⚠️ Multi-agent features require Heavy tier subscription");
    console.log("💡 Upgrade to Grok Heavy tier to unlock advanced multi-agent orchestration");
    return null;
  }
  
  const userMessage = `
    I need a comprehensive business analysis. Please coordinate multiple agents to:
    1. Research market trends and competitor analysis
    2. Analyze our internal performance metrics
    3. Generate financial projections
    4. Create actionable recommendations
    5. Prepare executive summary and detailed reports
  `;
  
  try {
    const result = await runAgenticChatbot(userMessage);
    
    console.log("🎯 Multi-Agent Results:");
    console.log("- Agents Coordinated:", result.plan?.tasks.length || 0);
    console.log("- Total Execution Time:", "Calculated from tool results");
    console.log("- Success Rate:", "Based on completed vs failed tasks");
    console.log("- Final Analysis:", result.finalResponse);
    
    return result;
  } catch (error) {
    console.error("❌ Error in multi-agent coordination:", error);
    throw error;
  }
}

// Example 5: Error handling and recovery
export async function exampleErrorHandling() {
  console.log("🛡️ Example 5: Error Handling and Recovery");
  
  const userMessage = "Try to access a restricted file, send an email without proper permissions, and query a non-existent database table.";
  
  try {
    const result = await runAgenticChatbot(userMessage);
    
    console.log("🔍 Error Handling Results:");
    console.log("- Errors Encountered:", Object.values(result.mcpResults || {}).filter(r => r.status === 'failed').length);
    console.log("- Recovery Actions:", "Analyzed from response");
    console.log("- Final Status:", result.currentStep);
    console.log("- User-Friendly Response:", result.finalResponse);
    
    return result;
  } catch (error) {
    console.error("❌ Error in error handling example:", error);
    throw error;
  }
}

// Main demo function
export async function runGrok4Demo() {
  console.log("🎬 Starting Grok 4 Agent Chat Demo");
  console.log("=====================================");
  
  try {
    // Check environment setup
    const tierInfo = await getGrokTierInfo();
    console.log(`🔧 Environment: ${process.env.LLM_PROVIDER || 'openai'} provider`);
    console.log(`🎯 Model: ${process.env.XAI_MODEL_ID || 'grok-beta'}`);
    console.log(`📊 Tier: ${tierInfo.tier} (Heavy: ${tierInfo.hasHeavyAccess ? '✅' : '❌'})`);
    console.log("");
    
    // Run examples
    await exampleParallelToolExecution();
    console.log("");
    
    await exampleComplexWorkflow();
    console.log("");
    
    await exampleStreamingExecution();
    console.log("");
    
    await exampleMultiAgentCoordination();
    console.log("");
    
    await exampleErrorHandling();
    console.log("");
    
    console.log("🎉 Grok 4 Demo completed successfully!");
    
  } catch (error) {
    console.error("❌ Demo failed:", error);
    throw error;
  }
}

// Export for use in other files
export {
  exampleParallelToolExecution,
  exampleComplexWorkflow,
  exampleStreamingExecution,
  exampleMultiAgentCoordination,
  exampleErrorHandling,
  runGrok4Demo
};

// Usage instructions
console.log(`
🚀 Grok 4 Agent Chat Examples

To run these examples:

1. Set environment variables:
   export LLM_PROVIDER=xai
   export XAI_API_KEY=your_api_key
   export XAI_MODEL_ID=grok-4-0709

2. Import and run:
   import { runGrok4Demo } from './examples/grok4-agent-chat';
   await runGrok4Demo();

3. Individual examples:
   import { exampleParallelToolExecution } from './examples/grok4-agent-chat';
   await exampleParallelToolExecution();

Features demonstrated:
✨ Parallel tool execution (Grok 4)
🔧 Structured outputs with Zod validation
🤖 Multi-agent orchestration (Heavy tier)
📡 Real-time streaming execution
🛡️ Error handling and recovery
📊 Performance monitoring and metrics
`);

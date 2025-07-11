#!/bin/bash

# Grok 4 Setup Script for Ozza-Reboot
# This script helps set up the environment for Grok 4 integration

echo "🚀 Grok 4 Setup Script for Ozza-Reboot"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating one..."
    touch .env
fi

# Function to update or add environment variable
update_env_var() {
    local var_name=$1
    local var_value=$2
    local env_file=".env"
    
    if grep -q "^${var_name}=" "$env_file"; then
        # Variable exists, update it
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/^${var_name}=.*/${var_name}=${var_value}/" "$env_file"
        else
            # Linux
            sed -i "s/^${var_name}=.*/${var_name}=${var_value}/" "$env_file"
        fi
        print_status "Updated ${var_name} in .env"
    else
        # Variable doesn't exist, add it
        echo "${var_name}=${var_value}" >> "$env_file"
        print_status "Added ${var_name} to .env"
    fi
}

# Step 1: Configure LLM Provider
echo ""
echo "📋 Step 1: Configure LLM Provider"
echo "================================="

read -p "Do you want to use xAI Grok 4? (y/n): " use_xai
if [[ $use_xai =~ ^[Yy]$ ]]; then
    update_env_var "LLM_PROVIDER" "xai"
    
    # Get API Key
    if [ -z "$XAI_API_KEY" ]; then
        echo ""
        print_info "You need an xAI API key to use Grok 4."
        print_info "Get one at: https://console.x.ai/"
        echo ""
        read -p "Enter your xAI API key: " xai_key
        if [ ! -z "$xai_key" ]; then
            update_env_var "XAI_API_KEY" "$xai_key"
        else
            print_warning "No API key provided. You'll need to set XAI_API_KEY manually."
        fi
    else
        print_status "XAI_API_KEY already set in environment"
    fi
    
    # Configure Model ID
    echo ""
    echo "Available models:"
    echo "1. grok-4-0709 (Latest, requires Heavy tier for full features)"
    echo "2. grok-beta (Legacy, works with all tiers)"
    echo ""
    read -p "Choose model (1 or 2): " model_choice
    
    if [ "$model_choice" = "1" ]; then
        update_env_var "XAI_MODEL_ID" "grok-4-0709"
        print_status "Configured for Grok 4"
        print_warning "Note: Grok 4 multi-agent features require Heavy tier subscription"
    else
        update_env_var "XAI_MODEL_ID" "grok-beta"
        print_status "Configured for Grok Beta"
    fi
else
    print_info "Keeping OpenAI configuration"
    update_env_var "LLM_PROVIDER" "openai"
fi

# Step 2: Install Dependencies
echo ""
echo "📦 Step 2: Install Dependencies"
echo "==============================="

if command -v pnpm &> /dev/null; then
    print_info "Installing dependencies with pnpm..."
    pnpm install
elif command -v npm &> /dev/null; then
    print_info "Installing dependencies with npm..."
    npm install
else
    print_error "Neither npm nor pnpm found. Please install Node.js and npm."
    exit 1
fi

# Step 3: Run Tests
echo ""
echo "🧪 Step 3: Run Integration Tests"
echo "================================"

read -p "Do you want to run the integration tests? (y/n): " run_tests
if [[ $run_tests =~ ^[Yy]$ ]]; then
    if [ -f "test-grok4.js" ]; then
        node test-grok4.js
    else
        print_warning "test-grok4.js not found. Skipping tests."
    fi
fi

# Step 4: Display Configuration Summary
echo ""
echo "📊 Configuration Summary"
echo "======================="

if [ -f .env ]; then
    echo "Environment variables in .env:"
    grep -E "^(LLM_PROVIDER|XAI_MODEL_ID|XAI_API_KEY|OPENAI_API_KEY)=" .env | while read line; do
        var_name=$(echo $line | cut -d'=' -f1)
        var_value=$(echo $line | cut -d'=' -f2)
        
        if [[ $var_name == *"KEY"* ]]; then
            echo "  $var_name=***"
        else
            echo "  $var_name=$var_value"
        fi
    done
fi

# Step 5: Next Steps
echo ""
echo "🎯 Next Steps"
echo "============"

print_info "1. Start the development server:"
echo "   npm run dev"
echo ""

print_info "2. Test the integration:"
echo "   import { runGrok4Demo } from './examples/grok4-agent-chat';"
echo "   await runGrok4Demo();"
echo ""

print_info "3. Check subscription tier for Heavy features:"
echo "   Visit your account settings to upgrade to Heavy tier"
echo ""

print_info "4. Read the upgrade guide:"
echo "   cat GROK4_UPGRADE_README.md"
echo ""

# Check for potential issues
echo "🔍 Potential Issues Check"
echo "========================"

if [ -z "$(grep XAI_API_KEY .env 2>/dev/null)" ] && [ "$LLM_PROVIDER" = "xai" ]; then
    print_warning "XAI_API_KEY not set but LLM_PROVIDER is xai"
fi

if [ ! -f "lib/langgraph-chatbot.ts" ]; then
    print_error "lib/langgraph-chatbot.ts not found"
fi

if [ ! -f "lib/subscription.ts" ]; then
    print_error "lib/subscription.ts not found"
fi

print_status "Setup complete! 🎉"
echo ""
echo "For support, check:"
echo "- GROK4_UPGRADE_README.md"
echo "- examples/grok4-agent-chat.ts"
echo "- GitHub issues"

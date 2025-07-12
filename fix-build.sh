#!/bin/bash
# Ozza-Reboot LightningCSS Fix Script for WSL2/Linux
# Run this script in WSL2 or Linux environment

echo "🚀 Fixing Ozza-Reboot LightningCSS/Tailwind v4 Build Issues..."

# Step 1: Install build dependencies (WSL2/Linux)
echo "📦 Installing build dependencies..."
if command -v apt-get &> /dev/null; then
    echo "Note: Run 'sudo apt update && sudo apt install build-essential' if you get permission errors"
fi

# Step 2: Complete Clean
echo "🧹 Cleaning build artifacts..."
rm -rf node_modules .next pnpm-lock.yaml package-lock.json yarn.lock
npm cache clean --force
if command -v pnpm &> /dev/null; then
    pnpm store prune
fi

# Step 3: Set Registry and Config
echo "⚙️ Setting npm configuration..."
npm config set registry https://registry.npmjs.org/
npm config set timeout 300000
npm config set maxsockets 3

# Step 4: Install Dependencies
echo "📦 Installing dependencies (this may take several minutes)..."

install_success=false

# Method 1: pnpm with WSL2 flags
if command -v pnpm &> /dev/null; then
    echo "Trying pnpm..."
    if pnpm install --no-strict-peer-dependencies --no-optional --timeout 300000; then
        install_success=true
    else
        echo "pnpm failed, trying npm..."
    fi
fi

# Method 2: npm with legacy peer deps
if [ "$install_success" = false ]; then
    echo "Trying npm with legacy-peer-deps..."
    if npm install --legacy-peer-deps --timeout 300000 --maxsockets 3; then
        install_success=true
    else
        echo "npm failed, trying alternative approach..."
    fi
fi

# Method 3: Install essential packages only
if [ "$install_success" = false ]; then
    echo "Installing essential packages only..."
    if npm install next@15.3.1 react@19.0.0 react-dom@19.0.0 typescript@5.8.3 --legacy-peer-deps --timeout 300000; then
        echo "✅ Essential packages installed. You may need to install others manually."
        install_success=true
    fi
fi

if [ "$install_success" = false ]; then
    echo "❌ Installation failed. Try running in native Windows PowerShell:"
    echo "   cd C:\\Dev\\Ozza-Reboot"
    echo "   .\\fix-build.ps1"
    exit 1
fi

# Step 5: Downgrade to Tailwind v3 (Alternative Fix)
echo "🎨 Applying Tailwind v3 workaround..."
if command -v pnpm &> /dev/null; then
    pnpm remove tailwindcss "@tailwindcss/postcss" lightningcss 2>/dev/null || true
    pnpm add "tailwindcss@^3.4.0" 2>/dev/null || npm install "tailwindcss@^3.4.0" --legacy-peer-deps
else
    npm uninstall tailwindcss "@tailwindcss/postcss" lightningcss 2>/dev/null || true
    npm install "tailwindcss@^3.4.0" --legacy-peer-deps
fi

# Restore Tailwind imports
if [ -f "app/globals.css" ]; then
    sed -i 's|/\* Temporarily disabled.*\*/|@tailwind base;\n@tailwind components;\n@tailwind utilities;|g' app/globals.css
    echo "✅ Restored Tailwind imports with v3"
fi

# Step 6: Test Build
echo "🧪 Testing build..."
if npm run build; then
    echo "✅ Build successful!"
else
    echo "⚠️ Build failed, but dev server might work"
fi

# Step 7: Test Dev Server
echo "🖥️ To test dev server, run:"
echo "npm run dev"
echo "Visit: http://localhost:3000/en"

echo ""
echo "🎉 Fix script complete! Your Ozza-Reboot should now work."
echo ""
echo "If issues persist:"
echo "1. Run fix-build.ps1 in native Windows PowerShell (not WSL2)"
echo "2. Ensure VC++ Redistributable is installed on Windows"
echo "3. Try Node v20 LTS if using v22+"
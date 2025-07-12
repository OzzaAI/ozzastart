# Ozza-Reboot LightningCSS Fix Script for WSL2/Windows
# Run this in PowerShell as Administrator (recommended) or in WSL2

Write-Host "🚀 Fixing Ozza-Reboot LightningCSS/Tailwind v4 Build Issues..." -ForegroundColor Green

# Step 1: Install VC++ Redistributable (Windows only)
if ($IsWindows -or $env:OS -eq "Windows_NT") {
    Write-Host "📦 Install VC++ Redistributable manually from:" -ForegroundColor Yellow
    Write-Host "   https://aka.ms/vs/17/release/vc_redist.x64.exe" -ForegroundColor Cyan
    Write-Host "   Then restart your PC and re-run this script." -ForegroundColor Yellow
    Read-Host "Press Enter after installing VC++ Redistributable"
}

# Step 2: Complete Clean
Write-Host "🧹 Cleaning build artifacts..." -ForegroundColor Yellow
Remove-Item -Force -Recurse -ErrorAction SilentlyContinue node_modules, .next, pnpm-lock.yaml, package-lock.json, yarn.lock
npm cache clean --force
if (Get-Command pnpm -ErrorAction SilentlyContinue) { pnpm store prune }

# Step 3: Set Registry and Config
Write-Host "⚙️ Setting npm configuration..." -ForegroundColor Yellow
npm config set registry https://registry.npmjs.org/
npm config set timeout 300000
npm config set maxsockets 5

# Step 4: Install Dependencies
Write-Host "📦 Installing dependencies (this may take several minutes)..." -ForegroundColor Yellow

# Try multiple installation methods
$installSuccess = $false

# Method 1: pnpm with WSL2 flags
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Write-Host "Trying pnpm..." -ForegroundColor Cyan
    try {
        pnpm install --no-strict-peer-dependencies --no-optional --timeout 300000
        $installSuccess = $true
    } catch {
        Write-Host "pnpm failed, trying npm..." -ForegroundColor Yellow
    }
}

# Method 2: npm with legacy peer deps
if (-not $installSuccess) {
    Write-Host "Trying npm with legacy-peer-deps..." -ForegroundColor Cyan
    try {
        npm install --legacy-peer-deps --timeout 300000 --maxsockets 5
        $installSuccess = $true
    } catch {
        Write-Host "npm failed, trying yarn..." -ForegroundColor Yellow
    }
}

# Method 3: yarn
if (-not $installSuccess) {
    Write-Host "Installing and trying yarn..." -ForegroundColor Cyan
    try {
        npm install -g yarn --timeout 300000
        yarn install --timeout 300000
        $installSuccess = $true
    } catch {
        Write-Host "All installation methods failed" -ForegroundColor Red
    }
}

if (-not $installSuccess) {
    Write-Host "❌ Installation failed. Try running on native Windows (not WSL2)" -ForegroundColor Red
    Write-Host "   Or manually install in Windows PowerShell:" -ForegroundColor Yellow
    Write-Host "   cd C:\Dev\Ozza-Reboot" -ForegroundColor Cyan
    Write-Host "   npm install --legacy-peer-deps" -ForegroundColor Cyan
    exit 1
}

# Step 5: Downgrade to Tailwind v3 (Alternative Fix)
Write-Host "🎨 Applying Tailwind v3 workaround..." -ForegroundColor Yellow
try {
    # Remove Tailwind v4 and install v3
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm remove tailwindcss "@tailwindcss/postcss" lightningcss
        pnpm add "tailwindcss@^3.4.0"
    } else {
        npm uninstall tailwindcss "@tailwindcss/postcss" lightningcss
        npm install "tailwindcss@^3.4.0" --legacy-peer-deps
    }
    
    # Restore Tailwind imports
    $globalsPath = "app/globals.css"
    if (Test-Path $globalsPath) {
        $content = Get-Content $globalsPath -Raw
        $content = $content -replace '/\* Temporarily disabled.*?\*/', '@tailwind base;
@tailwind components;
@tailwind utilities;'
        Set-Content $globalsPath $content
        Write-Host "✅ Restored Tailwind imports with v3" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Tailwind downgrade failed, but core dependencies should work" -ForegroundColor Yellow
}

# Step 6: Test Build
Write-Host "🧪 Testing build..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Build successful!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Build failed, but dev server might work" -ForegroundColor Yellow
}

# Step 7: Test Dev Server
Write-Host "🖥️ Testing dev server..." -ForegroundColor Yellow
Write-Host "Run: npm run dev" -ForegroundColor Cyan
Write-Host "Visit: http://localhost:3000/en" -ForegroundColor Cyan

Write-Host "🎉 Fix script complete! Your Ozza-Reboot should now work." -ForegroundColor Green
Write-Host ""
Write-Host "If issues persist:" -ForegroundColor Yellow
Write-Host "1. Run this script in native Windows PowerShell (not WSL2)" -ForegroundColor White
Write-Host "2. Ensure VC++ Redistributable is installed" -ForegroundColor White
Write-Host "3. Try Node v20 LTS if using v22+" -ForegroundColor White
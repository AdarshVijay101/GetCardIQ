
# SETUP SCRIPT FOR GETCARDIQ (WINDOWS)
# Usage: .\scripts\setup_windows.ps1

Write-Host "🚀 Starting GetCardIQ Setup..." -ForegroundColor Cyan

# --- 1. SET DIRECTORY ---
$ScriptRoot = $PSScriptRoot
$Root = Split-Path $ScriptRoot -Parent
Set-Location $Root
Write-Host "Working Directory: $Root"

# --- 2. DEP CHECK ---
Write-Host "`n📦 Checking Dependencies..." -ForegroundColor Yellow
try {
    $nodeVer = node --version
    Write-Host "Node: $nodeVer"
}
catch {
    Write-Error "Node.js not found. Please install Node v18+."
    exit 1
}

# --- 3. FILES ---
Write-Host "`n📝 Setting up Environments..." -ForegroundColor Yellow

if (Test-Path "server\.env") {
    Write-Host "server\.env exists."
}
else {
    Copy-Item "server\.env.example" "server\.env"
    Write-Host "Created server\.env" -ForegroundColor Green
}

if (Test-Path "client\.env.local") {
    Write-Host "client\.env.local exists."
}
else {
    Copy-Item "client\.env.example" "client\.env.local"
    Write-Host "Created client\.env.local" -ForegroundColor Green
}

# --- 4. SERVER INSTALL ---
Write-Host "`n📥 Installing Server Dependencies..." -ForegroundColor Yellow
Set-Location "server"
cmd /c "npm install"
if ($LASTEXITCODE -ne 0) { Write-Error "Server NPM Install Failed"; exit 1 }

# --- 5. DATABASE ---
Write-Host "`n🗄️ Database Sync..." -ForegroundColor Yellow
# Using npx directly via cmd /c to avoid PowerShell path issues
cmd /c "npx prisma generate"
Write-Host "Pushing to Real DB..."
$env:DATABASE_URL = "postgresql://getcards_user:Mylife%4025@localhost:5432/getcardsiq?schema=public"
cmd /c "npx prisma db push --accept-data-loss"

Write-Host "Pushing to Demo DB..."
$env:DATABASE_URL = "postgresql://getcards_user:Mylife%4025@localhost:5432/getcardsiq_demo?schema=public"
cmd /c "npx prisma db push --accept-data-loss"

# --- 6. SEED ---
Write-Host "`n🌱 Seeding Demo..." -ForegroundColor Yellow
cmd /c "npm run seed:demo -- --wipe"

Set-Location ".."

# --- 7. CLIENT INSTALL ---
Write-Host "`n📥 Installing Client Dependencies..." -ForegroundColor Yellow
Set-Location "client"
cmd /c "npm install"
if ($LASTEXITCODE -ne 0) { Write-Error "Client NPM Install Failed"; exit 1 }
Set-Location ".."

Write-Host "`n✅ SETUP COMPLETE!" -ForegroundColor Green

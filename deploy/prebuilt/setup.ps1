param(
    [string]$ImagesTar = ".\getcardiq-images.tar"
)

Write-Host "== GetCardIQ Prebuilt Setup =="

if (!(Test-Path $ImagesTar)) {
    Write-Host "ERROR: Cannot find $ImagesTar"
    Write-Host "Place getcardiq-images.tar in this folder, then re-run."
    exit 1
}

if (!(Test-Path ".\.env")) {
    Write-Host "ERROR: .env not found."
    Write-Host "Copy .env.example to .env and fill values, then re-run."
    exit 1
}

if (Test-Path $ImagesTar) {
    Write-Host "1) 📦 OFFLINE MODE: Found images tarball." -ForegroundColor Cyan
    Write-Host "   Loading Docker images from disk..."
    docker load -i $ImagesTar
    $ComposeFile = ".\docker-compose.prebuilt.yml"
}
else {
    Write-Host "1) 🌍 REGISTRY MODE: Local images tar not found ($ImagesTar)." -ForegroundColor Cyan
    Write-Host "   Switching to GitHub Container Registry (ghcr.io)..."
    $ComposeFile = ".\docker-compose.registry.yml"
    
    Write-Host "   Pulling latest images..."
    docker compose -f $ComposeFile pull
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Docker pull failed." -ForegroundColor Red
        Write-Host "If the repo is private, ensure you have logged in:"
        Write-Host "echo `$env:GHCR_TOKEN | docker login ghcr.io -u YOUR_USER --password-stdin"
        exit 1
    }
}

Write-Host "2) Starting containers using $ComposeFile..."
docker compose -f $ComposeFile up -d

Write-Host "3) Waiting for postgres to become healthy..."
$max = 60
for ($i = 0; $i -lt $max; $i++) {
    $status = (docker inspect -f "{{.State.Health.Status}}" getcardiq-db 2>$null)
    if ($status -eq "healthy") { break }
    Start-Sleep -Seconds 2
}
if ($status -ne "healthy") {
    Write-Host "ERROR: postgres not healthy. Check logs:"
    docker compose -f $ComposeFile logs postgres --tail 150
    exit 1
}

Write-Host "4) Pushing schema to REAL DB..."
docker compose -f $ComposeFile exec server npx prisma db push

Write-Host "5) Pushing schema to DEMO DB..."
docker compose -f $ComposeFile exec server node -e "process.env.DATABASE_URL=process.env.DATABASE_URL_DEMO; require('child_process').execSync('npx prisma db push', {stdio:'inherit'})"

Write-Host "6) Seeding demo data..."
docker compose -f $ComposeFile exec server npm run seed:demo

Write-Host ""
Write-Host "✅ Done."
Write-Host "Open: http://localhost:3000"
Write-Host "Backend: http://localhost:4000"
Write-Host "Python API docs: http://localhost:8000/docs"

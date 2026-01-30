
# VERIFY HEALTH SCRIPT
# Usage: .\scripts\verify_health.ps1

$ServerUrl = "http://localhost:4000/api"
$ClientUrl = "http://localhost:3000"

function Test-Endpoint ($Name, $Url) {
    try {
        $res = Invoke-WebRequest -Uri $Url -Method Get -ErrorAction Stop
        if ($res.StatusCode -eq 200) {
            Write-Host "✅ $Name : OK (200)" -ForegroundColor Green
        } else {
            Write-Host "❌ $Name : Returned $($res.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $Name : Failed to connect ($($_.Exception.Message))" -ForegroundColor Red
    }
}

Write-Host "🏥 Running Health Checks..." -ForegroundColor Cyan

Test-Endpoint "Server Health" "$ServerUrl/health"
Test-Endpoint "Top Cards" "$ServerUrl/cards/top"
Test-Endpoint "Client UI" "$ClientUrl"

# Conditional Demo Check
Write-Host "`n🛡️ Checking Safe Demo Mode..."
try {
    $res = Invoke-WebRequest -Uri "$ServerUrl/insights/spending?window=90d" -Headers @{ "X-DEMO-MODE"="true" } -ErrorAction Stop
    Write-Host "✅ Demo Insights : OK (200)" -ForegroundColor Green
} catch {
    Write-Host "❌ Demo Insights : Failed ($($_.Exception.Message))" -ForegroundColor Red
}

Write-Host "`nDone."


# scripts/verify.ps1
# Usage: .\scripts\verify.ps1

Write-Host "🕵️  Running Verification Suite..." -ForegroundColor Cyan

$ServerUrl = "http://localhost:4000/api"
$PythonUrl = "http://localhost:8000"

function Test-Endpoint ($Name, $Url) {
    try {
        $res = Invoke-WebRequest -Uri $Url -Method Get -ErrorAction Stop
        if ($res.StatusCode -eq 200) {
            Write-Host "✅ $Name : OK (200)" -ForegroundColor Green
        }
        else {
            Write-Host "❌ $Name : Returned $($res.StatusCode)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ $Name : Connection Failed ($($_.Exception.Message))" -ForegroundColor Red
    }
}

# 1. Health Checks
Write-Host "`n🏥 Health Check"
Test-Endpoint "Node API" "$ServerUrl/health"
Test-Endpoint "Python AI" "$PythonUrl/health"
Test-Endpoint "AI Self-Test" "$PythonUrl/ai/selftest"

# 2. Demo Data Check
Write-Host "`n📊 Data Check (Safe Demo Mode)"
try {
    $res = Invoke-WebRequest -Uri "$ServerUrl/insights/spending?window=90d" -Headers @{ "X-DEMO-MODE" = "true" } -ErrorAction Stop
    $json = $res.Content | ConvertFrom-Json
    
    # Check if monthly_trends array is populated
    if ($json.monthly_trends.Count -gt 0) {
        Write-Host "✅ Spending Data : OK ($($json.monthly_trends.Count) months found)" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Spending Data : Empty Array (Did you run seed:demo?)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Spending Data : Failed ($($_.Exception.Message))" -ForegroundColor Red
}

Write-Host "`nDone."

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "E:\cinemoments\screenshots"
$profileDir = "E:\cinemoments\chrome_headless_profile"

# Ensure output directory exists
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

# 1. Fetch Tokens for roles
Write-Host "Authenticating test users via backend..."
$rahulRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"rahul@example.com","password":"Password123!"}'
$staffRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"staff@grandcinema.com","password":"Password123!"}'
$adminRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@cinemoments.com","password":"Password123!"}'

$rahulToken = $rahulRes.token
$staffToken = $staffRes.token
$adminToken = $adminRes.token

$pages = @(
    @{ Name = "01_home_page.png"; Url = "http://localhost:5173/?clearAuth=true" },
    @{ Name = "02_theatres_directory.png"; Url = "http://localhost:5173/theatres" },
    @{ Name = "03_theatre_detail_and_shows.png"; Url = "http://localhost:5173/theatres/1" },
    @{ Name = "04_movies_gallery.png"; Url = "http://localhost:5173/movies" },
    @{ Name = "05_login_page.png"; Url = "http://localhost:5173/login?clearAuth=true" },
    @{ Name = "06_register_page.png"; Url = "http://localhost:5173/register?clearAuth=true" },
    @{ Name = "07_booking_wizard.png"; Url = "http://localhost:5173/book?authToken=$rahulToken" },
    @{ Name = "08_customer_dashboard.png"; Url = "http://localhost:5173/dashboard?authToken=$rahulToken" },
    @{ Name = "09_theatre_staff_queue.png"; Url = "http://localhost:5173/staff?authToken=$staffToken" },
    @{ Name = "10_admin_hub.png"; Url = "http://localhost:5173/admin?authToken=$adminToken" }
)

foreach ($p in $pages) {
    $outPath = Join-Path $outDir $p.Name
    Write-Host "Capturing $($p.Name)..."
    Start-Process -FilePath $chrome -ArgumentList "--headless=new", "--user-data-dir=$profileDir", "--no-sandbox", "--disable-gpu", "--window-size=1440,900", "--virtual-time-budget=3500", "--screenshot=$outPath", $p.Url -Wait
}

Write-Host "All 10 UI screenshots captured successfully!"

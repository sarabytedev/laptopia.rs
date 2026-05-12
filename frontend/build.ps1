# Local frontend build pre git push-a (Windows PowerShell).
# Pokreni: .\frontend\build.ps1 iz root foldera repoa, ili `cd frontend; .\build.ps1`.

$ErrorActionPreference = "Stop"

# Premesti se u frontend folder, bez obzira odakle si pozvao skriptu.
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "==> Provera Node.js..." -ForegroundColor Cyan
$nodeVersion = & node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "Node.js nije pronadjen. Instaliraj LTS sa https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "Node $nodeVersion OK"

Write-Host "==> yarn install (preko npx, ne zahteva global yarn)..." -ForegroundColor Cyan
& npx --yes yarn@1.22.22 install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> yarn build..." -ForegroundColor Cyan
& npx --yes yarn@1.22.22 build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "==> Gotovo. frontend/build/ je spreman." -ForegroundColor Green
Write-Host "Sledeci korak:"
Write-Host "  git add frontend/build"
Write-Host "  git commit -m 'build: frontend'"
Write-Host "  git push origin main"

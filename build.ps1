# Build script untuk BKN CAT Browser
# Jalankan: .\build.ps1

$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
Remove-Item Env:WIN_CSC_LINK -ErrorAction SilentlyContinue

Write-Host "Building BKN CAT Browser..." -ForegroundColor Cyan
npx electron-builder --win --x64 --config.win.sign=null

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build berhasil!" -ForegroundColor Green
    Write-Host "File installer ada di: dist\" -ForegroundColor Green
    Get-ChildItem dist\*.exe | ForEach-Object { Write-Host "  → $($_.Name)" -ForegroundColor Yellow }
} else {
    Write-Host "❌ Build gagal. Cek error di atas." -ForegroundColor Red
}

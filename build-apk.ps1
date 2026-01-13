# PowerShell script to build APK
# Run this with: .\build-apk.ps1

# Set environment variable to skip Git
$env:EAS_NO_VCS = "1"

# Build the APK
Write-Host "Starting APK build..." -ForegroundColor Green
Write-Host "This will take 10-20 minutes. You'll get a URL to track progress." -ForegroundColor Yellow
eas build --platform android --profile preview


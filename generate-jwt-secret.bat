@echo off
REM generate-jwt-secret.bat - Generate secure JWT secret for Windows

echo.
echo 🔐 JWT Secret Generator
echo =====================
echo.
echo Generating 32-character random string...
echo.

REM Generate random 32 chars using PowerShell
for /f "delims=" %%i in ('powershell -Command "[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Random -SetSeed (Get-Date).Ticks -InputObject (1..32) | ForEach-Object {[char](48+$_ mod 64)} | Join-String)))"') do set JWT_SECRET=%%i

echo Your JWT_SECRET:
echo ================
echo %JWT_SECRET%
echo.
echo 📋 Copy the above string and paste it in:
echo    Railway ^> Backend Service ^> Variables ^> JWT_SECRET
echo.
echo ⚠️  Keep this secret safe! Do not commit to GitHub.
echo.
pause

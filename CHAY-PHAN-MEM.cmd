@echo off
cd /d "%~dp0"
node verify-build.mjs
if errorlevel 1 goto failed
echo Mo trinh duyet tai http://127.0.0.1:3000
node server.mjs
goto end
:failed
echo Kiem tra loi o tren. Can Node.js 24.x.
:end
pause

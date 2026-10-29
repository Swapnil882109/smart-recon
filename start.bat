@echo off
title Smart Recon - Automated Invoice Reconciliation System
echo ====================================================
echo   Starting Smart Recon Full-Stack Platform...
echo ====================================================
echo.
cd /d "%~dp0\server"
node src\index.js
pause

@echo off
echo ========================================
echo J-Wheels POS - Vercel Deployment Script
echo ========================================
echo.

:: Check if Node modules exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

:: Run build test
echo Testing build...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed! Please fix errors and try again.
    pause
    exit /b 1
)

echo.
echo ✅ Build successful!
echo.

:: Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo Vercel CLI not found. Installing...
    call npm install -g vercel
    echo.
)

echo Ready to deploy to Vercel!
echo.
echo Choose deployment type:
echo 1. Preview Deployment (for testing)
echo 2. Production Deployment (live)
echo 3. Cancel
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Deploying preview...
    call vercel
) else if "%choice%"=="2" (
    echo.
    echo Deploying to production...
    call vercel --prod
) else (
    echo.
    echo Deployment cancelled.
)

echo.
echo ========================================
echo Deployment complete!
echo ========================================
pause

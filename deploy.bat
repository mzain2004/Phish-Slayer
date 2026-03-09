@echo off
echo.
echo ================================
echo   PHISH-SLAYER AUTO DEPLOY
echo ================================
echo.

set /p msg="Enter commit message: "

git add --all
git commit -m "%msg%"
git push origin main

echo.
echo ================================
echo   PUSHED! Check GitHub Actions
echo   https://github.com/mzain2004/Phish-Slayer/actions
echo ================================
pause
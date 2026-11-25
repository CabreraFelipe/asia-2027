@echo off
setlocal
cd /d "%~dp0"
node "INSTALADOR_SEGURO_V11_24.mjs"
set "RESULTADO=%ERRORLEVEL%"
echo.
if not "%RESULTADO%"=="0" echo Instalador detenido. Ningun nuevo intento automatico.
pause
exit /b %RESULTADO%

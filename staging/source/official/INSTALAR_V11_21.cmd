@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
node "%~dp0INSTALADOR_SEGURO_V11_21.mjs"
set "ASIA_RESULT=%ERRORLEVEL%"
echo.
echo Presiona una tecla para cerrar. Si aparece un error copia el texto de arriba.
pause
exit /b %ASIA_RESULT%

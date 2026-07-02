@echo off
echo ================================================
echo    INICIANDO CRM DESEO DIGITAL
echo ================================================
echo.

echo [1/2] Iniciando servidor Vite...
cd /d "%~dp0"
start "CRM Vite" cmd /k "npm run dev -- --host"
timeout /t 4 /nobreak >nul

echo [2/2] Iniciando ngrok...
start "CRM ngrok" cmd /k "C:\tools\ngrok\ngrok http 5173"

echo.
echo ================================================
echo    LISTO
echo ================================================
echo.
echo 1. En la ventana de ngrok buscas la URL HTTPS
echo    Ejemplo: https://xxxx-xx-xx-xx-xx.ngrok-free.app
echo.
echo 2. Abris esa URL en tu navegador del celular
echo.
echo 3. Para INSTALAR como app:
echo    - Chrome/Edge: Menu -> "Agregar a pantalla de inicio"
echo    - Safari: Compartir -> "Agregar a pantalla de inicio"
echo.
echo 4. Cuando termines de usar el CRM:
echo    - Cerrá las dos ventanas que se abrieron
echo    - O presiona Ctrl+C en cada una
echo.
pause

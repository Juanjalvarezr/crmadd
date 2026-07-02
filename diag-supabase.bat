@echo off
chcp 65001 >nul
echo ============================================================
echo DIAGNOSTICO CRM - CONEXION SUPABASE
echo ============================================================
echo.

echo [1] Leyendo .env del proyecto...
if exist ".env" (
  findstr /I "VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY" ".env"
) else (
  echo ERROR: No se encontro el archivo .env en esta carpeta
)
echo.

echo [2] Probando conectividad HTTP a supabase.co...
powershell -Command "$t=Measure-Command{try{$r=Invoke-WebRequest -Uri 'https://fumubmlcaabyrbzsthmt.supabase.co' -Method Head -TimeoutSec 5 -ErrorAction Stop;'Status: '+$r.StatusCode+' Tiempo: '+$t.TotalSeconds+'s'}catch{'ERROR: '+$_.Exception.Message}}"
echo.

echo [3] Probando API REST directamente a clientes...
echo    Si responde 200 con datos = credenciales OK + CORS OK
echo    Si responde 401 = API key invalida
echo    Si responde (failed) = CORS bloqueado
echo.

powershell -Command "$ErrorActionPreference='SilentlyContinue';$r=Invoke-RestMethod -Uri 'https://fumubmlcaabyrbzsthmt.supabase.co/rest/v1/clientes?select=*,:body&limit=1' -Method Get -Headers @{'apikey'='NONE';'Authorization'='Bearer NONE'} -TimeoutSec 5; $r | ConvertTo-Json -Depth 5"
echo.

echo [4] Verificando archivo .env.example...
if exist ".env.example" (
  type ".env.example"
) else (
  echo No existe .env.example
)
echo.

echo ============================================================
echo FIN DIAGNOSTICO
echo ============================================================
pause

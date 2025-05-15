@echo off
echo ===================================================
echo  SCRIPT DE SUBIDA DE ARCHIVOS A FIREBASE STORAGE
echo ===================================================
echo.

REM Verificar que Node.js esté instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo ERROR: Node.js no está instalado o no se encuentra en el PATH.
  echo Por favor, instala Node.js desde https://nodejs.org/
  exit /b 1
)

REM Verificar que las dependencias estén instaladas
if not exist node_modules (
  echo Instalando dependencias...
  call npm install firebase firebase-admin
  if %ERRORLEVEL% neq 0 (
    echo ERROR: No se pudieron instalar las dependencias.
    exit /b 1
  )
)

echo.
echo Paso 1: Verificando credenciales de Firebase...
node check-firebase-credentials.js
if %ERRORLEVEL% neq 0 (
  echo ERROR: Verifica tus credenciales de Firebase.
  exit /b 1
)

echo.
echo Paso 2: Generando archivos de ejemplo...
node generate-example-files.js
if %ERRORLEVEL% neq 0 (
  echo ERROR: No se pudieron generar los archivos de ejemplo.
  exit /b 1
)

echo.
echo Paso 3: Subiendo archivos a Firebase Storage...
node firebase-upload-assets.js
if %ERRORLEVEL% neq 0 (
  echo ERROR: No se pudieron subir los archivos a Firebase Storage.
  exit /b 1
)

echo.
echo ===================================================
echo  PROCESO COMPLETADO EXITOSAMENTE
echo ===================================================
echo.
echo Los archivos han sido subidos a Firebase Storage.
echo Puedes verificar los resultados en el archivo JSON generado.
echo.
pause 
@echo off
echo =======================================
echo    Iniciando Cuentos_Front_Clean
echo =======================================

:: Cambiar al directorio correcto si es necesario
cd %~dp0

:: Verificar que node_modules existe
if not exist "node_modules" (
    echo No se encuentra la carpeta node_modules. Ejecutando npm install...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo Error durante npm install. Por favor, revisa los mensajes de error.
        pause
        exit /b 1
    )
    echo Dependencias instaladas correctamente.
)

:: Ejecutar npm start
echo Iniciando la aplicacion...
call npm start

:: Mostrar mensaje de finalización
if %ERRORLEVEL% equ 0 (
    echo =======================================
    echo    Aplicación finalizada correctamente
    echo =======================================
) else (
    echo =======================================
    echo    Error al ejecutar la aplicación
    echo =======================================
)

pause 
# Script para iniciar la aplicación en Windows
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "   Iniciando Cuentos_Front_Clean" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
$currentDir = Get-Location
$folderName = Split-Path -Leaf $currentDir

if ($folderName -ne "Cuentos_Front_Clean") {
    Write-Host "No estamos en el directorio Cuentos_Front_Clean. Intentando cambiar..." -ForegroundColor Yellow
    
    # Verificar si existe el directorio Cuentos_Front_Clean
    if (Test-Path -Path ".\Cuentos_Front_Clean") {
        Set-Location -Path ".\Cuentos_Front_Clean"
        Write-Host "Cambiado al directorio Cuentos_Front_Clean correctamente." -ForegroundColor Green
    } else {
        Write-Host "Error: No se encuentra el directorio Cuentos_Front_Clean." -ForegroundColor Red
        Write-Host "Asegúrate de ejecutar este script desde el directorio raíz del proyecto." -ForegroundColor Red
        exit 1
    }
}

# Verificar que node_modules existe
if (-not (Test-Path -Path ".\node_modules")) {
    Write-Host "No se encuentra la carpeta node_modules. Ejecutando npm install..." -ForegroundColor Yellow
    npm install
    
    # Verificar si la instalación fue exitosa
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error durante npm install. Por favor, revisa los mensajes de error." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Dependencias instaladas correctamente." -ForegroundColor Green
}

# Ejecutar npm start
Write-Host "Iniciando la aplicación..." -ForegroundColor Cyan
npm start

# Capturar el código de salida
$exitCode = $LASTEXITCODE

# Mostrar mensaje de finalización
if ($exitCode -eq 0) {
    Write-Host "=======================================" -ForegroundColor Green
    Write-Host "   Aplicación finalizada correctamente" -ForegroundColor Green
    Write-Host "=======================================" -ForegroundColor Green
} else {
    Write-Host "=======================================" -ForegroundColor Red
    Write-Host "   Error al ejecutar la aplicación (Código: $exitCode)" -ForegroundColor Red
    Write-Host "=======================================" -ForegroundColor Red
} 
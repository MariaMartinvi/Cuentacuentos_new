#!/bin/bash

echo "==================================================="
echo " SCRIPT DE SUBIDA DE ARCHIVOS A FIREBASE STORAGE"
echo "==================================================="
echo

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js no está instalado o no se encuentra en el PATH."
  echo "Por favor, instala Node.js desde https://nodejs.org/"
  exit 1
fi

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias..."
  npm install firebase firebase-admin
  if [ $? -ne 0 ]; then
    echo "ERROR: No se pudieron instalar las dependencias."
    exit 1
  fi
fi

echo
echo "Paso 1: Verificando credenciales de Firebase..."
node check-firebase-credentials.js
if [ $? -ne 0 ]; then
  echo "ERROR: Verifica tus credenciales de Firebase."
  exit 1
fi

echo
echo "Paso 2: Generando archivos de ejemplo..."
node generate-example-files.js
if [ $? -ne 0 ]; then
  echo "ERROR: No se pudieron generar los archivos de ejemplo."
  exit 1
fi

echo
echo "Paso 3: Subiendo archivos a Firebase Storage..."
node firebase-upload-assets.js
if [ $? -ne 0 ]; then
  echo "ERROR: No se pudieron subir los archivos a Firebase Storage."
  exit 1
fi

echo
echo "==================================================="
echo " PROCESO COMPLETADO EXITOSAMENTE"
echo "==================================================="
echo
echo "Los archivos han sido subidos a Firebase Storage."
echo "Puedes verificar los resultados en el archivo JSON generado."
echo

# Hacer el script ejecutable
chmod +x upload-to-firebase.sh 
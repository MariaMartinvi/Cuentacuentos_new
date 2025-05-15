# Instrucciones para Subir Archivos a Firebase Storage

Este proyecto incluye un script para subir automáticamente historias, imágenes y archivos de audio a Firebase Storage.

## Requisitos Previos

1. Node.js instalado en tu sistema
2. Archivo de credenciales de Firebase (`firebase-credentials.json`) en la raíz del proyecto

## Estructura de Directorios

Por defecto, el script busca los archivos en los siguientes directorios:

```
temp/
├── stories/    # Archivos de texto (.txt, .md, .json)
├── images/     # Imágenes (.jpg, .jpeg, .png, .gif, .webp, .svg)
└── audio/      # Archivos de audio (.mp3, .wav, .ogg, .m4a)
```

## Obtener Credenciales de Firebase

Si aún no tienes el archivo de credenciales, sigue estos pasos:

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a Configuración > Cuentas de servicio
4. Haz clic en "Generar nueva clave privada"
5. Guarda el archivo JSON descargado como `firebase-credentials.json` en la raíz del proyecto

## Uso Básico

Para subir todos los archivos de los directorios predeterminados:

```bash
node firebase-upload-assets.js
```

## Uso Avanzado

Puedes especificar directorios personalizados usando argumentos:

```bash
node firebase-upload-assets.js --stories=./mis-historias --images=./mis-imagenes --audio=./mis-audios
```

## Tipos de Archivos Soportados

- **Historias**: .txt, .md, .json
- **Imágenes**: .jpg, .jpeg, .png, .gif, .webp, .svg
- **Audio**: .mp3, .wav, .ogg, .m4a

## Resultados

Al finalizar la subida, el script generará un archivo JSON con los resultados, incluyendo URLs de descarga para cada archivo subido correctamente.

## Solución de Problemas

### Error: No se encuentra el archivo de credenciales

Asegúrate de tener el archivo `firebase-credentials.json` en la raíz del proyecto.

### Error: Permission denied

Verifica que las credenciales de Firebase tengan permisos para escribir en Storage.

### Error: Directorio no encontrado

Verifica que los directorios especificados existan y contengan archivos del tipo adecuado. 
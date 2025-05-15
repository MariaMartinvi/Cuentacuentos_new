# Configuración de CORS para Firebase Storage

Este documento explica cómo configurar CORS (Cross-Origin Resource Sharing) en Firebase Storage para permitir el acceso a los archivos desde tu aplicación web.

## Problema

Si ves errores como estos en la consola del navegador:
```
stories%2Fdragon-share.txt?alt=media	Error CORS	xhr	connection.ts:86	0,0 kB
```

Esto significa que Firebase Storage está bloqueando las solicitudes CORS desde tu aplicación web.

## Solución

### Opción 1: Configurar CORS en Firebase Storage

1. Instala la Firebase CLI si aún no la tienes:
   ```bash
   npm install -g firebase-tools
   ```

2. Inicia sesión en Firebase:
   ```bash
   firebase login
   ```

3. Crea un archivo `cors.json` con el siguiente contenido:
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

4. Aplica la configuración CORS a tu bucket de Firebase Storage:
   ```bash
   gsutil cors set cors.json gs://NOMBRE-DE-TU-PROYECTO.appspot.com
   ```
   Reemplaza `NOMBRE-DE-TU-PROYECTO` con el ID de tu proyecto Firebase.

### Opción 2: Solución alternativa (implementada en el código)

La aplicación ya está utilizando un enfoque que evita los problemas de CORS:

1. Usa `getBytes()` directamente de la API de Firebase Storage en lugar de `fetch()`.
2. Utiliza funciones mejoradas que manejan errores de manera más robusta.
3. Muestra contenido de ejemplo cuando los archivos no están disponibles.

## Verificación

Para verificar que la configuración CORS está funcionando:

1. Abre la consola del navegador (F12).
2. Ve a la pestaña Network/Red.
3. Busca solicitudes a Firebase Storage.
4. Verifica que las solicitudes no muestren errores CORS.

## Recursos adicionales

- [Documentación oficial de Firebase sobre CORS](https://firebase.google.com/docs/storage/web/download-files)
- [Guía de configuración de CORS de Google Cloud](https://cloud.google.com/storage/docs/configuring-cors) 
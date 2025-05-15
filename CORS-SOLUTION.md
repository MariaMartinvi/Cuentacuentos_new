# Solución a problemas de CORS en Firebase Storage

Este documento explica cómo resolver los problemas de CORS (Cross-Origin Resource Sharing) que estás experimentando con Firebase Storage.

## Problema identificado

Estás viendo errores CORS al intentar acceder a archivos de texto y audio desde Firebase Storage:

```
stories%2Fdragon-no-volar.txt	Error CORS	xhr	storyExamplesService.js:427	0,0 kB	392 ms
stories%2Fdragon-no-volar.txt	404	preflight	Solicitud preparatoria 0,0 kB	390 ms
```

## Soluciones implementadas

Hemos implementado varias soluciones para resolver este problema:

1. **Corrección de la configuración de Firebase**: Se ha actualizado el valor de `storageBucket` en la configuración de Firebase para usar el dominio correcto.

2. **Mejora del proxy CORS**: Se ha mejorado el archivo `proxy.html` para intentar diferentes variaciones de URL y manejar mejor los errores.

3. **Actualización de los servicios**: Los servicios `getStoryTextContent` y `getStoryAudioUrl` ahora utilizan el proxy para evitar problemas de CORS.

## Pasos adicionales requeridos

Para que todo funcione correctamente, necesitas configurar CORS en tu bucket de Firebase Storage:

### Para usuarios de Windows (PowerShell)

Hemos creado un script específico para Windows:

1. Ejecuta el script de configuración para Windows:
   ```
   node setup-cors-windows.js
   ```

2. Sigue las instrucciones en pantalla. El script abrirá automáticamente la consola de Firebase Storage en tu navegador.

3. En la consola de Firebase, ve a la pestaña "Rules" y añade la configuración CORS que se muestra en el script.

### Para usuarios de Linux/Mac o si tienes gsutil instalado

1. Asegúrate de tener instalada la Firebase CLI:
   ```
   npm install -g firebase-tools
   ```

2. Inicia sesión en Firebase:
   ```
   firebase login
   ```

3. Ejecuta el script de configuración:
   ```
   node setup-cors.js
   ```

4. Sigue las instrucciones en pantalla.

### Configuración manual alternativa

Si los scripts anteriores no funcionan:

1. Ve directamente a la consola de Firebase Storage:
   https://console.firebase.google.com/project/cuentacuentos-b2e64/storage

2. Ve a la pestaña "Rules"

3. Añade la siguiente configuración CORS:
   ```
   cors = [{
     "origin": ["*"],
     "method": ["GET", "HEAD", "OPTIONS"],
     "maxAgeSeconds": 3600,
     "responseHeader": ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"]
   }];
   ```

4. Haz clic en "Publicar"

## Ejecutando la aplicación en PowerShell

En PowerShell, usa `;` en lugar de `&&` para encadenar comandos:

```powershell
cd Cuentos_Front_Clean; npm start
```

O ejecuta los comandos por separado:

```powershell
cd Cuentos_Front_Clean
npm start
```

## Verificación

Para verificar que la solución funciona:

1. Ejecuta la aplicación con `npm start` (asegúrate de estar en el directorio `Cuentos_Front_Clean`)
2. Abre la consola del navegador (F12)
3. Ve a la pestaña "Network/Red"
4. Verifica que las solicitudes a Firebase Storage ya no muestren errores CORS

## Solución de respaldo

Si después de aplicar estas soluciones sigues teniendo problemas, la aplicación utilizará automáticamente contenido de ejemplo para que puedas seguir trabajando. 
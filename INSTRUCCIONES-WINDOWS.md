# Instrucciones para ejecutar la aplicación en Windows

## Problema con PowerShell y comandos encadenados

En PowerShell, el operador `&&` no funciona como en bash/cmd. Si intentas usar comandos como:

```
cd Cuentos_Front_Clean && npm start
```

Obtendrás un error como este:
```
El token '&&' no es un separador de instrucciones válido en esta versión.
```

## Solución 1: Usar comandos separados

La forma más sencilla es ejecutar los comandos por separado:

```powershell
cd Cuentos_Front_Clean
npm start
```

## Solución 2: Usar el operador de encadenamiento de PowerShell

En PowerShell, usa `;` en lugar de `&&`:

```powershell
cd Cuentos_Front_Clean; npm start
```

## Solución 3: Usar CMD en lugar de PowerShell

Si prefieres usar la sintaxis de CMD, puedes abrir una terminal CMD en lugar de PowerShell:

1. Presiona `Win + R`
2. Escribe `cmd` y presiona Enter
3. Navega a tu proyecto y usa `&&` normalmente:
   ```cmd
   cd C:\Users\Tiendeo\nombre-del-proyecto\Cuentos_Front_Clean && npm start
   ```

## Configuración de CORS para Firebase Storage

Para configurar CORS en Firebase Storage desde Windows:

1. Ejecuta el script específico para Windows:
   ```
   node setup-cors-windows.js
   ```

2. Sigue las instrucciones en pantalla.

## Verificación

Para verificar que todo funciona correctamente:

1. Asegúrate de estar en el directorio correcto:
   ```
   cd Cuentos_Front_Clean
   ```

2. Inicia la aplicación:
   ```
   npm start
   ```

3. Abre la consola del navegador (F12) y verifica que no hay errores CORS en la pestaña "Network/Red" 
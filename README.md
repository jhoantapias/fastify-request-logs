# fastify-request-logs

Una librería de logging para aplicaciones Fastify que registra automáticamente todas las peticiones HTTP de manera estructurada, con soporte opcional para Google Cloud Logging.

## Instalación

```bash
npm install fastify-request-logs
```

## Uso básico

```typescript
import fastify from 'fastify';
import { logger } from 'fastify-request-logs';

const app = fastify();

// Implementar el logger directamente
logger(app, {
  only_errors: false,
  domain: 'mi-api',
  service: 'usuarios',
  colors: true
});

app.get('/test', async (request, reply) => {
  // El logger está disponible automáticamente en cada request
  request.logger.add('custom-log', 'Este es un log personalizado');
  
  return { message: 'Hello World' };
});
```

## Configuración

### Opciones disponibles

```typescript
interface LoggerOptions {
  only_errors: boolean;           // Solo registrar errores
  domain: string;                 // Dominio de la aplicación
  service: string;                // Nombre del servicio
  module?: string;                // Módulo específico (opcional)
  colors: boolean;                // Habilitar colores en consola
  useGCloudLogging?: boolean;     // Usar Google Cloud Logging
  gcloudProjectId?: string;       // ID del proyecto de Google Cloud
}
```

## Google Cloud Logging

### Configuración básica

Para usar Google Cloud Logging, configura las opciones así:

```typescript
logger(app, {
  only_errors: false,
  domain: 'mi-api',
  service: 'usuarios',
  colors: true,
  useGCloudLogging: true,
  gcloudProjectId: 'mi-proyecto-gcp'
});
```

### Requisitos previos

1. **Instalar las dependencias de Google Cloud:**
   ```bash
   npm install @google-cloud/logging
   ```

2. **Configurar las credenciales de Google Cloud:**
   - Configurar la variable de entorno `GOOGLE_APPLICATION_CREDENTIALS`
   - O usar el SDK de Google Cloud (`gcloud auth application-default login`)
   - O ejecutar en un entorno de Google Cloud (GKE, Cloud Run, etc.)

### Características de Google Cloud Logging

Cuando `useGCloudLogging` está habilitado:

- **Logs estructurados:** Los logs se envían con metadatos estructurados
- **Severidad automática:** Se asigna automáticamente `INFO` o `ERROR` según el tipo de respuesta
- **Etiquetas:** Se incluyen automáticamente las etiquetas de domain, service y module
- **HTTP Request metadata:** Se incluye información de la petición HTTP (URL, método, status code)
- **Fallback seguro:** Si hay errores con Google Cloud Logging, automáticamente regresa a console.log

### Ejemplo de log en Google Cloud

```json
{
  "severity": "INFO",
  "httpRequest": {
    "status": 200,
    "requestUrl": "/api/users",
    "requestMethod": "GET"
  },
  "labels": {
    "domain": "mi-api",
    "service": "usuarios",
    "module": "default"
  },
  "jsonPayload": {
    "INFO": {
      "__url": "/api/users",
      "__method": "GET",
      "__params": {},
      "__body": {},
      "domain": "mi-api",
      "service": "usuarios"
    },
    "LOGS": {
      "custom-log": "Este es un log personalizado"
    },
    "RESPONSE": {
      "message": "Hello World",
      "statusCode": 200
    }
  }
}
```

## API de Logging

### Logging personalizado

```typescript
app.get('/ejemplo', async (request, reply) => {
  // Agregar logs personalizados
  request.logger.add('usuario-id', request.user?.id);
  request.logger.add('accion', 'consulta-datos');
  
  // Registrar errores específicos
  try {
    // ... código que puede fallar
  } catch (error) {
    request.logger.error('database-error', error.message, 'DB_001');
  }
  
  return { success: true };
});
```

### Soporte para Pub/Sub

La librería detecta automáticamente payloads de Google Cloud Pub/Sub y los decodifica:

```typescript
// El body se decodifica automáticamente si es un mensaje de Pub/Sub
app.post('/webhook', async (request, reply) => {
  // request.logger capturará automáticamente el mensaje decodificado
  return { received: true };
});
```

## Configuración de desarrollo vs producción

### Desarrollo
```typescript
logger(app, {
  only_errors: false,
  domain: 'dev-api',
  service: 'usuarios',
  colors: true,
  useGCloudLogging: false  // Usar console.log en desarrollo
});
```

### Producción
```typescript
logger(app, {
  only_errors: false,
  domain: 'prod-api',
  service: 'usuarios',
  colors: false,
  useGCloudLogging: true,
  gcloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID
});
```

## Estructura de logs

Cada log incluye las siguientes secciones:

- **INFO**: Información básica de la petición (URL, método, parámetros, body)
- **LOGS**: Logs personalizados agregados con `request.logger.add()`
- **RESPONSE**: Respuesta exitosa del endpoint
- **ERROR_RESPONSE**: Respuesta de error (si aplica)
- **ERRORS**: Errores específicos registrados con `request.logger.error()`

## Licencia

MIT

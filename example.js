const fastify = require('fastify')({ logger: false });

// Ejemplo 1: Usando console.log tradicional (desarrollo)
console.log('=== Ejemplo 1: Console.log tradicional ===');
const { logger } = require('./dist/index.js');

logger(fastify, {
  only_errors: false,
  domain: 'dev-api',
  service: 'ejemplo',
  module: 'test',
  colors: true,
  useGCloudLogging: false // Usar console.log
});

// Ejemplo 2: Usando Google Cloud Logging (producción)
// Descomenta las siguientes líneas para probar con Google Cloud
/*
console.log('=== Ejemplo 2: Google Cloud Logging ===');
logger(fastify, {
  only_errors: false,
  domain: 'prod-api',
  service: 'ejemplo',
  module: 'test',
  colors: false,
  useGCloudLogging: true,
  gcloudProjectId: 'tu-proyecto-gcp' // Reemplaza con tu Project ID
});
*/

// Rutas de ejemplo
fastify.get('/', async (request, reply) => {
  request.logger.add('action', 'home-page-visit');
  request.logger.add('user-agent', request.headers['user-agent']);
  
  return { 
    message: 'Hello World!',
    timestamp: new Date().toISOString()
  };
});

fastify.get('/error', async (request, reply) => {
  request.logger.add('action', 'error-test');
  request.logger.error('custom-error', 'Este es un error de prueba', 'TEST_001');
  
  reply.code(500);
  return { 
    error: 'Error de prueba',
    isError: true 
  };
});

fastify.post('/data', async (request, reply) => {
  request.logger.add('received-data', request.body);
  request.logger.add('content-type', request.headers['content-type']);
  
  return { 
    received: true,
    data: request.body 
  };
});

// Iniciando el servidor
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Servidor iniciado en http://localhost:3000');
    console.log('');
    console.log('Prueba estas rutas:');
    console.log('- GET  http://localhost:3000/');
    console.log('- GET  http://localhost:3000/error');
    console.log('- POST http://localhost:3000/data');
    console.log('');
    console.log('Los logs aparecerán en la consola (o en Google Cloud si está habilitado)');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 
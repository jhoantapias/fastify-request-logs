const fastify = require('fastify')({ logger: false });
const { logger, printLog, printError, getRequestLogger } = require('./dist/index.js');

// Configuración del logger
logger(fastify, {
  only_errors: false,
  domain: 'context-example',
  service: 'demo',
  module: 'async-storage',
  colors: true,
  useGCloudLogging: false
});

// Funciones auxiliares que pueden hacer logging sin recibir parámetros
async function getUserData(userId) {
  // ✅ Ahora puedes hacer logging sin pasar request.logger
  printLog('function-called', 'getUserData');
  printLog('user-id', userId);
  
  // Simular consulta a base de datos
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (userId === 'invalid') {
    printError('validation-error', 'Invalid user ID', 'USER_001');
    throw new Error('Invalid user ID');
  }
  
  const userData = { id: userId, name: 'John Doe', email: 'john@example.com' };
  printLog('user-data-retrieved', userData);
  
  return userData;
}

async function processPayment(amount) {
  printLog('function-called', 'processPayment');
  printLog('payment-amount', amount);
  
  // Simular procesamiento
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (amount <= 0) {
    printError('payment-error', 'Invalid payment amount', 'PAY_001');
    throw new Error('Invalid payment amount');
  }
  
  const paymentId = 'pay_' + Date.now();
  printLog('payment-processed', { paymentId, amount });
  
  return { paymentId, status: 'completed' };
}

async function sendNotification(message) {
  printLog('function-called', 'sendNotification');
  
  // Puedes acceder al logger completo si necesitas funcionalidades avanzadas
  const logger = getRequestLogger();
  logger.add('notification-message', message);
  
  // Simular envío de notificación
  await new Promise(resolve => setTimeout(resolve, 50));
  
  printLog('notification-sent', true);
}

// Rutas de ejemplo
fastify.get('/user/:id', async (request, reply) => {
  const { id } = request.params;
  
  // Opción 1: Usar el método tradicional (sigue funcionando)
  request.logger.add('route-accessed', '/user/:id');
  
  // Opción 2: Usar las nuevas funciones globales
  printLog('request-start', Date.now());
  
  try {
    const userData = await getUserData(id);
    printLog('request-success', true);
    
    return userData;
  } catch (error) {
    printError('request-error', error.message, 'REQ_001');
    reply.code(400);
    return { error: error.message, isError: true };
  }
});

fastify.post('/process-order', async (request, reply) => {
  const { userId, amount } = request.body;
  
  printLog('route-accessed', '/process-order');
  printLog('order-data', { userId, amount });
  
  try {
    // Todas estas funciones pueden hacer logging sin pasar parámetros
    const user = await getUserData(userId);
    const payment = await processPayment(amount);
    await sendNotification(`Order processed for user ${user.name}`);
    
    printLog('order-completed', true);
    
    return {
      success: true,
      orderId: 'order_' + Date.now(),
      user: user,
      payment: payment
    };
  } catch (error) {
    printError('order-error', error.message, 'ORDER_001');
    reply.code(400);
    return { error: error.message, isError: true };
  }
});

fastify.get('/error-demo', async (request, reply) => {
  printLog('route-accessed', '/error-demo');
  
  // Simular múltiples llamadas a funciones que hacen logging
  try {
    await getUserData('invalid');
  } catch (error) {
    // La función ya registró el error automáticamente
    printLog('error-handled', true);
  }
  
  reply.code(500);
  return { error: 'Demo error', isError: true };
});

// Ruta para mostrar compatibilidad hacia atrás
fastify.get('/backward-compatibility', async (request, reply) => {
  // Método tradicional (sigue funcionando)
  request.logger.add('traditional-method', 'funciona');
  
  // Nuevo método global
  printLog('global-method', 'también funciona');
  
  // Ambos aparecerán en el mismo log agrupado
  return { message: 'Ambos métodos funcionan' };
});

// Iniciando el servidor
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Servidor con contexto AsyncLocalStorage iniciado en http://localhost:3001');
    console.log('');
    console.log('✨ Nuevas funciones disponibles:');
    console.log('  - printLog(key, value)');
    console.log('  - printError(key, value, code)');
    console.log('  - getRequestLogger()');
    console.log('');
    console.log('🔗 Prueba estas rutas:');
    console.log('  - GET  http://localhost:3001/user/123');
    console.log('  - POST http://localhost:3001/process-order');
    console.log('       Body: {"userId": "123", "amount": 100}');
    console.log('  - GET  http://localhost:3001/error-demo');
    console.log('  - GET  http://localhost:3001/backward-compatibility');
    console.log('');
    console.log('✅ Todas las funciones auxiliares pueden hacer logging sin pasar parámetros');
    console.log('✅ Los logs se agrupan automáticamente por request');
    console.log('✅ Compatible con múltiples réplicas y alta concurrencia');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start(); 
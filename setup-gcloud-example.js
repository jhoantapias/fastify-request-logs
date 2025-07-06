const fastify = require('fastify')({ logger: false });
const { logger, printLog, printError } = require('./dist/index.js');

// 🔧 PASO 1: Configuración de Google Cloud Logging
// Reemplaza 'your-project-id' con tu Project ID real de Google Cloud
const GOOGLE_CLOUD_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id';

if (GOOGLE_CLOUD_PROJECT_ID === 'your-project-id') {
  console.log('🚨 ATENCIÓN: Debes configurar tu Google Cloud Project ID');
  console.log('');
  console.log('📋 Opciones:');
  console.log('  1. Set environment variable: export GOOGLE_CLOUD_PROJECT=tu-proyecto-real');
  console.log('  2. Replace "your-project-id" in this file with your actual project ID');
  console.log('');
  console.log('🔍 Para encontrar tu Project ID:');
  console.log('  - Ir a Google Cloud Console');
  console.log('  - O ejecutar: gcloud config get-value project');
  console.log('');
}

// 🔧 PASO 2: Verificar credenciales antes de inicializar
async function checkGoogleCloudSetup() {
  console.log('🔍 Verificando configuración de Google Cloud...');
  
  // Verificar que las credenciales estén disponibles
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/logging.write']
  });
  
  try {
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();
    
    console.log('✅ Credenciales encontradas');
    console.log('📝 Project ID detectado:', projectId);
    
    if (projectId !== GOOGLE_CLOUD_PROJECT_ID && GOOGLE_CLOUD_PROJECT_ID !== 'your-project-id') {
      console.log('⚠️  Advertencia: Project ID configurado vs detectado:');
      console.log('   Configurado:', GOOGLE_CLOUD_PROJECT_ID);
      console.log('   Detectado:  ', projectId);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error de credenciales:', error.message);
    console.log('');
    console.log('🔧 Para solucionarlo:');
    console.log('  1. Desarrollo local:');
    console.log('     gcloud auth application-default login');
    console.log('');
    console.log('  2. Producción:');
    console.log('     export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"');
    console.log('');
    console.log('  3. En Google Cloud (GKE, Cloud Run, etc.):');
    console.log('     Las credenciales se configuran automáticamente');
    console.log('');
    return false;
  }
}

// 🔧 PASO 3: Configurar el logger con Google Cloud Logging
logger(fastify, {
  only_errors: false,
  domain: 'test-app',
  service: 'demo',
  module: 'gcloud-setup',
  colors: false,  // Desactivar colores para Google Cloud
  useGCloudLogging: true,
  gcloudProjectId: GOOGLE_CLOUD_PROJECT_ID
});

// 🧪 PASO 4: Rutas de prueba
fastify.get('/test-success', async (request, reply) => {
  printLog('test-type', 'success-test');
  printLog('message', 'This is a successful request test');
  printLog('timestamp', new Date().toISOString());
  
  return { 
    status: 'success',
    message: 'Check Google Cloud Logging for this log entry',
    projectId: GOOGLE_CLOUD_PROJECT_ID,
    logName: 'test-app-demo-logs'
  };
});

fastify.get('/test-error', async (request, reply) => {
  printLog('test-type', 'error-test');
  printError('test-error', 'This is a test error', 'TEST_ERR_001');
  
  reply.code(500);
  return { 
    status: 'error',
    message: 'Check Google Cloud Logging for this error entry',
    isError: true
  };
});

// 🚀 PASO 5: Iniciar el servidor
const start = async () => {
  try {
    // Verificar configuración antes de iniciar
    const isSetupOk = await checkGoogleCloudSetup();
    
    if (!isSetupOk) {
      console.log('⚠️  Continuando con console.log como fallback...');
    }
    
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    
    console.log('');
    console.log('🚀 Servidor iniciado en http://localhost:3002');
    console.log('');
    console.log('🧪 Rutas de prueba:');
    console.log('  - GET http://localhost:3002/test-success');
    console.log('  - GET http://localhost:3002/test-error');
    console.log('');
    
    if (isSetupOk) {
      console.log('📊 Para ver los logs en Google Cloud:');
      console.log('  1. Ir a Google Cloud Console');
      console.log('  2. Navegar a "Logging" → "Logs Explorer"');
      console.log('  3. Filtrar por:');
      console.log(`     logName="projects/${GOOGLE_CLOUD_PROJECT_ID}/logs/test-app-demo-logs"`);
      console.log('');
      console.log('🔗 Link directo:');
      console.log(`  https://console.cloud.google.com/logs/query?project=${GOOGLE_CLOUD_PROJECT_ID}`);
    } else {
      console.log('💡 Los logs aparecerán en la consola hasta que configures Google Cloud');
    }
    
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
};

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

start(); 
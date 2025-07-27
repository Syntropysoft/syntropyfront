// Debug: Verificar qué está importando realmente
import syntropyFront from './syntropyfront.js';

console.log('🔍 DEBUG: Qué está importando syntropyFront?');
console.log('📊 Type:', typeof syntropyFront);
console.log('📊 Keys:', Object.keys(syntropyFront));
console.log('📊 Methods:', Object.getOwnPropertyNames(syntropyFront));
console.log('📊 Has addBreadcrumb:', typeof syntropyFront.addBreadcrumb);
console.log('📊 Has sendError:', typeof syntropyFront.sendError);
console.log('📊 Has getBreadcrumbs:', typeof syntropyFront.getBreadcrumbs);

// Test directo
try {
    syntropyFront.addBreadcrumb('test', 'Debug test');
    console.log('✅ addBreadcrumb funciona');
} catch (error) {
    console.error('❌ addBreadcrumb falló:', error);
} 
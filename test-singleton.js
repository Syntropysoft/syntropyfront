// Test simple para verificar la instancia singleton
const syntropyFront = require('./dist/index.cjs').default;

console.log('🔍 Testing SyntropyFront singleton...');
console.log('📊 Instance:', typeof syntropyFront);
console.log('📊 Is Active:', syntropyFront.isActive());
console.log('📊 Is Ready:', syntropyFront.isReady());
console.log('📊 Has init method:', typeof syntropyFront.init);
console.log('📊 Has addBreadcrumb method:', typeof syntropyFront.addBreadcrumb);
console.log('📊 Has sendError method:', typeof syntropyFront.sendError);

// Initialization test
async function testInit() {
    try {
        console.log('\n🚀 Testing initialization...');
        await syntropyFront.init({ preset: 'debug' });
        console.log('✅ Initialization successful');
        console.log('📊 Is Active after init:', syntropyFront.isActive());
        
        // Test de breadcrumb
        syntropyFront.addBreadcrumb('test', 'Singleton test successful');
        console.log('✅ Breadcrumb added successfully');
        
        // Test de error
        syntropyFront.sendError(new Error('Test error'));
        console.log('✅ Error sent successfully');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testInit(); 
// Simple test to verify SyntropyFront import
import syntropyFront from './syntropyfront.js';

console.log('🧪 Simple test: syntropyFront import');
console.log('📊 syntropyFront:', syntropyFront);
console.log('📊 Type:', typeof syntropyFront);
console.log('📊 Has isActive:', typeof syntropyFront?.isActive);
console.log('📊 Has init:', typeof syntropyFront?.init);

// Test basic functionality
if (syntropyFront && typeof syntropyFront.isActive === 'function') {
    console.log('✅ syntropyFront.isActive is a function');
    console.log('📊 Is Active:', syntropyFront.isActive());
} else {
    console.error('❌ syntropyFront.isActive is not a function');
}

if (syntropyFront && typeof syntropyFront.init === 'function') {
    console.log('✅ syntropyFront.init is a function');
} else {
    console.error('❌ syntropyFront.init is not a function');
}

if (syntropyFront && typeof syntropyFront.addBreadcrumb === 'function') {
    console.log('✅ syntropyFront.addBreadcrumb is a function');
} else {
    console.error('❌ syntropyFront.addBreadcrumb is not a function');
} 
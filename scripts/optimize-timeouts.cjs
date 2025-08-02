#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuración de optimización
const OPTIMIZATIONS = {
  // Reducir timeouts de 5000ms a 500ms
  '5000': '500',
  '10000': '1000',
  // Reducir timeouts de 1000ms a 500ms para tests
  'batchTimeout: 1000': 'batchTimeout: 500',
  'batchTimeout: 5000': 'batchTimeout: 1000',
  // Optimizar timeouts de Stryker
  'timeoutMS": 5000': 'timeoutMS": 500',
  'timeoutMS": 10000': 'timeoutMS": 1000'
};

// Archivos a optimizar
const FILES_TO_OPTIMIZE = [
  'tests/retryManager.test.js',
  'tests/queueManager.test.js',
  'tests/configurationManager.test.js',
  'tests/agent-refactored.test.js',
  'tests/agent.test.js',
  'stryker.quick.conf.json',
  'stryker.conf.json'
];

function optimizeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changes = 0;

  // Aplicar optimizaciones
  for (const [oldValue, newValue] of Object.entries(OPTIMIZATIONS)) {
    const regex = new RegExp(oldValue, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newValue);
      changes += matches.length;
      console.log(`  🔄 ${oldValue} → ${newValue} (${matches.length} times)`);
    }
  }

  // Escribir archivo si hubo cambios
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Optimized ${filePath} (${changes} changes)`);
  } else {
    console.log(`⏭️  No changes needed for ${filePath}`);
  }
}

function main() {
  console.log('🚀 Optimizing timeouts for faster test execution...\n');

  FILES_TO_OPTIMIZE.forEach(file => {
    console.log(`📁 Processing ${file}:`);
    optimizeFile(file);
    console.log('');
  });

  console.log('✨ Timeout optimization complete!');
  console.log('\n📋 Summary of optimizations:');
                console.log('  • Reduced test timeouts from 5000ms to 500ms');
              console.log('  • Reduced batch timeouts from 1000ms to 500ms');
              console.log('  • Reduced Stryker timeout from 5000ms to 500ms');
              console.log('  • Reduced retry delays from 10000ms to 1000ms');
}

if (require.main === module) {
  main();
}

module.exports = { optimizeFile, OPTIMIZATIONS }; 
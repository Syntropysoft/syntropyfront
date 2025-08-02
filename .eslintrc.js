module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Reglas de calidad de código
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': 'off', // Permitimos console para logging
    'no-debugger': 'error',
    'no-alert': 'error',
    
    // Reglas de estilo
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Reglas de buenas prácticas
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    
    // Reglas específicas para el proyecto
    'no-magic-numbers': ['warn', { 'ignore': [0, 1, -1] }],
    'max-len': ['warn', { 'code': 120 }],
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    
    // Reglas de documentación
    'valid-jsdoc': 'warn',
    'require-jsdoc': 'off'
  },
  overrides: [
    {
      // Configuración específica para tests
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-magic-numbers': 'off',
        'max-len': 'off'
      }
    }
  ]
}; 
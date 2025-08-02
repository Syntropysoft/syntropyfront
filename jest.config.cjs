module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(flatted)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/examples/**',
    '!**/*.config.js'
  ],
  coverageReporters: ['text', 'json', 'html'],
  coverageDirectory: 'coverage',
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/*.test.js'
  ],
      testPathIgnorePatterns: [
        '<rootDir>/tests/agent.test.js',
        '<rootDir>/tests/persistentBufferManager.test.js'
    ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true
}; 
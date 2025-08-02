# Changelog

All notable changes to SyntropyFront will be documented in this file.

## [0.2.3] - 2024-08-02

### 🎉 Major Refactoring & Architecture Improvements

#### 🏗️ **Architecture Overhaul**
- **Complete SRP Refactoring**: Broke down monolithic classes into focused, single-responsibility components
- **Modular Structure**: Reorganized codebase into logical folders for better maintainability
- **Dependency Injection**: Implemented proper dependency injection patterns throughout the codebase

#### 📁 **New Folder Structure**
```
src/core/
├── agent/           # Core Agent components
├── database/        # IndexedDB management  
├── retry/           # Retry system
├── persistent/      # Persistent buffer
├── breadcrumbs/     # Event tracking
├── context/         # Context collection
└── utils/           # Utilities
```

#### 🔧 **Component Refactoring**

##### **Agent.js** → Coordinator Pattern
- **Before**: Monolithic class handling configuration, queuing, HTTP, retries, and persistence
- **After**: Coordinator that delegates to specialized managers
- **New Components**:
  - `ConfigurationManager.js` - Configuration handling
  - `QueueManager.js` - Batching and queuing logic
  - `HttpTransport.js` - HTTP communication
  - `RetryManager.js` - Retry coordination
  - `PersistentBufferManager.js` - Buffer management

##### **DatabaseManager.js** → Specialized Managers
- **Before**: Single class handling connection, configuration, and transactions
- **After**: Coordinator with specialized managers
- **New Components**:
  - `DatabaseConfigManager.js` - Configuration and validation
  - `DatabaseConnectionManager.js` - Connection lifecycle
  - `DatabaseTransactionManager.js` - Transaction management

##### **StorageManager.js** → Pure CRUD + Serialization
- **Before**: Mixed CRUD operations with serialization logic
- **After**: Pure CRUD operations with separate serialization manager
- **New Component**: `SerializationManager.js` - Declarative serialization with error handling

##### **PersistentBufferManager.js** → Coordinator Pattern
- **Before**: Direct IndexedDB operations
- **After**: Coordinator delegating to specialized components
- **New Component**: `RetryLogicManager.js` - Retry logic and cleanup

#### 🧪 **Testing Improvements**

##### **Comprehensive Test Suite**
- **Total Tests**: 484 tests (1 skipped)
- **Test Coverage**: 92.22% (up from ~80%)
- **Mutation Score**: 77.60% (up from 68.55%)
- **New Test Files**: 15+ new test files for refactored components

##### **Test Organization**
- **Component-Specific Tests**: Each new component has dedicated test file
- **Mock Improvements**: Better mocking strategies for IndexedDB and HTTP
- **Timeout Optimization**: Reduced test timeouts for faster execution (500ms vs 5000ms)

#### 🚀 **Performance Optimizations**

##### **Timeout Optimizations**
- **Test Timeouts**: Reduced from 5000ms to 500ms
- **Batch Timeouts**: Reduced from 1000ms to 500ms  
- **Stryker Timeouts**: Optimized for faster mutation testing
- **Build Speed**: Improved compilation time (153ms vs ~200ms)

##### **Memory & Processing**
- **Queue Management**: Optimized batching and flushing logic
- **Retry System**: Improved exponential backoff implementation
- **Serialization**: More efficient circular reference handling

#### 🔍 **Quality Assurance**

##### **Mutation Testing Results**
- **Overall Score**: 77.60% (excellent)
- **Perfect Scores (100%)**:
  - `ConfigurationManager.js`
  - `BreadcrumbManager.js` 
  - `BreadcrumbStore.js`
  - `SerializationManager.js`
  - `DatabaseTransactionManager.js`
  - `ErrorManager.js`
  - `Logger.js`

##### **Code Quality Metrics**
- **Statements**: 92.22% covered
- **Branches**: 87.94% covered
- **Functions**: 92.24% covered
- **Lines**: 92.35% covered

#### 🛠️ **Developer Experience**

##### **CI/CD Pipeline**
- **GitHub Actions**: Automated testing, linting, and mutation testing
- **Quality Gates**: Automated PR comments with coverage and mutation scores
- **Artifact Uploads**: Test reports and coverage data
- **Auto-Issues**: Automatic issue creation for low mutation scores

##### **Code Quality Tools**
- **ESLint**: Comprehensive linting rules
- **Jest**: Optimized test configuration
- **Stryker**: Mutation testing with quick and full configurations
- **Codecov**: Coverage reporting and visualization

#### 📦 **Infrastructure**

##### **Build System**
- **Rollup**: Optimized bundling configuration
- **Multiple Formats**: ES modules, CommonJS, and minified versions
- **Tree Shaking**: Improved dead code elimination

##### **Package Management**
- **Removed NPM Release Script**: Cleaner package.json
- **Updated Dependencies**: Latest stable versions
- **Type Module**: Proper ES module configuration

#### 🔧 **Configuration & Scripts**

##### **New NPM Scripts**
```json
{
  "test": "jest",
  "test:coverage": "jest --config jest.config.coverage.cjs",
  "test:mutation": "stryker run",
  "test:mutation:quick": "stryker run stryker.quick.conf.json",
  "lint": "eslint src --ext .js",
  "lint:fix": "eslint src --ext .js --fix"
}
```

##### **Configuration Files**
- **Jest Configs**: Separate configs for tests and coverage
- **Stryker Configs**: Quick and full mutation testing configs
- **ESLint Config**: Comprehensive code quality rules

#### 🐛 **Bug Fixes**
- **Import Path Issues**: Fixed all import paths after refactoring
- **Test Mocking**: Improved IndexedDB and HTTP mocking
- **Timeout Issues**: Resolved test timing problems
- **Circular Dependencies**: Eliminated circular import issues

#### 📚 **Documentation**
- **Updated README**: New architecture section and updated metrics
- **API Documentation**: Improved method documentation
- **Examples**: Enhanced usage examples
- **Changelog**: Comprehensive change tracking

### 🎯 **Breaking Changes**
- **Import Paths**: Updated import paths for refactored components
- **Configuration**: Some internal configuration methods changed
- **API**: Public API remains stable, internal structure improved

### 🚀 **Migration Guide**
No migration required for end users. All public APIs remain unchanged.

---

## [0.2.2] - 2024-08-01

### 🐛 Bug Fixes
- Fixed IndexedDB connection issues in some browsers
- Improved error handling for network failures
- Enhanced console logging for debugging

### 📈 Performance
- Optimized memory usage for large event collections
- Improved serialization performance

---

## [0.2.1] - 2024-07-31

### ✨ New Features
- Added persistent buffer for failed requests
- Implemented exponential backoff retry mechanism
- Enhanced error context collection

### 🔧 Improvements
- Better handling of circular references in serialization
- Improved fetch interception reliability
- Enhanced breadcrumb data structure

---

## [0.2.0] - 2024-07-30

### 🎉 Major Release
- Complete rewrite with modular architecture
- Improved error handling and context collection
- Enhanced configuration options
- Better browser compatibility

### ✨ New Features
- Automatic event capture (clicks, errors, HTTP, console)
- Flexible error posting (endpoint, custom handler, console)
- Configurable event limits
- Breadcrumb system for context

### 🔧 Technical Improvements
- ES6+ codebase
- Rollup bundling
- Comprehensive testing
- Better error messages

---

## [0.1.0] - 2024-07-29

### 🎉 Initial Release
- Basic error capture functionality
- Simple configuration system
- Console logging support
- Basic documentation

---

## Version History

- **0.2.3**: Major refactoring with SRP compliance and 77.60% mutation score
- **0.2.2**: Bug fixes and performance improvements
- **0.2.1**: Persistent buffer and retry mechanism
- **0.2.0**: Complete rewrite with modular architecture
- **0.1.0**: Initial release with basic functionality
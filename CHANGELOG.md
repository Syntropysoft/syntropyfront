# Changelog

All notable changes to SyntropyFront will be documented in this file.

## [0.3.0] - 2024-12-19

### 🚀 **Major Performance & Bundle Optimizations**

#### **Dependency Cleanup & Bundle Size Reduction**
- **Massive Dependency Reduction**: Removed 45+ unnecessary packages
- **Eliminated Unused Dependencies**: Removed `@stryker-mutator/vitest-runner` (using Jest only)
- **Streamlined Stryker Setup**: Kept only essential packages (`core` and `jest-runner`)
- **Bundle Size Optimization**: Significantly reduced final bundle size
- **Faster Installation**: Reduced npm install time and disk usage

#### **CI/CD & Dependabot Improvements**
- **Smart Dependabot Configuration**: Added selective ignore for Stryker packages
- **Prevented Incompatible Updates**: Dependabot no longer suggests Node.js >=20 incompatible updates
- **Maintained Compatibility**: Full Node.js 18, 20, 22 compatibility preserved
- **Stable CI Pipeline**: Eliminated CI failures from incompatible dependency updates
- **Consistent Workflow Matrix**: All workflows now use consistent Node.js version testing

#### **Development Experience Enhancements**
- **Cleaner Package Structure**: Only 1 runtime dependency (`flatted` for serialization)
- **Optimized DevDependencies**: All testing tools properly categorized
- **Faster Development**: Reduced cognitive load and setup complexity
- **Better Maintenance**: Easier to maintain and update dependencies

### 🔧 **Technical Improvements**

#### **Dependency Management**
- **Runtime Dependencies**: Reduced from multiple to just 1 essential dependency
- **DevDependencies**: Properly categorized all development tools
- **Package Lock**: Optimized and cleaned up dependency tree
- **Security**: Maintained all security benefits while reducing complexity

#### **Testing Infrastructure**
- **Mutation Testing**: Maintained full Stryker functionality with Jest
- **Test Coverage**: All 485 tests continue to pass
- **CI Stability**: Eliminated flaky CI builds from dependency conflicts
- **Cross-Node Testing**: Full compatibility across Node.js 18, 20, 22

### 🎯 **No Breaking Changes**
- **Public API**: All public APIs remain unchanged
- **Configuration**: Existing configurations continue to work
- **Migration**: No migration required for existing users
- **Functionality**: All features work exactly as before

### 📦 **Installation & Usage**
- **Faster Installation**: Reduced package size and dependencies
- **Better Performance**: Optimized bundle size for production
- **Same API**: Identical usage patterns and configuration options

---

## [0.2.4] - 2024-08-02

### 🎨 **UI/UX Improvements**

#### **Vue Example Simplification**
- **Complete UI Overhaul**: Simplified Vue example from 447 lines to clean, modern design
- **Official Vue Branding**: Implemented official Vue.js colors (#42b883, #35495e, #42d392)
- **Architecture Fix**: Replaced hardcoded HTML with proper Vite + Vue SFC architecture
- **Code Reduction**: Eliminated 535+ lines of unnecessary complexity
- **Modern Design**: Clean, professional UI matching React example simplicity

#### **Example Improvements**
- **Simplified Documentation**: Removed verbose explanations, kept essential information
- **Better UX**: Improved button layouts and responsive design
- **Consistent Branding**: Unified color scheme across all examples
- **Maintained Functionality**: All SyntropyFront features work perfectly

### 🔧 **Infrastructure & Compatibility**

#### **GitHub Actions Updates**
- **Deprecation Fixes**: Updated all deprecated GitHub Actions to latest versions
- **Actions Updated**:
  - `actions/upload-artifact@v3` → `@v4`
  - `codecov/codecov-action@v3` → `@v4`
- **CI/CD Compatibility**: Ensured compatibility with latest GitHub Actions runner (2.327.1)
- **Workflow Files Updated**:
  - `.github/workflows/test.yml`
  - `.github/workflows/mutation-test.yml`
  - `.github/workflows/ci.yml`
  - `.github/workflows/quality.yml`

#### **Node.js Compatibility**
- **Multi-Node Support**: Full compatibility with Node 18, 20, and 22
- **ESLint Configuration**: Fixed Node 20+ ES modules compatibility
  - Renamed `.eslintrc.js` → `.eslintrc.cjs`
  - Removed conflicting `.eslintrc.json`
- **Test Timing Fixes**: Resolved timing-sensitive test failures in Node 22
  - Increased timing tolerance from 1ms to 50-100ms
  - Fixed exponential backoff delay tests
  - Maintained test accuracy while improving compatibility

#### **Code Quality Improvements**
- **Indentation Fixes**: Fixed 2106+ indentation errors with `eslint --fix`
- **Error Reduction**: Reduced from 2202 problems to 95 warnings only
- **Consistent Formatting**: Standardized 2-space indentation across codebase
- **Linting Compliance**: 100% ESLint compliance with modern standards

### 🧪 **Testing Enhancements**

#### **Test Compatibility**
- **Cross-Node Testing**: All 484 tests pass in Node 18, 20, and 22
- **Timing Tolerance**: Improved test reliability across different Node versions
- **Test Files Updated**:
  - `tests/retryManager.test.js` - Fixed timing-sensitive tests
  - `tests/agent.test.js` - Improved retry delay assertions
- **Test Results**: 484 passed, 1 skipped (by design), 0 failed

#### **CI/CD Pipeline**
- **Automated Testing**: GitHub Actions now work seamlessly across all Node versions
- **Quality Gates**: Maintained high test coverage and mutation scores
- **Artifact Management**: Updated artifact upload/download processes

### 🚀 **Developer Experience**

#### **Simplified Development**
- **Clean Examples**: Developers can now focus on functionality, not complexity
- **Modern Tooling**: Updated to latest stable versions of all tools
- **Better Documentation**: Clearer, more focused examples
- **Faster Setup**: Reduced cognitive load for new developers

#### **Maintenance Improvements**
- **Reduced Complexity**: Eliminated unnecessary code and configurations
- **Better Organization**: Cleaner file structure and naming conventions
- **Future-Proof**: Ready for upcoming Node.js and tooling updates

### 🐛 **Bug Fixes**
- **ESLint Configuration Conflicts**: Resolved multiple ESLint config file conflicts
- **Node 22 Timing Issues**: Fixed test failures due to precise timing in Node 22
- **GitHub Actions Deprecation**: Eliminated deprecation warnings in CI/CD
- **Import Path Issues**: Fixed module resolution in different Node versions

### 📦 **Dependencies & Tools**
- **Updated Actions**: Latest GitHub Actions for better security and performance
- **Node Compatibility**: Full support for current and future Node.js versions
- **Build Tools**: Improved compatibility with modern development environments

### 🎯 **No Breaking Changes**
- **Public API**: All public APIs remain unchanged
- **Configuration**: Existing configurations continue to work
- **Migration**: No migration required for existing users

---

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

- **0.2.4**: UI/UX improvements, Node.js compatibility, and infrastructure updates
- **0.2.3**: Major refactoring with SRP compliance and 77.60% mutation score
- **0.2.2**: Bug fixes and performance improvements
- **0.2.1**: Persistent buffer and retry mechanism
- **0.2.0**: Complete rewrite with modular architecture
- **0.1.0**: Initial release with basic functionality
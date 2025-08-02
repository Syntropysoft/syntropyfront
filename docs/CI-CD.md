# 🚀 CI/CD Pipeline Documentation

## Overview

Our CI/CD pipeline ensures code quality through automated testing, linting, coverage analysis, and mutation testing.

## Workflows

### 1. Quality Assurance (`quality.yml`)
- **Triggers**: Push to main/develop, PRs, manual
- **Runs**: Tests, linting, coverage analysis
- **Node versions**: 18.x, 20.x
- **Output**: Coverage reports, PR comments

### 2. Mutation Testing (`mutation-test.yml`)
- **Triggers**: Push to main/develop, PRs, manual
- **Runs**: Mutation testing with Stryker
- **Node version**: 18.x
- **Output**: Mutation reports, PR comments, auto-issues for low scores

## Quality Gates

### Coverage Thresholds
- **Lines**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Statements**: 80%

### Mutation Score Thresholds
- **Excellent**: ≥90% 🏆
- **Good**: 80-89% 🟡
- **Acceptable**: 70-79% ✅
- **Needs Improvement**: <70% ⚠️

## Commands

### Local Development
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run mutation testing (full)
npm run test:mutation

# Run mutation testing (quick)
npm run test:mutation:quick
```

### CI/CD Commands
```bash
# Install dependencies
npm ci

# Run all quality checks
npm run lint && npm test && npm run test:coverage
```

## Artifacts

### Coverage Reports
- **Location**: `coverage/`
- **Formats**: HTML, LCOV, JSON
- **Upload**: Codecov integration

### Mutation Reports
- **Location**: `reports/mutation/`
- **Formats**: HTML, console
- **Retention**: 90 days
- **Upload**: GitHub Actions artifacts

## Configuration Files

### ESLint
- **File**: `.eslintrc.js`
- **Rules**: Code quality, style, best practices
- **Overrides**: Test-specific rules

### Jest Coverage
- **File**: `jest.config.coverage.js`
- **Thresholds**: 80% for all metrics
- **Exclusions**: Tests, examples, entry points

### Stryker Quick
- **File**: `stryker.quick.conf.json`
- **Optimized**: For CI/CD speed
- **Concurrency**: 1 runner
- **Timeout**: 5 seconds

## PR Comments

### Coverage Comment
```
## 📊 Test Coverage Results

**Total Coverage: 85.2%**

📈 Lines: 85.2% (1234/1450)
🌿 Branches: 82.1% (456/555)
🔧 Functions: 88.9% (234/263)
```

### Mutation Comment
```
## ✅ Mutation Testing Results

**Score: 72.58%** - Good

📊 View detailed report
📁 Download artifacts
```

## Auto-Issues

When mutation score < 70%, the pipeline automatically creates an issue with:
- Current score
- Action items checklist
- Link to PR
- Quality labels

## Secrets

### Required Secrets
- `STRYKER_DASHBOARD_API_KEY`: For Stryker dashboard integration

### Optional Secrets
- Codecov token (auto-detected)

## Troubleshooting

### Common Issues

1. **Low Coverage**
   - Add missing test cases
   - Review uncovered lines
   - Check exclusion patterns

2. **Low Mutation Score**
   - Review surviving mutants
   - Improve test assertions
   - Add edge case tests

3. **Linting Errors**
   - Run `npm run lint:fix`
   - Review ESLint configuration
   - Check for new rules

### Performance Optimization

1. **Mutation Testing Slow**
   - Use `test:mutation:quick`
   - Enable `ignoreStatic`
   - Reduce concurrency

2. **Coverage Generation Slow**
   - Exclude unnecessary files
   - Use coverage thresholds
   - Cache node_modules

## Best Practices

1. **Always run tests locally before pushing**
2. **Keep mutation score above 70%**
3. **Address linting issues promptly**
4. **Review coverage reports regularly**
5. **Use meaningful commit messages**

## Support

For CI/CD issues:
1. Check workflow logs
2. Review configuration files
3. Test locally first
4. Create issue with logs 
# Mutation Testing with Stryker

## What is Mutation Testing?

Mutation testing is a technique that evaluates the quality of your tests by introducing small changes (mutations) in your code and verifying if your tests can detect these changes. If a mutation "survives" (is not detected), it means your tests are not properly validating that part of the code.

## Available Commands

### Complete Execution
```bash
npm run test:mutation
```
- Runs complete mutation testing on all code
- Generates HTML report in `reports/mutation/mutation.html`
- Estimated time: 30-60 seconds

### Quick Execution (Development)
```bash
npm run test:mutation:quick
```
- Runs mutation testing with development-optimized configuration
- Less concurrent but faster
- Estimated time: 15-30 seconds

### Watch Mode
```bash
npm run test:mutation:watch
```
- Runs mutation testing in watch mode
- Useful for iterative development

## Understanding Results

### Mutation Score
- **High (70%+)**: Excellent test coverage
- **Medium (40-70%)**: Acceptable coverage, room for improvement
- **Low (<40%)**: Needs significant test improvements

### Types of Mutations
- **Killed**: ✅ Mutation detected by tests (good)
- **Survived**: ❌ Mutation not detected (needs better test)
- **No Coverage**: ⚠️ Code not covered by tests
- **Timeout**: ⏰ Test took too long to execute

## Improvement Strategy

1. **Focus on "Survived" mutations**: These indicate code that is not well tested
2. **Prioritize critical code**: Core functionalities should have high coverage
3. **Write functional tests**: Not just coverage tests, but tests that validate real behavior
4. **Use the HTML report**: Provides specific details about each mutation

## Configuration

The `stryker.conf.json` file contains the configuration:
- **Mutate**: JavaScript files in `src/` (excludes tests)
- **Test Runner**: Jest
- **Reporters**: HTML, clear text, progress
- **Thresholds**: Quality thresholds configured

## Workflow Integration

### Before Commit
```bash
npm run test && npm run test:mutation:quick
```

### Before Release
```bash
npm run test && npm run test:mutation
```

## Tips

1. **Don't obsess over 100%**: Some mutations can be false positives
2. **Focus on business logic**: Prioritize tests for critical functionalities
3. **Use watch mode**: For iterative development
4. **Review the HTML report**: Provides detailed context about each mutation

## Troubleshooting

### Node.js Error
If you see Node.js version errors, make sure to use Node.js 18+:
```bash
source ~/.nvm/nvm.sh && nvm use 18
```

### Failing Tests
If tests fail during mutation testing:
1. Verify that all tests pass normally: `npm test`
2. Check Jest configuration in `jest.config.cjs`
3. Adjust `timeoutMS` in `stryker.conf.json` if necessary 
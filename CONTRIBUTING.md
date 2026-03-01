# Contributing to SyntropyFront

Thank you for your interest in contributing to SyntropyFront! We welcome contributions from the community to help make this observability library even better.

## Development Workflow

### Prerequisites

- Node.js >= 20.0.0
- pnpm

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Syntropysoft/syntropyfront.git
   cd syntropyfront
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Running Tests

We maintain high quality through extensive testing. Please ensure all tests pass before submitting a pull request.

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Run mutation testing (Stryker)
pnpm run test:mutation
```

### Linting

We use ESLint to maintain code style and quality.

```bash
# Run linter
pnpm run lint

# Fix linting issues automatically
pnpm run lint:fix
```

### Building

To build the library:

```bash
pnpm run build
```

## Pull Request Process

1. Create a new branch for your feature or bug fix.
2. Ensure your code follows the existing style and is well-tested.
3. Update the `README.md` or documentation if applicable.
4. Submit a pull request with a clear description of the changes.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).

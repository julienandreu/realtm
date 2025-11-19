# Contributing to realtm

Thank you for your interest in contributing to realtm! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 24.11.1
- npm or yarn
- Git
- Redis server (for stream processing)

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/realtm.git
   cd realtm
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Start Redis**

   ```bash
   # Using Docker (recommended)
   npm run redis:start

   # Or use your own Redis instance
   # Make sure Redis is running and accessible
   ```

4. **Build the Project**

   ```bash
   npm run build
   ```

5. **Run Tests**

   ```bash
   npm test
   ```

6. **Run Development Mode**

   ```bash
   # Start server
   npm run dev server

   # Start client (in another terminal)
   npm run dev client tag1 tag2
   ```

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feat/add-new-event-type` - for new features
- `fix/handle-disconnection-edge-case` - for bug fixes
- `docs/update-readme` - for documentation
- `refactor/optimize-stream-processing` - for refactoring

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect code meaning (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

**Examples:**

```bash
feat: add support for custom event types
fix: handle socket disconnection during stream processing
docs: add examples for client reconnection
test: add integration tests for Redis stream processing
```

## Pull Request Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make Changes**
   - Write code following our [coding standards](#coding-standards)
   - Add tests for new functionality
   - Update documentation as needed

3. **Validate Your Changes**

   ```bash
   npm run validate
   ```

   This runs:
   - Type checking
   - Linting
   - Formatting check
   - All tests

4. **Commit Changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to Fork**

   ```bash
   git push origin feat/your-feature-name
   ```

6. **Create Pull Request**
   - Use our PR template
   - Link to any related issues
   - Provide clear description of changes
   - Add screenshots if applicable

### PR Requirements

- [ ] All tests pass
- [ ] Code coverage maintained/improved
- [ ] Documentation updated
- [ ] Commit messages follow conventional format
- [ ] No breaking changes (unless justified)
- [ ] Self-review completed

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer explicit types over `any`
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Code Style

We use ESLint and Prettier for consistent code style:

```bash
# Auto-fix linting issues
npm run lint

# Format code
npm run format
```

### File Structure

```
src/
├── presentation/       # Entry points and presentation layer
│   ├── main.ts        # Main CLI entry point
│   ├── server.ts      # Server initialization
│   └── client.ts      # Client initialization
├── application/        # Application services (business logic)
│   └── services/
│       ├── event.service.ts
│       ├── socket-manager.service.ts
│       └── stream.service.ts
├── domain/             # Domain layer (types, constants, errors)
│   ├── constants/
│   ├── errors/
│   └── types/
└── infrastructure/     # Infrastructure layer (repositories, config, IoC)
    ├── config/
    ├── debug/
    ├── ioc/
    ├── middlewares/
    └── repositories/
```

## Testing

### Test Structure

```
tests/
├── unit/               # Unit tests
│   ├── *.test.ts
├── integration/        # Integration tests
│   ├── *.test.ts
└── fixtures/           # Test data
    ├── *.json
```

### Writing Tests

- Use Vitest for testing
- Write descriptive test names
- Test edge cases and error conditions
- Maintain test coverage above 80%

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest run generator.test.ts
```

## Documentation

### Code Documentation

- Add JSDoc comments to public APIs
- Include examples in documentation
- Document complex algorithms and business logic
- Use debug namespaces for logging (see `src/infrastructure/debug/debug-namespaces.ts`)

### README Updates

If your changes affect usage, update the README:

- Add new examples
- Update installation instructions
- Document new environment variables
- Update configuration section

## Getting Help

- 📚 Check existing [documentation](README.md)
- 🐛 Search [existing issues](https://github.com/julienandreu/realtm/issues)
- 💬 Start a [discussion](https://github.com/julienandreu/realtm/discussions)
- 📧 Email: [julienandreu@me.com](mailto:julienandreu@me.com)

## Recognition

Contributors are recognized in our:

- Contributors section
- Acknowledgments

Thank you for contributing! 🙏

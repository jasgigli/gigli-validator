# Contributing to Gigli

Thank you for considering contributing to Gigli! Your help is greatly appreciated.

## How to Contribute

1. **Fork the repository**
2. **Create a new branch** for your feature or bugfix
3. **Write your code** and add unit tests
4. **Run tests** to ensure everything passes: `npm test`
5. **Submit a pull request** with a clear description of your changes

## Development Setup

- Clone your fork: `git clone https://github.com/jasgigli/gigli-validator.git`
- Install dependencies: `npm install`
- Build the project: `npm run build`
- Run tests: `npm test`

## Project Structure

- `src/` — Source code organized modularly into core schema builders, security guards, AST compiler, codegen, and CLI modules
- `tests/` — Comprehensive Vitest test suite and integration tests
- `dist/` — Built CommonJS and ESM outputs

## Coding Standards

- Use TypeScript for all source files
- Maintain zero runtime third-party dependencies
- Provide full test coverage for any new features or bug fixes
- Keep APIs consistent with existing builder patterns (`v.<type>()`)

## Pull Requests

- Keep PRs focused and small
- Reference related issues in your PR description
- Ensure all build and test verification steps pass

## Reporting Issues

- Use GitHub Issues to report bugs or request features
- Include complete steps to reproduce, expected vs actual behavior, and code snippets where relevant

## Community

- Be respectful and follow our [Code of Conduct](CODE_OF_CONDUCT.md)

Thank you for helping make Gigli better!

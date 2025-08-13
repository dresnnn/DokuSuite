# AGENTS Instructions

These instructions apply to the entire repository.

## Documentation

Planning and specification documents live in the [`docs/`](docs/README.md) directory. The [docs/README.md](docs/README.md) file lists vision, requirements, architecture, data model, and other project documentation for each subdomain. Update the relevant documents when code changes affect specifications or goals.

## Development Guidelines

- Keep code organised within existing folders (`apps`, `packages`, `infra`).
- Follow language-appropriate style conventions (PEP 8 for Python, Prettier/ESLint for JavaScript/TypeScript, Xcode conventions for Swift).
- Use type hints and add or update unit tests alongside code changes.

## Dependency Management

Always install or resolve project dependencies before running checks:

- **JavaScript/TypeScript**: `npm install` in the relevant directory.
- **Python**: `pip install -r requirements.txt` or `pipenv install`.
- **iOS/Swift**: `swift package resolve` or `pod install` where applicable.

## Linting

Run linters before committing:

- **JavaScript/TypeScript**: `npm run lint`.
- **Python**: `ruff` or `flake8`.
- **iOS/Swift**: `swiftlint`.

## Testing

Run tests before committing:

- **Python**: `pytest` (e.g. `pytest apps/server/tests`).
- **JavaScript/TypeScript**: `npm test` inside the relevant project directory.
- **iOS/Swift**: `xcodebuild test` where applicable.

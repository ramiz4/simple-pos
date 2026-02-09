# Contributing to Simple POS

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning and releases.

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature (triggers **minor** version bump: 0.1.0 → 0.2.0)
- `fix`: A bug fix (triggers **patch** version bump: 0.1.0 → 0.1.1)
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code refactoring without feature changes
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates
- `ci`: CI/CD configuration changes

### Breaking Changes

Add `!` after the type or `BREAKING CHANGE:` in the footer to trigger a **major** version bump (0.1.0 → 1.0.0):

```
feat!: redesign authentication system

BREAKING CHANGE: The old login API has been removed
```

### Examples

```bash
# Feature (minor bump)
git commit -m "feat(pos): add dark mode support"
git commit -m "feat(api): add authentication endpoints"

# Bug fix (patch bump)
git commit -m "fix(pos): resolve cart calculation error"
git commit -m "fix(api): fix CORS configuration"

# Breaking change (major bump)
git commit -m "feat(pos)!: migrate to new database schema"

# No release
git commit -m "docs: update README installation steps"
git commit -m "chore(deps): update dependencies"
```

### Scopes

Use the following scopes to indicate which part of the monorepo is affected:

- `pos` - Angular POS frontend
- `api` - NestJS backend API
- `native` - Tauri desktop application
- `domain` - Domain logic library
- `shared-types` - Shared types library
- `shared-utils` - Shared utilities library
- `deps` - Dependencies updates

## Release Process

Releases are **fully automated**:

1. **Commit with conventional format** to a feature branch
2. **Create PR** to `main`
3. **Merge PR** to `main`
4. **Semantic-release runs automatically**:
   - Analyzes commits since last release
   - Determines version bump
   - Updates version in `package.json`, `tauri.conf.json`, `Cargo.toml`
   - Creates git tag (e.g., `v0.2.0`)
   - Generates `CHANGELOG.md`
   - Triggers release workflow
5. **Release workflow builds and publishes**:
   - Builds desktop app for all platforms
   - Signs the release
   - Creates GitHub Release with artifacts

### Manual Release (Emergency Only)

If you need to create a release manually:

```bash
git tag v0.2.0
git push origin v0.2.0
```

This will trigger the release workflow without semantic-release.

## Development Workflow

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make changes and commit with conventional format
3. Push and create PR
4. After PR approval, merge to `main`
5. Automated release will run if commits warrant a version bump

## Questions?

- [Conventional Commits Spec](https://www.conventionalcommits.org/)
- [Semantic Release Docs](https://semantic-release.gitbook.io/)

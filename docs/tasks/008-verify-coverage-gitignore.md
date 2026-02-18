# Task: Verify and Fix `coverage/` Gitignore

## Description

The workspace tree shows a `coverage/` directory with full HTML reports, coverage JSON, and per-project subdirectories. If this directory is tracked by git, it inflates the repository with regeneratable build artifacts, slows clones, and creates noisy diffs on every test run.

## Status

- **Identified**: February 13, 2026
- **Status**: Completed
- **Priority**: Low-Medium
- **Effort**: Trivial
- **Completed**: February 18, 2026

## Recommended Agent

- **Agent**: `devops-engineer`

## Current State

### Coverage Directory Contents

```
coverage/
├── apps/
│   ├── api/
│   │   ├── index.html
│   │   ├── coverage-final.json
│   │   ├── clover.xml
│   │   └── [per-module HTML reports]
│   └── pos/
│       ├── index.html
│       ├── coverage-summary.json
│       └── [per-module HTML reports]
└── libs/
    ├── domain/
    │   ├── index.html
    │   ├── coverage-final.json
    │   └── [per-file HTML reports]
    └── shared/
        └── [coverage reports]
```

### Gitignore Check Required

The `.gitignore` has sections for compiled output but may not explicitly exclude `coverage/`.

## Proposed Solution

### Step 1: Check if `coverage/` is Tracked

```bash
git ls-files --cached coverage/ | head -20
```

If output is non-empty, the directory is tracked.

### Step 2: Add to `.gitignore`

Ensure these entries exist in `.gitignore`:

```gitignore
# ============================================
# Test Coverage Reports
# ============================================
/coverage
*.lcov
```

### Step 3: Remove from Git Index (if tracked)

```bash
git rm -r --cached coverage/
git commit -m "chore: remove tracked coverage reports from git"
```

### Step 4: Verify

```bash
git status  # coverage/ should not appear
pnpm test:ci:coverage  # regenerate to confirm it's ignored
git status  # should still not appear
```

## Also Verify These Directories

While reviewing, confirm these other generated directories are also properly gitignored:

| Directory                       | Should Be Ignored | Purpose               |
| ------------------------------- | ----------------- | --------------------- |
| `coverage/`                     | Yes               | Test coverage reports |
| `dist/`                         | Yes               | Build output          |
| `.nx/`                          | Yes               | Nx cache              |
| `.angular/`                     | Yes               | Angular CLI cache     |
| `.pnpm-store/`                  | Yes               | pnpm local store      |
| `node_modules/`                 | Yes               | Dependencies          |
| `out-tsc/`                      | Yes               | TypeScript output     |
| `apps/native/src-tauri/target/` | Yes               | Rust build artifacts  |

## Acceptance Criteria

- [ ] `coverage/` directory is listed in `.gitignore`
- [ ] `coverage/` is not tracked in git (`git ls-files --cached coverage/` returns empty)
- [ ] Other generated directories are confirmed to be gitignored
- [ ] Running `pnpm test:ci:coverage` does not create any uncommitted file changes

## References

- [Git - gitignore Documentation](https://git-scm.com/docs/gitignore)

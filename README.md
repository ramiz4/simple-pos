# Simple POS

A production-ready, cross-platform Point-of-Sale system built with **Angular**, **Tauri**, and **NestJS** in an **Nx Monorepo**.

## 🍽️ For Restaurant Owners

If you are a restaurant owner looking to set up Simple POS for your business, please follow our **[Restaurant Owner's Guide](docs/restaurant-owner-guide.md)** for a step-by-step walkthrough of installation, setup, and daily operations.

### Quick Start for Owners:

1. **Download** the app for your system (see below).
2. **Install & Open** the application.
3. **Follow the Setup Wizard** to create your owner profile and set your secure PIN.
4. **Add your Products & Tables** in the Admin Dashboard.

## 📥 Downloads

You can find the latest version for your operating system on our [GitHub Releases](https://github.com/ramiz4/simple-pos/releases/latest) page.

| Operating System          | File Extension        | Description                                     |
| :------------------------ | :-------------------- | :---------------------------------------------- |
| **Windows**               | `_x64-setup.exe`      | Standard Installer (**Recommended**)            |
|                           | `_x64_en-US.msi`      | Microsoft Installer (for Enterprise/Management) |
| **macOS (Apple Silicon)** | `_aarch64.dmg`        | Standard Disk Image (**Recommended**)           |
|                           | `_aarch64.app.tar.gz` | Portable Binary                                 |
| **Linux (Universal)**     | `_amd64.AppImage`     | Universal Format (No installation required)     |
| **Linux (Debian/Ubuntu)** | `_amd64.deb`          | Native Package for Ubuntu/Debian                |
| **Linux (Fedora/RHEL)**   | `.x86_64.rpm`         | Native Package for RedHat/Fedora/CentOS         |

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 20+
- **pnpm**: 10+
- **Rust**: 1.93+ (for desktop development)

### Installation

```bash
pnpm install
# Set up environment variables
cp apps/api/.env.example apps/api/.env
```

### Development Commands

| Command          | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `pnpm dev`       | Start full stack (POS Frontend + API Backend)              |
| `pnpm pos:dev`   | Start POS Frontend only (Web Mode - http://localhost:4200) |
| `pnpm api:dev`   | Start API Backend only (http://localhost:3000/api)         |
| `pnpm tauri:dev` | Start Desktop App (Native Mode)                            |
| `pnpm test`      | Run tests across the workspace                             |
| `pnpm nx graph`  | Visualize project dependencies                             |

---

## 🏗️ Project Architecture

This project follows **Clean Architecture** principles and uses a **Dual Repository Pattern** to support both web (IndexedDB) and desktop (SQLite) persistence.

### Workspace Structure (`/`)

- **apps/**
  - `pos`: Angular frontend (UI, Application, Infrastructure layers)
  - `api`: NestJS backend (API endpoints, Auth, Multi-tenancy)
  - `native`: Tauri host application
- **libs/**
  - `domain`: Pure business logic and rules (Platform agnostic)
  - `shared/types`: Shared interfaces, enums, and DTOs
  - `shared/utils`: Common utilities (Date, Formatting, Validation)

### Dependency Flow

`UI` → `Application` → `Domain` ← `Infrastructure`

---

## 🛡️ Best Practices & Standards

### Coding Standards

- **State Management**: Use **Angular Signals** (`signal`, `computed`, `effect`) over Observables for synchronous state.
- **Components**: Use **Standalone Components** exclusively.
- **Type Safety**: strict mode, no `any`, explicit return types.
- **Async**: Use `async/await` with try/catch blocks.

### Database & Persistence

- **Dual Repositories**: Every entity needing local storage must have:
  - `sqlite-*.repository.ts` (Desktop)
  - `indexeddb-*.repository.ts` (Web)
- **Selection**: Logic is handled via `RepositoryFactory` and `PlatformService`.

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

**Scopes**: `pos`, `api`, `native`, `domain`, `shared-types`
**Examples**:

- `feat(pos): add receipt printing`
- `fix(api): correct jwt validation logic`

---

## Troubleshooting

### macOS: "App is damaged and can't be opened"

If you see this error when trying to run the app on macOS, it's because the app
is not signed with an Apple Developer ID. This is a common security feature for apps downloaded from the internet.

**Fix:**

1. Open Terminal
2. Run the following command (replace path with actual location):

```bash
xattr -cr /Applications/Simple\ POS.app
```

_or if running from the Downloads folder:_

```bash
xattr -cr ~/Downloads/Simple\ POS.app
```

## 📚 Documentation

- [Architecture Guide](docs/architecture.md)
- [PRD](docs/prd.md)
- [Contributing Guidelines](CONTRIBUTING.md)

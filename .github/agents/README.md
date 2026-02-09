# GitHub Copilot Custom Agents

This directory contains specialized custom agent profiles for GitHub Copilot coding agent. These agents provide expert assistance for specific development tasks in the Simple POS Nx monorepo project.

## Project Structure (Nx Monorepo)

```
simple-pos/
├── apps/
│   ├── pos/              # Angular 21 POS frontend
│   ├── api/              # NestJS backend (SaaS)
│   ├── desktop/          # Tauri wrapper
│   └── admin-portal/     # (Future) Super admin dashboard
├── libs/
│   ├── shared/types/     # Shared TypeScript interfaces
│   ├── shared/utils/     # Common utilities
│   ├── shared/constants/ # Shared constants
│   └── domain/           # Domain logic
└── docs/                 # Documentation
```

## Available Custom Agents

### 🧪 Test Specialist (`test-specialist`)

**Focus**: Test coverage, quality, and testing best practices using Vitest

**Use this agent when you need to**:

- Write comprehensive unit tests for services and repositories
- Create integration tests for data flow across layers
- Write component tests using Angular TestBed
- Review existing test quality and identify coverage gaps
- Ensure tests follow Vitest and Angular testing best practices

**Key Features**:

- Expert in Vitest 4.0.8 with jsdom environment
- Knows how to mock IndexedDB with `fake-indexeddb`
- Specializes in Angular TestBed for component/service testing
- Enforces test isolation, determinism, and documentation
- Tests both success and error paths

### 🗄️ Repository Specialist (`repository-specialist`)

**Focus**: Dual-platform repository implementations (SQLite + IndexedDB) following Clean Architecture

**Use this agent when you need to**:

- Create new repositories for entities
- Implement both SQLite (Tauri) and IndexedDB (Web) versions
- Write database migrations for SQLite
- Register repositories in RepositoryFactory
- Ensure repositories follow the BaseRepository interface
- Handle platform-specific data access patterns

**Key Features**:

- Expert in dual-platform data access (desktop + web)
- Enforces BaseRepository interface compliance
- Creates SQLite migrations in `apps/desktop/src-tauri/migrations/`
- Handles IndexedDB schema registration
- Ensures type safety and error handling
- Performance optimization for both platforms

### 🎨 Angular Component Specialist (`angular-component-specialist`)

**Focus**: Modern Angular 21 standalone components with Signals

**Use this agent when you need to**:

- Create new UI components or pages in `apps/pos`
- Implement reactive state with Angular Signals
- Use modern Angular template syntax (`@if`, `@for`)
- Build forms with ReactiveFormsModule
- Apply TailwindCSS and glassmorphism styling
- Ensure mobile-first responsive design
- Write component tests with Angular TestBed

**Key Features**:

- Expert in Angular 21 standalone components (no NgModules)
- Uses Angular Signals API for reactive state (not RxJS)
- Modern control flow syntax (@if, @for, @empty)
- Dependency injection with constructor injection pattern
- TailwindCSS utility classes and glassmorphism effects
- Mobile-first responsive design patterns
- Accessibility best practices

### 🌐 Backend Specialist (`backend-specialist`) - Coming Soon

**Focus**: NestJS backend API development for SaaS

**Use this agent when you need to**:

- Create new API endpoints in `apps/api`
- Implement sync protocol endpoints
- Set up multi-tenant data isolation with RLS
- Add authentication and authorization guards
- Write API tests

## How to Use Custom Agents

### On GitHub.com

1. **Navigate to the agents panel** at [github.com/copilot/agents](https://github.com/copilot/agents)
2. **Select your repository** from the dropdown
3. **Choose a custom agent** from the dropdown when creating a task
4. **Assign the agent** to an issue or describe your task
5. **Review the pull request** created by the agent

### In Visual Studio Code

1. **Open GitHub Copilot Chat** (⌘+I or Ctrl+I)
2. **Click the agents dropdown** at the bottom of the chat view
3. **Select a custom agent** from the list
4. **Describe your task** in the chat
5. **Review and apply** the suggested changes

### In JetBrains IDEs / Eclipse / Xcode

1. **Open GitHub Copilot Chat window**
2. **Use the agents dropdown** at the bottom of the chat view
3. **Select your custom agent**
4. **Provide your task description**
5. **Review the agent's work**

### Using GitHub CLI

```bash
# List available agents
gh copilot agent list

# Use a specific custom agent
gh copilot agent run --agent test-specialist "Write tests for ProductService"
```

## When to Use Each Agent

| Task                                          | Recommended Agent                |
| --------------------------------------------- | -------------------------------- |
| Writing or reviewing tests                    | **test-specialist**              |
| Creating new data repositories                | **repository-specialist**        |
| Building UI components or pages               | **angular-component-specialist** |
| Implementing database migrations              | **repository-specialist**        |
| Adding form validations                       | **angular-component-specialist** |
| Increasing test coverage                      | **test-specialist**              |
| Fixing responsive design issues               | **angular-component-specialist** |
| Creating SQLite and IndexedDB implementations | **repository-specialist**        |
| Creating shared types in `libs/`              | **repository-specialist**        |

## Agent Configuration

Each agent profile is defined in a `.agent.md` file with YAML frontmatter:

```yaml
---
name: agent-name
description: Brief description of the agent's expertise
tools: ['read', 'edit', 'search', 'bash'] # Optional: restrict tools
---
Detailed instructions for the agent in Markdown...
```

## Benefits of Custom Agents

✅ **Specialized Expertise**: Agents have deep knowledge of specific domains
✅ **Consistency**: Enforces project standards and patterns automatically
✅ **Efficiency**: Faster development with focused, context-aware assistance
✅ **Quality**: Reduces errors by following best practices
✅ **Onboarding**: New team members can leverage agent knowledge
✅ **Monorepo Aware**: Agents understand the Nx project structure

## Modifying Custom Agents

To update an agent profile:

1. **Edit the `.agent.md` file** in this directory
2. **Commit and push** changes to the main branch
3. **Refresh the agents list** in your IDE or on GitHub.com
4. The updated agent will be immediately available

## Creating New Custom Agents

To create a new custom agent:

1. **Create a new `.agent.md` file** in this directory
2. **Define the YAML frontmatter** (name, description, tools)
3. **Write detailed instructions** in Markdown below the frontmatter
4. **Commit and push** to the main branch
5. The new agent will appear in the agents dropdown

For detailed configuration options, see the [GitHub Copilot documentation on custom agents](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents).

## Learn More

- 📖 [GitHub Copilot Custom Agents Documentation](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)
- 🎓 [Custom Agent Configuration Reference](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
- 🌟 [Awesome Copilot Agents Examples](https://github.com/github/awesome-copilot/tree/main/agents)
- 📘 [Main Copilot Instructions](../copilot-instructions.md)
- 📋 [SaaS/On-Prem Roadmap](../../docs/SAAS-ONPREM-TRANSFORMATION.md)

---

**Note**: These custom agents complement the main [Copilot instructions](../copilot-instructions.md) which provide general guidance for the entire Simple POS Nx monorepo project.

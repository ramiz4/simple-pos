# GitHub Copilot Custom Agents

Custom agent profiles for GitHub Copilot tasks in the Simple POS Nx monorepo.

## Project Structure

```
simple-pos/
├── apps/
│   ├── pos/              # Angular 21 POS frontend
│   ├── api/              # NestJS backend (SaaS)
│   ├── native/           # Tauri host
│   └── admin-portal/     # (Future) Super admin dashboard
├── libs/
│   ├── shared/types/     # Shared TypeScript interfaces
│   ├── shared/utils/     # Common utilities
│   ├── shared/constants/ # Shared constants
│   └── domain/           # Domain logic
└── docs/                 # Documentation
```

## Available Custom Agents

- 🧪 **test-specialist**: Vitest coverage, unit/integration tests, Angular/NestJS testing patterns
- 🗄️ **repository-specialist**: Dual repositories (SQLite + IndexedDB), migrations, data access patterns
- 🎨 **angular-engineer**: Angular 21 UI, routing, services, Signals, TailwindCSS
- 🌐 **backend-specialist**: Coming soon

## How to Use

- GitHub.com: open [github.com/copilot/agents](https://github.com/copilot/agents) and select an agent
- VS Code / JetBrains / other IDEs: use the agents dropdown in Copilot Chat
- CLI:

```bash
gh copilot agent list
gh copilot agent run --agent test-specialist "Write tests for ProductService"
```

## When to Use Each Agent

| Task                                          | Recommended Agent         |
| --------------------------------------------- | ------------------------- |
| Writing or reviewing tests                    | **test-specialist**       |
| Creating new data repositories                | **repository-specialist** |
| Building UI components or pages               | **angular-engineer**      |
| Implementing database migrations              | **repository-specialist** |
| Adding form validations                       | **angular-engineer**      |
| Increasing test coverage                      | **test-specialist**       |
| Fixing responsive design issues               | **angular-engineer**      |
| Creating SQLite and IndexedDB implementations | **repository-specialist** |
| Creating shared types in `libs/`              | **repository-specialist** |

## Agent Configuration

Each agent profile is defined in a `.agent.md` file with YAML frontmatter:

```yaml
---
name: agent-name
description: Brief description of the agent's expertise
tools: ['read', 'edit', 'search'] # Optional: restrict tools
---
Detailed instructions for the agent in Markdown...
```

## Update or Add Agents

- Edit or add a `.agent.md` file, commit, push, then refresh agents in your IDE
- See the [custom agents docs](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)

## Learn More

- [Custom agents documentation](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)
- [Custom agents reference](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
- [Main Copilot instructions](../copilot-instructions.md)

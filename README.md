# Kiwumil (キューミル)

Kiwumil is a TypeScript library that combines a Kiwi-based constraint solver with a namespace-driven DSL to write UML-style diagrams as code. It aims to balance hand-crafted layout control and constraint-based alignment so diagrams remain both precise and quickly editable.

[日本語](README.ja.md) | English

---

## Quick links

- Design docs (bilingual): [docs/design/index.md](docs/design/index.md)
- Guidelines (bilingual): [docs/guidelines/index.md](docs/guidelines/index.md)
- Examples: [examples/](examples/)
- Development log (devlog, primarily Japanese): [docs/devlog/](docs/devlog/)
- Package: [@tinsep19/kiwumil](https://github.com/tinsep19/kiwumil/packages)
- License: [MIT](LICENSE)

---

## Quick start (example)

```typescript
import { TypeDiagram, UMLPlugin } from "kiwumil"

TypeDiagram("First Milestone")
  .use(UMLPlugin)
  .build(({ el, rel, hint }) => {
    const user = el.uml.actor("User")
    const login = el.uml.usecase("Login")

    rel.uml.associate(user, login)
    hint.arrangeVertical(user, login)
  })
  .render("output.svg")
```

---

## Installation (GitHub Packages)

Kiwumil is published to GitHub Packages. A Personal Access Token (PAT) with the `read:packages` scope is required to install the package. Follow these steps to configure your environment and install with Bun/NPM.

1) Create a read-only PAT

- Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic).
- Give the token a name and select only the `read:packages` scope.
- Copy the generated token and keep it secure; treat it like a password.

2) Configure .npmrc

Create or edit the file `~/.npmrc` in your home directory and add the following lines (replace `YOUR_READONLY_PAT` with the token generated above):

```
@tinsep19:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=YOUR_READONLY_PAT
```

Security notes:
- Do NOT commit your PAT or `.npmrc` containing the token into version control.
- Prefer storing tokens in a credentials manager or environment-specific secret store.

3) Install

With Bun:

```bash
bun install @tinsep19/kiwumil
```

With npm:

```bash
npm install @tinsep19/kiwumil
```

---

## Development (local)

- Setup: `bun install` (or `npm install` / `pnpm install` depending on your environment)
- Tests: `bun run test` (see package.json)
- Type tests: `bun run test:types`

---

## Documentation & translation policy

- Core design pages are bilingual (English / 日本語). Devlogs are primarily in Japanese.
- If you need translations or improvements to a specific doc, open an issue or PR referencing `docs/design/<page>`.

---

## Contributing

- Project is pre-1.0 and the public API may change; contribution policy is evolving.
- For now, open issues for suggestions. Large doc restructures should be proposed as Draft PRs including a `docs/devlog/` entry.

---

## Maintainers

- TANIGUCHI Kousuke (tinsep19)


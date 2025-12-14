# Kiwumil (キューミル)

Kiwumil is a TypeScript library that combines a Kiwi-based constraint solver with a namespace-driven DSL to write UML-style diagrams as code. It aims to balance hand-crafted layout control and constraint-based alignment so diagrams remain both precise and quickly editable.

[日本語](README.ja.md) | English


## Why kiwumil?

**kiwumil is a DSL for tidying diagrams without losing their semantics.**

By writing diagrams in kiwumil's DSL you can express both the semantics of elements and relationships, and the layout intentions (how elements should be arranged), while keeping those concerns separated. This makes diagrams safe to store as text and safe to refine later.

### Why not just SVG, PlantUML or Mermaid?

kiwumil does not encourage editing raw SVG as a primary workflow: SVG is great as a final artifact, but it poorly preserves the semantics and layout intent in a human-friendly form. Unlike PlantUML or Mermaid, kiwumil avoids embedding layout directives into semantic descriptions (e.g. sprinkling `left`/`up` instructions into arrows). Instead, kiwumil treats:

- "what relates to what" (semantics) and
- "how to tidy or align them" (layout intent)

as separate layers.

### Why a TypeScript DSL?

Providing kiwumil as a TypeScript DSL is a deliberate UX choice: TypeScript's type system, editor integration (IntelliSense/LSP), and ecosystem help keep semantics explicit and discoverable. The DSL becomes a typed authoring surface rather than just a file format.

### Not just "draw and forget"

Because kiwumil runs on Bun/TypeScript, it naturally integrates with JSON/CSV, external APIs, and other systems. This enables:

- text-manageable diagrams
- diagrams generated from external data
- diagrams that are refined and tidied by humans after generation

In short: kiwumil is a foundation to bring diagrams closer to human aesthetics while preserving meaning.

> kiwumil helps you preserve semantics while making diagrams look the way humans expect.

---

## Quick links

- Design docs (bilingual): [docs/design/index.md](docs/design/index.md)
- Guidelines (bilingual): [docs/guidelines/index.md](docs/guidelines/index.md)
- Examples: [examples/](examples/)
- Development log (devlog, primarily Japanese): [docs/devlog/](docs/devlog/)
- Package: [@tinsep19/kiwumil](https://github.com/tinsep19/kiwumil/packages)
- License: [MIT](LICENSE)

---

## Hint API — Design philosophy

**Hint API is not an API to "draw numbers" — but it is not an API that forbids numbers either.**
Use numeric values when they have meaning (margins, padding, stroke widths, aspect hints), but avoid commanding absolute positions.

Kiwumil avoids:

- absolute coordinate specifications
- imperative placement like "put this element at (x, y)"
- tweaking visual details in a way that breaks semantic meaning

### What matters visually

Kiwumil is built on the premise that alignment is the biggest factor in perceived cleanliness:

- centers aligned
- edges aligned
- consistent spacing
- visual reference lines

These are relationships; Hint API expresses those relationships.

### Auto layout stance

Kiwumil does not aim for fully automatic layout. Instead it uses a two-stage approach:

1. rough placement via `figure` / `grid` to build the skeleton
2. refinement via human-directed Hints to express alignment/intention

This avoids hiding user intent while providing automation where it helps.

### How to use Hints (high level)

1. Use `figure` / `grid` (enclose) to create the broad structure.
2. Use `align` / `arrange` Hints to align edges/centers and tidy spacing.

Hints communicate intent ("I want these centered", "I want these aligned"). The engine converts intent into constraints and solves for coordinates.

### Key takeaways

- Use numbers when meaningful, but don't let numbers dominate layout decisions.
- Automation is an assistant, not the decision-maker.
- Alignment (relationships) is the core of visual quality.
- Workflow: broad structure → human-guided refinement.



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


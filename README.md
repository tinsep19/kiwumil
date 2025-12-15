# 🥝 Kiwumil (キューミル)

Kiwumil is a TypeScript DSL for authoring diagrams from semantics and tidying them only when needed. It uses relationship-based automatic layout as the baseline and allows targeted refinement via layout hints (alignment, spacing, anchors). Hints are interpreted by a Kiwi (Cassowary) linear constraint solver, so you describe placement as relationships without manipulating numeric coordinates directly. The namespace-based DSL and plugin system make it possible to manage UML-like diagrams as text while preserving semantics.

[日本語](README.ja.md) | English


## 🌱 Why kiwumil?

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

## 📚 Quick links

- 📖 Design docs (bilingual): [docs/design/index.md](docs/design/index.md)
- 📐 Guidelines (bilingual): [docs/guidelines/index.md](docs/guidelines/index.md)
- 🧩 Examples: [examples/](examples/)
- 📝 Development log (devlog, primarily Japanese): [docs/devlog/](docs/devlog/)
- 📦 Package: [@tinsep19/kiwumil](https://github.com/tinsep19/kiwumil/packages)
- 📄 License: [MIT](LICENSE)

---



---

## 📦 Installation (GitHub Packages)

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

## 🔧 Development (local)

- Setup: `bun install` (or `npm install` / `pnpm install` depending on your environment)
- Tests: `bun run test` (see package.json)
- Type tests: `bun run test:types`

---

## 🌍 Documentation & translation policy

- Core design pages are bilingual (English / 日本語). Devlogs are primarily in Japanese.
- If you need translations or improvements to a specific doc, open an issue or PR referencing `docs/design/<page>`.

---

## 🤝 Contributing

- Project is pre-1.0 and the public API may change; contribution policy is evolving.
- For now, open issues for suggestions. Large doc restructures should be proposed as Draft PRs including a `docs/devlog/` entry.

---

## 👥 Maintainers

- TANIGUCHI Kousuke (tinsep19)

---

## ✅ What kiwumil does / does not do

### ✅ What kiwumil does

kiwumil is a DSL for authoring and managing diagrams with semantics as the primary concern.

- Treats semantic information (elements, relationships) as first-class
- Performs automatic layout derived from those semantics
- Allows optional, targeted refinement using the Hint API on top of automatic layout
- Expresses structures that people perceive as visually pleasing (alignment, enclosure via figure/grid, spacing)
- Uses numeric values only where meaningful (margins, stroke widths, etc.)
- Delivered as a TypeScript DSL, so users benefit from editor completion and LSP integration
- Runs on Bun/TypeScript, enabling integration with JSON/CSV and external data

kiwumil aims to support a single model for both "diagrams that are sufficient as-is from semantics" and "diagrams that need a bit of tidying".

---

### ❌ What kiwumil does not do

kiwumil is not intended to:

- Produce perfectly beautiful diagrams automatically in all cases
- Provide absolute coordinate / pixel-level placement APIs
- Replace WYSIWYG editors or SVG editing tools
- Ask end-users to write complex solver constraints
- Be a magic optimizer that fixes all layout problems without guidance

The constraint system exists for plugin authors and internal frameworks; end users are expected to use the DSL and Hint API rather than manipulating solver internals.

---

## 👤 Who is this for / not for

### 👍 Who this is for

kiwumil is aimed at people who:

- Treat diagrams as meaningful structures rather than just images
- Want diagrams version-controlled and reviewable as text
- Respect automatic layout but want to add human intent afterwards
- Prefer to "make things a bit neater" rather than redraw everything
- Are comfortable authoring in a TypeScript DSL
- Need to integrate diagrams with external data sources

### 👎 Who this is not for

kiwumil is not the right tool if you:

- Prefer drag-and-drop WYSIWYG diagramming
- Want to manually position every element by coordinates
- Only need purely automatic layout with no refinement
- Need the fastest possible way to produce a one-off visual

---

## 🎯 Design stance

kiwumil's core design stance is:

> Preserve semantics and enable visual refinement.

It treats automatic layout as a baseline and exposes opt-in Hints for targeted, semantics-preserving adjustments. This lets authors express both what a diagram means and how it should be tidied, without mixing concerns.


## 💡 Design principles (concise)

kiwumil is a semantics-first DSL that improves diagram appearance via relationship-based layout and opt-in refinement. It preserves semantics, uses automatic layout as baseline, and provides Hint-based, semantics-preserving adjustments for visual quality.

See: [docs/design/philosophy-concise.md](docs/design/philosophy-concise.md)

[日本語](philosophy-concise.ja.md) | English

# kiwumil — Design principles (concise)

### Semantics-first DSL for tidy diagrams

kiwumil is a DSL that preserves element and relationship semantics while enabling improved visual quality through relationship-based layout and refinement.

### Build on what existing tools solve

Tools like PlantUML and Mermaid already map semantics to diagrams. kiwumil keeps that guarantee: if you declare semantics, you get a readable diagram.

### The remaining problem: "make it look clean"

Automatic layout yields readable diagrams but not always visually tidy. Small differences (label sizes, stereotypes, nested elements) create visual imbalance that automated layout alone does not resolve.

### kiwumil's stance

- avoid demanding fine-grained numeric placement up front
- allow targeted, semantics-preserving refinement later
- separate semantic layout from human-directed Hints

### Characs

Each Symbol exposes `characs.bounds` as the canonical layout surface. Characs act as semantic anchors (e.g. `icon.center`, `stereotype.top`) that hint at what should be aligned without exposing raw variables.

### Hint API

- Not an absolute-coordinate API, and not number-averse.
- Accepts meaningful numbers (margins, padding, stroke widths) but expresses intent as relationships: "align these", "preserve this relation".

### Placement philosophy

1. Use `figure` / `grid` (enclose) for coarse structure.
2. Use `align` / `arrange` Hints for fine adjustments (centers, edges, baselines).

This two-step flow avoids over-automation while preserving semantic integrity.

### Role of editor tooling

Expose only semantic parts (layout, icon, stereotype, label) to users and editors; keep solver variables and coordinates internal. IntelliSense should guide what can be adjusted, not how to compute values.

### Core summary

- Semantics first
- Automatic layout as baseline
- Alignment is the core of visual quality
- Fine adjustments are opt-in via Hints

kiwumil is a foundation to make diagrams "one step tidier" without breaking their meaning.

// example/tech_stack_diagram.ts
import { TypedDiagram, CorePlugin, UMLPlugin } from "../src/index"

/**
 * Tech Stack Diagram (kiwumil)
 *
 * This example demonstrates the project technology stack and highlights the
 * strong connection between the Namespace-based DSL and developer tooling
 * (TypeScript Language Service / VSCode LSP). The diagram is rendered to an
 * SVG file that shares the same basename as this .ts file by using
 * render(import.meta).
 */

TypedDiagram("Kiwumil — 技術スタック図")
  .use(CorePlugin)
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    // Nodes
    const ts = el.core.rectangle("TypeScript")
    const dsl = el.core.rectangle("Namespace-based DSL\n(el.uml / el.core)")
    const plugin = el.core.rectangle("Plugin System\n(SymbolRegistry / RelationshipFactory)")
    const layout = el.core.rectangle("Layout Engine\n@lume/kiwi — Cassowary")
    const svg = el.core.rectangle("SVG Renderer\n(W3C SVG)")
    const lsp = el.core.rectangle("Dev Tools\nTypeScript Language Service / VSCode (LSP)")

    // Strongly-worded annotation to emphasize DSL -> LSP
    const note = el.core.roundedRectangle(
      "注:\nNamespace-based DSL は TypeScript の型定義を公開し、\nVSCode の Language Service (LSP) による IntelliSense / 補完 / 定義ジャンプを有効にします"
    )

    // Relationships (arrows)
    rel.uml.associate(ts, dsl)
    rel.uml.associate(dsl, plugin)
    rel.uml.associate(plugin, layout)
    rel.uml.associate(layout, svg)
    rel.uml.associate(dsl, lsp)

    // Link annotation to both DSL and LSP
    rel.uml.associate(dsl, note)
    rel.uml.associate(lsp, note)

    // Layout hints: left-to-right flow for core stack, and place LSP/note near DSL
    hint.arrangeHorizontal(ts, dsl, plugin)
    hint.arrangeHorizontal(layout, svg)
    hint.arrangeVertical(dsl, lsp)
    hint.arrangeHorizontal(lsp, note)
  })
  .render(import.meta)

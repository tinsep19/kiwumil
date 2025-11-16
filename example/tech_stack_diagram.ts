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

TypedDiagram("Kiwumil — module stack")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    // Nodes
    const ts = el.core.rectangle("TypeScript")
    const lsp = el.core.rectangle("LSP")

    const dsl = el.core.rectangle("TypeDiagram DSL")
    const plugin = el.core.rectangle("Plugin System")
    const layout = el.core.rectangle("Layout Engine/Kiwi")
    const theme = el.core.rectangle("Theme System")

    const bun = el.core.rectangle("Bun")
    const render = el.core.rectangle("SVG Renderer")

    const dx = el.uml.systemBoundary("DX")
    const core = el.uml.systemBoundary("Core")
    const ux = el.uml.systemBoundary("UX")

    rel.uml.associate(lsp, dsl)
    rel.uml.associate(ts,  dsl)

    rel.uml.associate(dsl, layout)
    rel.uml.associate(dsl, plugin)
    rel.uml.associate(dsl, theme)
    rel.uml.associate(layout, theme)
    rel.uml.associate(render, plugin)
    
    hint.arrangeVertical(dx, core, ux)
    hint.alignLeft(dx, core, ux)
    
    hint.enclose(dx,   [lsp, ts])
    hint.enclose(core, [dsl, layout, plugin, theme])
    hint.enclose(ux,   [render, bun])

    // Layout hints: left-to-right flow for core stack, and place LSP/note near DSL
    hint.arrangeHorizontal(lsp, ts)
    hint.alignCenterY(lsp, ts)

    hint.arrangeHorizontal(dsl, layout)
    hint.arrangeHorizontal(plugin, theme)
    
    hint.alignCenterY(dsl, layout)
    hint.alignCenterY(plugin, theme)
    hint.arrangeVertical(dsl, plugin)

    hint.arrangeHorizontal(render, bun)

  })
  .render(import.meta)

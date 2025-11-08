// src/dsl/diagram.ts
import { SymbolRegistry } from "../model/symbol_registry"
import { RelationshipRegistry } from "../model/relationship_registry"
import { PluginManager, KiwumilPlugin } from "./plugin_manager"
import { ElementFactory } from "./element_factory"
import { RelationshipFactory } from "./relationship_factory"
import { HintFactory, LayoutHint } from "./hint_factory"
import { LayoutSolver } from "../layout/layout_solver"
import { SvgRenderer } from "../render/svg_renderer"
import type { SymbolBase } from "../model/symbol_base"

type DiagramCallback = (
  element: ElementFactory,
  relation: RelationshipFactory,
  hint: HintFactory
) => void

export class Diagram {
  private symbolRegistry = new SymbolRegistry()
  private relationshipRegistry = new RelationshipRegistry()
  private pluginManager = new PluginManager(this.symbolRegistry, this.relationshipRegistry)

  static use(...plugins: KiwumilPlugin[]): Diagram {
    const diagram = new Diagram()
    diagram.pluginManager.use(...plugins)
    return diagram
  }

  build(name: string, callback: DiagramCallback) {
    const symbols: SymbolBase[] = []
    const hints: LayoutHint[] = []

    const element = new ElementFactory(this.symbolRegistry, symbols)
    const relation = new RelationshipFactory()
    const hint = new HintFactory(hints)

    callback(element, relation, hint)

    // レイアウト計算
    const solver = new LayoutSolver()
    solver.solve(symbols, hints)

    return {
      symbols,
      render: (filepath: string) => {
        const renderer = new SvgRenderer(symbols)
        renderer.saveToFile(filepath)
      }
    }
  }
}

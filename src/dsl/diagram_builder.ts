// src/dsl/diagram_builder.ts
import { SymbolRegistry } from "../model/symbol_registry"
import { RelationshipRegistry } from "../model/relationship_registry"
import { PluginManager, KiwumilPlugin } from "./plugin_manager"
import { ElementFactory } from "./element_factory"
import { RelationshipFactory } from "./relationship_factory"
import { HintFactory, LayoutHint } from "./hint_factory"
import { LayoutSolver } from "../layout/layout_solver"
import { SvgRenderer } from "../render/svg_renderer"
import { CorePlugin } from "../plugin/core_plugin"
import type { SymbolBase } from "../model/symbol_base"
import type { Association } from "../plugin/uml/relationships/association"
import type { Theme } from "../core/theme"

type DiagramCallback = (
  element: ElementFactory,
  relation: RelationshipFactory,
  hint: HintFactory
) => void

export class DiagramBuilder {
  private symbolRegistry = new SymbolRegistry()
  private relationshipRegistry = new RelationshipRegistry()
  private pluginManager = new PluginManager(this.symbolRegistry, this.relationshipRegistry)
  private currentTheme?: Theme

  constructor() {
    // CorePluginをデフォルトで有効化
    this.pluginManager.use(CorePlugin)
  }

  use(...plugins: KiwumilPlugin[]): DiagramBuilder {
    this.pluginManager.use(...plugins)
    return this
  }

  theme(theme: Theme): DiagramBuilder {
    this.currentTheme = theme
    return this
  }

  build(name: string, callback: DiagramCallback) {
    const symbols: SymbolBase[] = []
    const relationships: Association[] = []
    const hints: LayoutHint[] = []

    const element = new ElementFactory(this.symbolRegistry, symbols)
    const relation = new RelationshipFactory(relationships)
    const hint = new HintFactory(hints, symbols)

    callback(element, relation, hint)

    // テーマを適用
    if (this.currentTheme) {
      for (const symbol of symbols) {
        symbol.setTheme(this.currentTheme)
      }
      for (const relationship of relationships) {
        relationship.setTheme(this.currentTheme)
      }
    }

    // レイアウト計算
    const solver = new LayoutSolver()
    solver.solve(symbols, hints)

    return {
      symbols,
      relationships,
      render: (filepath: string) => {
        const renderer = new SvgRenderer(symbols, relationships, this.currentTheme)
        renderer.saveToFile(filepath)
      }
    }
  }
}

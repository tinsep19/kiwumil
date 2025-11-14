// src/dsl/diagram_builder.ts
import { SymbolRegistry } from "../model/symbol_registry"
import { RelationshipRegistry } from "../model/relationship_registry"
import { PluginManager, KiwumilPlugin } from "./plugin_manager"
import { ElementFactory } from "./element_factory"
import { RelationshipFactory } from "./relationship_factory"
import { HintFactory, LayoutHint } from "./hint_factory"
import { LayoutSolver } from "../layout/layout_solver"
import { SvgRenderer } from "../render/svg_renderer"
import { CorePlugin } from "../plugin/core"
import { DiagramSymbol } from "../model/diagram_symbol"
import type { SymbolBase } from "../model/symbol_base"
import type { DiagramInfo } from "../model/diagram_info"
import type { Association } from "../plugin/uml/relationships/association"
import type { Include } from "../plugin/uml/relationships/include"
import type { Extend } from "../plugin/uml/relationships/extend"
import type { Generalize } from "../plugin/uml/relationships/generalize"
import type { Theme } from "../core/theme"
import { DefaultTheme } from "../core/theme"

type Relationship = Association | Include | Extend | Generalize

type DiagramCallback = (
  element: ElementFactory,
  relation: RelationshipFactory,
  hint: HintFactory
) => void

export class DiagramBuilder {
  private symbolRegistry = new SymbolRegistry()
  private relationshipRegistry = new RelationshipRegistry()
  private pluginManager = new PluginManager(this.symbolRegistry, this.relationshipRegistry)
  private currentTheme: Theme
  private titleOrInfo: string | DiagramInfo

  constructor(titleOrInfo: string | DiagramInfo) {
    this.titleOrInfo = titleOrInfo
    // CorePluginをデフォルトで有効化
    this.pluginManager.use(CorePlugin)
    // デフォルトテーマを設定
    this.currentTheme = DefaultTheme
  }

  use(...plugins: KiwumilPlugin[]): DiagramBuilder {
    this.pluginManager.use(...plugins)
    return this
  }

  theme(theme: Theme): DiagramBuilder {
    this.currentTheme = theme
    return this
  }

  build(callback: DiagramCallback) {
    const userSymbols: SymbolBase[] = []
    const relationships: Relationship[] = []
    const hints: LayoutHint[] = []

    const element = new ElementFactory(this.symbolRegistry, userSymbols)
    const relation = new RelationshipFactory(relationships)
    const hint = new HintFactory(hints, userSymbols, this.currentTheme)

    callback(element, relation, hint)

    // DiagramSymbolを作成
    const diagramSymbol = new DiagramSymbol("__diagram__", this.titleOrInfo)
    diagramSymbol.setTheme(this.currentTheme)

    // すべてのシンボルを含む配列を作成（DiagramSymbolを先頭に）
    const allSymbols: SymbolBase[] = [diagramSymbol, ...userSymbols]

    // テーマを適用
    for (const symbol of userSymbols) {
      symbol.setTheme(this.currentTheme)
    }
    for (const relationship of relationships) {
      relationship.setTheme(this.currentTheme)
    }

    // DiagramSymbolがすべてのユーザーシンボルをenclosureするhintを追加
    if (userSymbols.length > 0) {
      hints.push({
        type: "enclose",
        symbolIds: [],  // encloseの場合はsymbolIdsは未使用
        containerId: diagramSymbol.id,
        childIds: userSymbols.map(s => s.id)
      })
    }

    // レイアウト計算
    const solver = new LayoutSolver(this.currentTheme)
    solver.solve(allSymbols, hints)

    return {
      symbols: allSymbols,
      relationships,
      render: (filepath: string) => {
        const renderer = new SvgRenderer(allSymbols, relationships, this.currentTheme)
        renderer.saveToFile(filepath)
      }
    }
  }
}

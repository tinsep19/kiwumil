// src/dsl/diagram_builder.ts
import { NamespaceBuilder } from "./namespace_builder"
import { HintFactory, LayoutHint } from "./hint_factory"
import { LayoutSolver } from "../layout/layout_solver"
import { SvgRenderer } from "../render/svg_renderer"
import { DiagramSymbol } from "../model/diagram_symbol"
import type { DiagramPlugin } from "./diagram_plugin"
import type { SymbolBase } from "../model/symbol_base"
import type { RelationshipBase } from "../model/relationship_base"
import type { DiagramInfo } from "../model/diagram_info"
import type { Theme } from "../core/theme"
import type { BuildElementNamespace, BuildRelationshipNamespace } from "./namespace_types"
import { DefaultTheme } from "../core/theme"

type DiagramCallback<TPlugins extends readonly DiagramPlugin[]> = (
  el: BuildElementNamespace<TPlugins>,
  rel: BuildRelationshipNamespace<TPlugins>,
  hint: HintFactory
) => void

/**
 * DiagramBuilder - Namespace-based DSL version
 * 
 * 新しいプラグインシステムを使った DiagramBuilder
 */
export class DiagramBuilder<TPlugins extends readonly DiagramPlugin[] = []> {
  private plugins: TPlugins = [] as any
  private currentTheme: Theme
  private titleOrInfo: string | DiagramInfo

  constructor(titleOrInfo: string | DiagramInfo) {
    this.titleOrInfo = titleOrInfo
    this.currentTheme = DefaultTheme
  }

  /**
   * プラグインを登録
   */
  use<TNewPlugins extends readonly DiagramPlugin[]>(
    ...plugins: TNewPlugins
  ): DiagramBuilder<[...TPlugins, ...TNewPlugins]> {
    this.plugins = [...this.plugins, ...plugins] as any
    return this as any
  }

  /**
   * テーマを設定
   */
  theme(theme: Theme): this {
    this.currentTheme = theme
    return this
  }

  /**
   * ダイアグラムを構築
   */
  build(callback: DiagramCallback<TPlugins>) {
    // Symbol と Relationship を格納する配列
    const userSymbols: SymbolBase[] = []
    const relationships: RelationshipBase[] = []
    const hints: LayoutHint[] = []

    // Namespace Builder を使って el と rel を構築
    const namespaceBuilder = new NamespaceBuilder(this.plugins)
    const el = namespaceBuilder.buildElementNamespace(userSymbols)
    const rel = namespaceBuilder.buildRelationshipNamespace(relationships)
    const hint = new HintFactory(hints, userSymbols, this.currentTheme)

    // ユーザーのコールバックを実行
    // この中で el.uml.actor() などが呼ばれ、userSymbols / relationships に追加される
    callback(el, rel, hint)

    // DiagramSymbol を作成
    const diagramSymbol = new DiagramSymbol("__diagram__", this.titleOrInfo)
    diagramSymbol.setTheme(this.currentTheme)

    // すべての Symbol を含む配列
    const allSymbols: SymbolBase[] = [diagramSymbol, ...userSymbols]

    // テーマを適用
    for (const symbol of userSymbols) {
      symbol.setTheme(this.currentTheme)
    }
    for (const relationship of relationships) {
      relationship.setTheme(this.currentTheme)
    }

    // DiagramSymbol がすべてのユーザー Symbol を enclose する hint を追加
    if (userSymbols.length > 0) {
      hints.push({
        type: "enclose",
        symbolIds: [],
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

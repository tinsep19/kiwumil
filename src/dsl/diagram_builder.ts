// src/dsl/diagram_builder.ts
import { NamespaceBuilder } from "./namespace_builder"
import { HintFactory, LayoutHint } from "./hint_factory"
import { LayoutSolver } from "../layout/layout_solver"
import { SvgRenderer } from "../render/svg_renderer"
import { DiagramSymbol } from "../model/diagram_symbol"
import { CorePlugin } from "../plugin/core/plugin"
import { convertMetaUrlToSvgPath } from "../utils/path_helper"
import type { DiagramPlugin } from "./diagram_plugin"
import type { SymbolBase } from "../model/symbol_base"
import type { RelationshipBase } from "../model/relationship_base"
import type { DiagramInfo } from "../model/diagram_info"
import type { Theme } from "../core/theme"
import type { BuildElementNamespace, BuildRelationshipNamespace } from "./namespace_types"
import { DefaultTheme } from "../core/theme"

/**
 * IntelliSense が有効な DSL ブロックのコールバック型
 * 
 * el (element), rel (relationship), hint の3つのパラメータを受け取り、
 * 型安全に図の要素を定義できる。
 */
type IntelliSenseBlock<TPlugins extends readonly DiagramPlugin[]> = (
  el: BuildElementNamespace<TPlugins>,
  rel: BuildRelationshipNamespace<TPlugins>,
  hint: HintFactory
) => void

/**
 * DiagramBuilder - TypedDiagram の内部実装クラス
 * 
 * ユーザーには公開されないが、TypedDiagram 関数から返される。
 * メソッドチェーンで流暢な API を提供する。
 */
class DiagramBuilder<TPlugins extends readonly DiagramPlugin[] = []> {
  private plugins = [] as unknown as TPlugins
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
    ((this as unknown) as { plugins: [...TPlugins, ...TNewPlugins] }).plugins = ([...this.plugins, ...plugins] as unknown) as [...TPlugins, ...TNewPlugins]
    return this as unknown as DiagramBuilder<[...TPlugins, ...TNewPlugins]>
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
   * 
   * @param callback - IntelliSense が有効な DSL ブロック
   * @returns レンダリング可能な図オブジェクト
   */
  build(callback: IntelliSenseBlock<TPlugins>) {
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
      render: (target: string | ImportMeta | Element) => {
        const renderer = new SvgRenderer(allSymbols, relationships, this.currentTheme)
        
        if (typeof target === "string") {
          // ケース1: 文字列パス → ファイル保存
          renderer.saveToFile(target)
        } else if ("url" in target) {
          // ケース2: import.meta → 自動ファイル名生成
          const filepath = convertMetaUrlToSvgPath(target.url)
          renderer.saveToFile(filepath)
        } else {
          // ケース3: HTMLElement → DOM レンダリング
          renderer.renderToElement(target)
        }
      }
    }
  }
}

/**
 * TypedDiagram - Kiwumil の型安全な図作成エントリポイント
 * 
 * IntelliSense による強力な型推論をサポートし、
 * 宣言的で読みやすい図の定義を可能にします。
 * 
 * **Note**: CorePlugin がデフォルトで適用されるため、
 * 基本図形（circle, rectangle, ellipse 等）がすぐに利用可能です。
 * 
 * @param titleOrInfo - 図のタイトル、または DiagramInfo オブジェクト
 * @returns チェーン可能なビルダーオブジェクト
 * 
 * @example 基本的な使い方
 * ```typescript
 * import { TypedDiagram, UMLPlugin } from "kiwumil"
 * 
 * TypedDiagram("My Diagram")
 *   .use(UMLPlugin)
 *   .build((el, rel, hint) => {
 *     // CorePlugin の図形（デフォルトで利用可能）
 *     const circle = el.core.circle("Circle")
 *     
 *     // UMLPlugin の図形
 *     const user = el.uml.actor("User")
 *     const login = el.uml.usecase("Login")
 *     rel.uml.associate(user, login)
 *     hint.arrangeHorizontal(user, login)
 *   })
 *   .render("output.svg")
 * ```
 * 
 * @example DiagramInfo を使用
 * ```typescript
 * TypedDiagram({
 *   title: "E-Commerce System",
 *   createdAt: "2025-11-14",
 *   author: "Architecture Team"
 * })
 *   .use(UMLPlugin)
 *   .build((el, rel, hint) => {
 *     // ...
 *   })
 *   .render("output.svg")
 * ```
 * 
 * @example 複数プラグインとテーマ
 * ```typescript
 * TypedDiagram("Mixed Diagram")
 *   .use(UMLPlugin)
 *   .theme(DarkTheme)
 *   .build((el, rel, hint) => {
 *     el.uml.actor("User")
 *     el.core.circle("Circle")  // CorePlugin はデフォルトで利用可能
 *   })
 *   .render("output.svg")
 * ```
 */
export function TypedDiagram(titleOrInfo: string | DiagramInfo) {
  return new DiagramBuilder(titleOrInfo).use(CorePlugin)
}

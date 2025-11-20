// src/dsl/diagram_builder.ts
import { NamespaceBuilder } from "./namespace_builder"
import { HintFactory } from "./hint_factory"
import { SvgRenderer } from "../render/svg_renderer"
import { DiagramSymbol } from "../model/diagram_symbol"
import { CorePlugin } from "../plugin/core/plugin"
import { convertMetaUrlToSvgPath } from "../utils/path_helper"
import { LayoutContext } from "../layout/layout_context"
import { SymbolsRegistry } from "../symbols/registry"
import type { DiagramPlugin } from "./diagram_plugin"
import type { SymbolBase } from "../model/symbol_base"
import type { RelationshipBase } from "../model/relationship_base"
import type { DiagramInfo } from "../model/diagram_info"
import type { Theme } from "../core/theme"
import type { BuildElementNamespace, BuildRelationshipNamespace } from "./namespace_types"
import { DefaultTheme } from "../core/theme"
import type { SymbolId } from "../model/types"
import { toContainerSymbolId } from "../model/container_symbol_base"

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
 * DiagramBuilder - TypeDiagram の内部実装クラス
 * 
 * ユーザーには公開されないが、TypeDiagram 関数から返される。
 * メソッドチェーンで流暢な API を提供する。
 */
class DiagramBuilder<TPlugins extends readonly DiagramPlugin[] = []> {
  private plugins: TPlugins = [] as unknown as TPlugins
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
    this.plugins = [...this.plugins, ...plugins] as unknown as TPlugins
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
    // Relationship を格納する配列
    const relationships: RelationshipBase[] = []
    let diagramSymbol: DiagramSymbol | undefined
    const diagramSymbolId = toContainerSymbolId("__diagram__")
    
    // SymbolsRegistry のための一時変数
    let symbolsRegistry: SymbolsRegistry | undefined
    
    const layoutContext: LayoutContext = new LayoutContext(
      this.currentTheme,
      (id: SymbolId): SymbolBase | undefined => {
        if (diagramSymbol && diagramSymbol.id === id) {
          return diagramSymbol
        }
        return symbolsRegistry?.get(id)
      }
    )

    // SymbolsRegistry を作成
    symbolsRegistry = new SymbolsRegistry(layoutContext)

    // Namespace Builder を使って el と rel を構築
    const namespaceBuilder = new NamespaceBuilder(this.plugins)
    const el = namespaceBuilder.buildElementNamespace(symbolsRegistry, layoutContext)
    const rel = namespaceBuilder.buildRelationshipNamespace(relationships, layoutContext)
    const hint = new HintFactory(layoutContext, symbolsRegistry.list())

    // ユーザーのコールバックを実行
    // この中で el.uml.actor() などが呼ばれ、symbolsRegistry に登録される
    callback(el, rel, hint)

    // DiagramSymbol を作成
    diagramSymbol = new DiagramSymbol(diagramSymbolId, this.titleOrInfo, layoutContext)
    diagramSymbol.setTheme(this.currentTheme)

    // Registry からすべての Symbol を取得
    const userSymbols = symbolsRegistry.list()

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
      hint.enclose(diagramSymbolId, userSymbols.map((s: SymbolBase) => s.id))
    }

    // レイアウト計算
    layoutContext.solveAndApply(allSymbols)

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
 * TypeDiagram - Kiwumil の型安全な図作成エントリポイント
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
 * import { TypeDiagram, UMLPlugin } from "kiwumil"
 * 
 * TypeDiagram("My Diagram")
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
 * TypeDiagram({
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
 * TypeDiagram("Mixed Diagram")
 *   .use(UMLPlugin)
 *   .theme(DarkTheme)
 *   .build((el, rel, hint) => {
 *     el.uml.actor("User")
 *     el.core.circle("Circle")  // CorePlugin はデフォルトで利用可能
 *   })
 *   .render("output.svg")
 * ```
 */
export function TypeDiagram(titleOrInfo: string | DiagramInfo): DiagramBuilder<[typeof CorePlugin]> {
  return new DiagramBuilder(titleOrInfo).use(CorePlugin)
}

// src/dsl/diagram_builder.ts
import { NamespaceBuilder } from "./namespace_builder"
import { HintFactory } from "./hint_factory"
import { SvgRenderer } from "../render/svg_renderer"
import { DiagramSymbol } from "../model/diagram_symbol"
import { CorePlugin } from "../plugin/core/plugin"
import { convertMetaUrlToSvgPath } from "../utils/path_helper"
import { LayoutContext } from "../layout/layout_context"
import type { DiagramPlugin } from "./diagram_plugin"
import type { SymbolBase } from "../model/symbol_base"
import type { RelationshipBase } from "../model/relationship_base"
import type { DiagramInfo } from "../model/diagram_info"
import type { Theme } from "../theme"
import type { BuildElementNamespace, BuildRelationshipNamespace } from "./namespace_types"
import { DefaultTheme } from "../theme"
import type { SymbolId, ContainerSymbolId } from "../model/types"
import { toContainerSymbolId } from "../model/container_symbol"
import { Symbols } from "./symbols"
import { Relationships } from "./relationships"

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
    const symbols = new Symbols()
    const relationships = new Relationships()
    const context = new LayoutContext(this.currentTheme, (id: SymbolId) => symbols.findById(id))

    const diagramInfo =
      typeof this.titleOrInfo === "string"
        ? { title: this.titleOrInfo }
        : this.titleOrInfo

    const diagramSymbol = symbols.register("__builtin__", "diagram", (symbolId) => {
      const containerId = toContainerSymbolId(symbolId)
      const diagramBound = context.variables.createBound(containerId)
      const containerBound = context.variables.createBound(`${containerId}.container`, "container")
      return new DiagramSymbol(
        {
          id: containerId,
          layout: diagramBound,
          container: containerBound,
          info: diagramInfo,
          theme: this.currentTheme,
        },
        context
      )
    }) as DiagramSymbol

    const namespaceBuilder = new NamespaceBuilder(this.plugins)
    const el = namespaceBuilder.buildElementNamespace(
      symbols,
      context,
      this.currentTheme
    )
    const rel = namespaceBuilder.buildRelationshipNamespace(
      relationships,
      context,
      this.currentTheme
    )
    const hint = new HintFactory(context, symbols)
    hint.setDefaultContainer(diagramSymbol.id as ContainerSymbolId)

    callback(el, rel, hint)

    const relationshipList = relationships.getAll()
    const symbolList = symbols.getAll().filter((symbol) => symbol.id !== diagramSymbol.id)
    const allSymbols: SymbolBase[] = [diagramSymbol, ...symbolList]

    if (symbolList.length > 0) {
      hint.enclose(
        diagramSymbol.id as ContainerSymbolId,
        symbolList.map((s) => s.id)
      )
    }

    // レイアウト計算
    context.solveAndApply(allSymbols)

    return {
      symbols: allSymbols,
      relationships: relationshipList,
      render: (target: string | ImportMeta | Element) => {
        const renderer = new SvgRenderer(allSymbols, [...relationshipList], this.currentTheme)

        if (typeof target === "string") {
          renderer.saveToFile(target)
        } else if ("url" in target) {
          const filepath = convertMetaUrlToSvgPath(target.url)
          renderer.saveToFile(filepath)
        } else {
          renderer.renderToElement(target)
        }
      },
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
export function TypeDiagram(
  titleOrInfo: string | DiagramInfo
): DiagramBuilder<[typeof CorePlugin]> {
  return new DiagramBuilder(titleOrInfo).use(CorePlugin)
}

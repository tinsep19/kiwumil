// src/dsl/diagram_builder.ts
import { NamespaceBuilder } from "./namespace_builder"
import { HintFactory } from "./hint_factory"
import { SvgRenderer } from "../render"
import { DiagramSymbol, LayoutContext, type DiagramSymbolCharacs } from "../model"
import type { DiagramInfo } from "../model"
import { CorePlugin } from "../plugin"
import { KiwiSolver } from "../kiwi"
import { convertMetaUrlToSvgPath } from "../utils"
import type { DiagramPlugin } from "./diagram_plugin"
import type { Theme } from "../theme"
import type {
  BuildElementNamespace,
  BuildRelationshipNamespace,
  BuildIconNamespace,
} from "./namespace_types"
import { DefaultTheme } from "../theme"

/**
 * IntelliSense が有効な DSL ブロックのコールバック型
 *
 * オブジェクトスタイルで `el` (element), `rel` (relationship), `hint`, `icon`, `diagram` の5つのパラメータを受け取り、
 * 型安全に図の要素を定義できる。
 */
type IntelliSenseBlock<TPlugins extends readonly DiagramPlugin[]> = (args: {
  el: BuildElementNamespace<TPlugins>
  rel: BuildRelationshipNamespace<TPlugins>
  hint: HintFactory
  icon: BuildIconNamespace<TPlugins>
  diagram: DiagramSymbolCharacs
}) => void

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
   * ダイアグラムのレイアウトを構築
   *
   * @param block - IntelliSense が有効な DSL ブロック
   * @returns レンダリング可能な図オブジェクト
   */
  layout(block: IntelliSenseBlock<TPlugins>) {
    const solver = new KiwiSolver()
    const context = new LayoutContext(solver, this.currentTheme)
    const { symbols, relationships, iconRegistry, theme } = context

    const diagramInfo =
      typeof this.titleOrInfo === "string" ? { title: this.titleOrInfo } : this.titleOrInfo

    const diagramRegistration = symbols.register("__builtin__", "diagram", (id, r) => {
      const bounds = r.createLayoutBounds("bounds")
      const container = r.createContainerBounds("container")
      const title = r.createItemBounds("title")
      const author = r.createItemBounds("author")
      const createdAt = r.createItemBounds("createdAt")
      const symbol = new DiagramSymbol({
        characs: {
          id,
          bounds,
          container,
          title,
          author,
          createdAt,
        },
        info: diagramInfo,
        theme: this.currentTheme,
      })
      r.setSymbol(symbol)
      r.setCharacs({ id, bounds, container })
      r.setConstraint((builder) => {
        symbol.ensureLayoutBounds(builder)
      })
      return r.build()
    })
    const namespaceBuilder = new NamespaceBuilder(this.plugins)

    // Create IconRegistry first - it will be shared across all icon operations
    // Build icon first namespace using NamespaceBuilder
    // build element namespace (symbols) then relationship namespace,
    //   passing icons to factories
    const icon = namespaceBuilder.buildIconNamespace(iconRegistry)
    const el = namespaceBuilder.buildElementNamespace(symbols, theme, icon)
    const rel = namespaceBuilder.buildRelationshipNamespace(relationships, theme, icon)

    const hint = new HintFactory({
      context,
      diagramContainer: diagramRegistration.characs,
    })

    // invoke callback: object-style only
    block({ el, rel, hint, icon, diagram: diagramRegistration.characs })

    // レイアウト計算
    context.solve()

    return {
      render: (target: string | ImportMeta | Element | Output) => {
        const renderer = new SvgRenderer(context)

        if (typeof target === "function") {
          // Callback pattern for tests to access renderer
          target(renderer)
        } else if (typeof target === "string") {
          saveToFile(renderer, target)
        } else if ("url" in target) {
          const filepath = convertMetaUrlToSvgPath(target.url)
          saveToFile(renderer, filepath)
        } else {
          renderToElement(renderer, target)
        }
      },
    }
  }
}
type Output = (renderer: SvgRenderer) => void;
function saveToFile(renderer: SvgRenderer, filepath: string) {
    const svg = renderer.render()

    if (typeof Bun !== "undefined" && Bun.write) {
      Bun.write(filepath, svg)
      console.log(`Saved to ${filepath}`)
    } else {
      throw new Error("File system operations are only supported in Bun environment")
    }
}
function renderToElement(renderer: SvgRenderer, el: Element) {
    const svg = renderer.render()
    el.innerHTML = svg
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
 *   .layout(({ el, rel, hint }) => {
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
 *   .layout(({ el, rel, hint }) => {
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
 *   .layout(({ el, rel, hint }) => {
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

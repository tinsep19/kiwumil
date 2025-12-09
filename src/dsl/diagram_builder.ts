// src/dsl/diagram_builder.ts
import { NamespaceBuilder } from "./namespace_builder"
import { HintFactory } from "./hint_factory"
import { SvgRenderer } from "../render"
import { DiagramSymbol, Symbols, LayoutContext } from "../model"
import type { ContainerSymbolId, DiagramInfo, SymbolBase } from "../model"
import { CorePlugin } from "../plugin"
import { convertMetaUrlToSvgPath } from "../utils"
import type { DiagramPlugin } from "./diagram_plugin"
import type { Theme } from "../theme"
import type {
  BuildElementNamespace,
  BuildRelationshipNamespace,
  BuildIconNamespace,
  PluginIcons,
} from "./namespace_types"
import { DefaultTheme } from "../theme"
import { Relationships } from "./relationships"
import { IconLoader } from "../icon"

/**
 * IntelliSense が有効な DSL ブロックのコールバック型
 *
 * オブジェクトスタイルで `el` (element), `rel` (relationship), `hint`, `icon` の4つのパラメータを受け取り、
 * 型安全に図の要素を定義できる。
 */
type IntelliSenseBlock<TPlugins extends readonly DiagramPlugin[]> = (
  args: {
    el: BuildElementNamespace<TPlugins>
    rel: BuildRelationshipNamespace<TPlugins>
    hint: HintFactory
    icon: Record<string, PluginIcons>
  }
) => void

type RegisterIconsParam = Parameters<NonNullable<DiagramPlugin["registerIcons"]>>[0]
type CreateRegistrar = RegisterIconsParam["createRegistrar"]

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
    const context = new LayoutContext(this.currentTheme)
    const symbols = new Symbols(context.variables)
    const relationships = new Relationships()

    const diagramInfo =
      typeof this.titleOrInfo === "string" ? { title: this.titleOrInfo } : this.titleOrInfo

    const diagramSymbol = symbols.register("__builtin__", "diagram", (id, r) => {
      const diagramBound = r.createBounds("layout", "layout")
      const containerBound = r.createBounds("container", "container")
      const symbol = new DiagramSymbol(
        {
          id,
          layout: diagramBound,
          container: containerBound,
          info: diagramInfo,
          theme: this.currentTheme,
        },
        context
      )
      r.setSymbol(symbol)
      r.setCharacs({id, layout: diagramBound, container: containerBound})
      r.setConstraint((builder) => {
        symbol.ensureLayoutBounds(builder)
      })
      return r.build()
    }).symbol as DiagramSymbol

    const namespaceBuilder = new NamespaceBuilder(this.plugins)

    // Icon loaders registered by plugins (build icons first)
    const icon_loaders: Record<string, IconLoader> = {}
    for (const plugin of this.plugins) {
      if (typeof plugin.registerIcons === 'function') {
        const createRegistrar: CreateRegistrar = (pluginName, importMeta, iconRegistrationBlock) => {
          const loader = new IconLoader(pluginName, importMeta?.url ?? '')
          iconRegistrationBlock(loader)
          icon_loaders[pluginName] = loader
        }

        plugin.registerIcons({
          createRegistrar,
        })
      }
    }

    // create separate icon namespace: icon.<plugin>.<name>() -> IconMeta | null
    const icon: BuildIconNamespace<TPlugins> = {} as BuildIconNamespace<TPlugins>
    const iconRegistry = icon as Record<string, PluginIcons>
    for (const [pluginName, loader] of Object.entries(icon_loaders)) {
      iconRegistry[pluginName] = {}
      for (const name of loader.list()) {
        // use sync loader if available
        iconRegistry[pluginName]![name] = () => (typeof loader.load_sync === 'function' ? loader.load_sync(name) : null)
      }
    }

    // build element namespace (symbols) then relationship namespace, passing icons to factories
    const el = namespaceBuilder.buildElementNamespace(symbols, this.currentTheme, icon)
    const rel = namespaceBuilder.buildRelationshipNamespace(
      relationships,
      this.currentTheme,
      icon
    )

    const hint = new HintFactory({
      context,
      symbols,
      diagramContainer: diagramSymbol.id as ContainerSymbolId,
    })

    // invoke callback: object-style only
    callback({ el, rel, hint, icon })

    const relationshipList = relationships.getAll()
    const symbolList = symbols.getAll().filter((reg) => reg.symbol.id !== diagramSymbol.id).map((reg) => reg.symbol as SymbolBase)
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
 *   .build(({ el, rel, hint }) => {
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
 *   .build(({ el, rel, hint }) => {
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
 *   .build(({ el, rel, hint }) => {
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

// src/dsl/namespace_builder.ts
import type { DiagramPlugin } from "./diagram_plugin"
import type { BuildElementNamespace, BuildRelationshipNamespace, BuildIconNamespace } from "./namespace_types"
import type { LayoutContext } from "../layout"
import type { Symbols } from "./symbols"
import type { Relationships } from "./relationships"
import type { Theme } from "../theme"
import { IconLoader } from "../icon"
import type { IconMeta } from "../icon"

type RegisterIconsParam = Parameters<NonNullable<DiagramPlugin["registerIcons"]>>[0]
type IconRegistrarCreateLoader = RegisterIconsParam["createLoader"]

/**
 * Namespace Builder
 *
 * プラグイン一覧から ElementNamespace と RelationshipNamespace を構築する
 */
export class NamespaceBuilder<TPlugins extends readonly DiagramPlugin[]> {
  private plugins: TPlugins

  constructor(plugins: TPlugins) {
    this.plugins = plugins
  }

  /**
   * Element Namespace を構築
   *
   * @param symbols - Symbol を管理するインスタンス
   * @returns プラグイン名をキーとした Symbol ファクトリのオブジェクト
   *
   * @example
   * ```typescript
   * const el = builder.buildElementNamespace(symbols)
   * const userId = el.uml.actor("User")
   * ```
   */
  buildElementNamespace(
    symbols: Symbols,
    layout: LayoutContext,
    theme: Theme
  ): BuildElementNamespace<TPlugins> {
    const namespace: Record<string, unknown> = {}

    for (const plugin of this.plugins) {
      if (typeof plugin.createSymbolFactory === "function") {
        namespace[plugin.name] = plugin.createSymbolFactory(symbols, layout, theme)
      }
    }

    return namespace as BuildElementNamespace<TPlugins>
  }

  /**
   * Relationship Namespace を構築
   *
   * @param relationships - Relationship を管理するインスタンス
   * @returns プラグイン名をキーとした Relationship ファクトリのオブジェクト
   *
   * @example
   * ```typescript
   * const rel = builder.buildRelationshipNamespace(relationships)
   * const relationId = rel.uml.associate(userId, systemId)
   * ```
   */
  buildRelationshipNamespace(
    relationships: Relationships,
    layout: LayoutContext,
    theme: Theme
  ): BuildRelationshipNamespace<TPlugins> {
    const namespace: Record<string, unknown> = {}

    for (const plugin of this.plugins) {
      if (typeof plugin.createRelationshipFactory === "function") {
        namespace[plugin.name] = plugin.createRelationshipFactory(relationships, layout, theme)
      }
    }

    return namespace as BuildRelationshipNamespace<TPlugins>
  }

  /**
   * Icon Namespace を構築
   *
   * プラグインが registerIcons を提供している場合、簡易的な loader を生成して
   * BuildIconNamespace 型に従ったオブジェクトを返す（同期 API を想定）。
   */
  buildIconNamespace(): BuildIconNamespace<TPlugins> {
    const namespace: Record<string, Record<string, () => IconMeta | null>> = {}

    for (const plugin of this.plugins) {
      if (typeof plugin.registerIcons === 'function') {
        const pluginName = plugin.name
        const loader = new IconLoader(pluginName, '')
        // call registerIcons to let plugin register icons into our loader
        const createLoader: IconRegistrarCreateLoader = (_p, _importMeta, cb) => cb(loader)
        plugin.registerIcons({
          createLoader,
        })

        namespace[pluginName] = {}
        for (const name of loader.list()) {
          namespace[pluginName][name] = () => loader.load_sync(name)
        }
      }
    }

    return namespace as BuildIconNamespace<TPlugins>
  }
}

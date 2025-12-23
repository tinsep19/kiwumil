// src/dsl/namespace_builder.ts
import type { DiagramPlugin } from "./diagram_plugin"
import type {
  BuildElementNamespace,
  BuildRelationshipNamespace,
  BuildIconNamespace,
  PluginIcons,
} from "./namespace_types"
import type { Symbols, Relationships } from "../model"
import type { Theme } from "../theme"

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
    theme: Theme,
    icons: BuildIconNamespace<TPlugins>
  ): BuildElementNamespace<TPlugins> {
    const namespace: Record<string, unknown> = {}
    const iconNamespace = icons as Record<string, PluginIcons>

    for (const plugin of this.plugins) {
      if (typeof plugin.createSymbolFactory === "function") {
        const pluginIcons = iconNamespace[plugin.name] || {}
        namespace[plugin.name] = plugin.createSymbolFactory(
          symbols,
          theme,
          pluginIcons as PluginIcons
        )
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
    theme: Theme,
    icons: BuildIconNamespace<TPlugins>
  ): BuildRelationshipNamespace<TPlugins> {
    const namespace: Record<string, unknown> = {}
    const iconNamespace = icons as Record<string, PluginIcons>

    for (const plugin of this.plugins) {
      if (typeof plugin.createRelationshipFactory === "function") {
        const pluginIcons = iconNamespace[plugin.name] || {}
        namespace[plugin.name] = plugin.createRelationshipFactory(
          relationships,
          theme,
          pluginIcons as PluginIcons
        )
      }
    }

    return namespace as BuildRelationshipNamespace<TPlugins>
  }
}

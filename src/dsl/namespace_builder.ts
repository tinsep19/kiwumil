// src/dsl/namespace_builder.ts
import type { DiagramPlugin } from "./diagram_plugin"
import type { RelationshipBase } from "../model/relationship_base"
import type { BuildElementNamespace, BuildRelationshipNamespace } from "./namespace_types"
import type { LayoutContext } from "../layout/layout_context"
import type { SymbolsRegistry } from "../symbols/registry"

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
   * @param registry - シンボルを登録する SymbolsRegistry
   * @param layout - レイアウトコンテキスト
   * @returns プラグイン名をキーとした Symbol ファクトリのオブジェクト
   * 
   * @example
   * ```typescript
   * const el = builder.buildElementNamespace(registry, layout)
   * const userId = el.uml.actor("User")
   * ```
   */
  buildElementNamespace(
    registry: SymbolsRegistry,
    layout: LayoutContext
  ): BuildElementNamespace<TPlugins> {
    const namespace: Record<string, unknown> = {}

    for (const plugin of this.plugins) {
      if (typeof plugin.createSymbolFactory === "function") {
        namespace[plugin.name] = plugin.createSymbolFactory(registry, layout)
      }
    }

    return namespace as BuildElementNamespace<TPlugins>
  }

  /**
   * Relationship Namespace を構築
   * 
   * @param relationships - Relationship を格納する配列
   * @returns プラグイン名をキーとした Relationship ファクトリのオブジェクト
   * 
   * @example
   * ```typescript
   * const rel = builder.buildRelationshipNamespace(relationships)
   * const relationId = rel.uml.associate(userId, systemId)
   * ```
   */
  buildRelationshipNamespace(
    relationships: RelationshipBase[],
    layout: LayoutContext
  ): BuildRelationshipNamespace<TPlugins> {
    const namespace: Record<string, unknown> = {}

    for (const plugin of this.plugins) {
      if (typeof plugin.createRelationshipFactory === "function") {
        namespace[plugin.name] = plugin.createRelationshipFactory(relationships, layout)
      }
    }

    return namespace as BuildRelationshipNamespace<TPlugins>
  }
}

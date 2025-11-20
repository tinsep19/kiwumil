// src/dsl/namespace_builder.ts
import type { DiagramPlugin } from "./diagram_plugin"
import type { SymbolBase } from "../model/symbol_base"
import type { RelationshipBase } from "../model/relationship_base"
import type { BuildElementNamespace, BuildRelationshipNamespace } from "./namespace_types"
import type { LayoutContext } from "../layout/layout_context"
import type { Symbols } from "./symbols"
import type { Relationships } from "./relationships"

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
    layout: LayoutContext
  ): BuildElementNamespace<TPlugins> {
    const namespace: Record<string, unknown> = {}

    for (const plugin of this.plugins) {
      if (typeof plugin.createSymbolFactory === "function") {
        namespace[plugin.name] = plugin.createSymbolFactory(symbols, layout)
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

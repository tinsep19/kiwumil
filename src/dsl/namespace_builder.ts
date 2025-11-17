// src/dsl/namespace_builder.ts
import type { DiagramPlugin } from "./diagram_plugin"
import type { SymbolBase } from "../model/symbol_base"
import type { RelationshipBase } from "../model/relationship_base"
import type { BuildElementNamespace, BuildRelationshipNamespace } from "./namespace_types"

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
   * @param userSymbols - Symbol を格納する配列
   * @returns プラグイン名をキーとした Symbol ファクトリのオブジェクト
   * 
   * @example
   * ```typescript
   * const el = builder.buildElementNamespace(symbols)
   * const userId = el.uml.actor("User")
   * ```
   */
  buildElementNamespace(
    userSymbols: SymbolBase[]
  ): BuildElementNamespace<TPlugins> {
    const namespace = {} as any

    for (const plugin of this.plugins) {
      if (typeof plugin.createSymbolFactory === "function") {
        namespace[plugin.name] = plugin.createSymbolFactory(userSymbols)
      }
    }

    return namespace
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
    relationships: RelationshipBase[]
  ): BuildRelationshipNamespace<TPlugins> {
    const namespace = {} as any

    for (const plugin of this.plugins) {
      if (typeof plugin.createRelationshipFactory === "function") {
        namespace[plugin.name] = plugin.createRelationshipFactory(relationships)
      }
    }

    return namespace
  }
}

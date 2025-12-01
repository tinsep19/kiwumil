// src/plugin/uml/plugin.ts
import {
  ActorSymbol,
  SystemBoundarySymbol,
  UsecaseSymbol,
} from "./symbols"
import {
  Association,
  Extend,
  Generalize,
  Include,
} from "./relationships"
import type { DiagramPlugin } from "../../dsl"
import type { RelationshipId } from "../../model"
import { toContainerSymbolId } from "../../model"
import type { LayoutContext } from "../../layout"
import type { Symbols } from "../../dsl"
import type { Relationships } from "../../dsl"
import type { Theme } from "../../theme"
import { toSymbolId, type SymbolOrId } from "../../dsl"

/**
 * UML Plugin (Namespace-based)
 *
 * UML 図のための Symbol と Relationship を提供する
 */
export const UMLPlugin = {
  name: "uml",

  createSymbolFactory(symbols: Symbols, context: LayoutContext, theme: Theme) {
    const plugin = this.name

    return {
      /**
       * Actor Symbol を作成
       * @param label - Actor のラベル
       * @returns 生成された ActorSymbol
       */
      actor(label: string): ActorSymbol {
        return symbols.register(plugin, "actor", (symbolId) => {
          const bound = context.variables.createBound(symbolId)
          const actor = new ActorSymbol({
            id: symbolId,
            layout: bound,
            label,
            theme,
          })
          context.constraints.withSymbol(symbolId, "symbolBounds", (builder) => {
            actor.ensureLayoutBounds(builder)
          })
          return actor
        })
      },

      /**
       * Usecase Symbol を作成
       * @param label - Usecase のラベル
       * @returns 生成された UsecaseSymbol
       */
      usecase(label: string): UsecaseSymbol {
        return symbols.register(plugin, "usecase", (symbolId) => {
          const bound = context.variables.createBound(symbolId)
          const usecase = new UsecaseSymbol({
            id: symbolId,
            layout: bound,
            label,
            theme,
          })
          context.constraints.withSymbol(symbolId, "symbolBounds", (builder) => {
            usecase.ensureLayoutBounds(builder)
          })
          return usecase
        })
      },

      /**
       * System Boundary Symbol を作成
       * @param label - System Boundary のラベル
       * @returns 生成された SystemBoundarySymbol
       */
      systemBoundary(label: string): SystemBoundarySymbol {
        return symbols.register(plugin, "systemBoundary", (symbolId) => {
          const id = toContainerSymbolId(symbolId)
          const bound = context.variables.createBound(id)
          const container = context.variables.createBound(`${id}.container`, "container")
          const boundary = new SystemBoundarySymbol({
            id,
            layout: bound,
            container,
            label,
            theme,
          })
          context.constraints.withSymbol(id, "containerInbounds", (builder) => {
            boundary.ensureLayoutBounds(builder)
          })
          return boundary
        })
      },
    }
  },

  createRelationshipFactory(relationships: Relationships, _context: LayoutContext, theme: Theme) {
    const plugin = this.name

    return {
      /**
       * Association Relationship を作成
       * @param from - 開始 Symbol（SymbolBase または SymbolId）
       * @param to - 終了 Symbol（SymbolBase または SymbolId）
       * @returns 生成された RelationshipId
       */
      associate(from: SymbolOrId, to: SymbolOrId): RelationshipId {
        const relationship = relationships.register(
          plugin,
          "association",
          (id) =>
            new Association({
              id,
              from: toSymbolId(from),
              to: toSymbolId(to),
              theme,
            })
        )
        return relationship.id
      },

      /**
       * Include Relationship を作成
       * @param from - 開始 Symbol（SymbolBase または SymbolId）
       * @param to - 終了 Symbol（SymbolBase または SymbolId）
       * @returns 生成された RelationshipId
       */
      include(from: SymbolOrId, to: SymbolOrId): RelationshipId {
        const relationship = relationships.register(
          plugin,
          "include",
          (id) =>
            new Include({
              id,
              from: toSymbolId(from),
              to: toSymbolId(to),
              theme,
            })
        )
        return relationship.id
      },

      /**
       * Extend Relationship を作成
       * @param from - 開始 Symbol（SymbolBase または SymbolId）
       * @param to - 終了 Symbol（SymbolBase または SymbolId）
       * @returns 生成された RelationshipId
       */
      extend(from: SymbolOrId, to: SymbolOrId): RelationshipId {
        const relationship = relationships.register(
          plugin,
          "extend",
          (id) =>
            new Extend({
              id,
              from: toSymbolId(from),
              to: toSymbolId(to),
              theme,
            })
        )
        return relationship.id
      },

      /**
       * Generalize Relationship を作成
       * @param from - 開始 Symbol（SymbolBase または SymbolId）
       * @param to - 終了 Symbol（SymbolBase または SymbolId）
       * @returns 生成された RelationshipId
       */
      generalize(from: SymbolOrId, to: SymbolOrId): RelationshipId {
        const relationship = relationships.register(
          plugin,
          "generalize",
          (id) =>
            new Generalize({
              id,
              from: toSymbolId(from),
              to: toSymbolId(to),
              theme,
            })
        )
        return relationship.id
      },
    }
  },
} as const satisfies DiagramPlugin

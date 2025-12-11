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
import type { DiagramPlugin, PluginIcons, Relationships, Symbols } from "../../dsl"
import type { RelationshipId } from "../../model"
import type { Theme } from "../../theme"
import { toSymbolId, type SymbolOrId } from "../../dsl"

/**
 * UML Plugin (Namespace-based)
 *
 * UML 図のための Symbol と Relationship を提供する
 */
export const UMLPlugin = {
  name: "uml",

  createSymbolFactory(symbols: Symbols, theme: Theme, _icons: PluginIcons) {
    const plugin = this.name

    return {
      /**
       * Actor Symbol を作成
       * @param label - Actor のラベル
       * @returns 生成された Actor の ISymbolCharacs
       */
      actor(label: string) {
        return symbols.register(plugin, "actor", (symbolId, r) => {
          const bound = r.createBounds("layout", "layout")
          const actor = new ActorSymbol({
            id: symbolId,
            layout: bound,
            label,
            theme,
          })
          r.setSymbol(actor)
          r.setCharacs({ id: symbolId, layout: bound })
          r.setConstraint((builder) => {
            actor.ensureLayoutBounds(builder)
          })
          return r.build()
        }).characs
      },

      /**
       * Usecase Symbol を作成
       * @param label - Usecase のラベル
       * @returns 生成された Usecase の ISymbolCharacs
       */
      usecase(label: string) {
        return symbols.register(plugin, "usecase", (symbolId, r) => {
          const bound = r.createBounds("layout", "layout")
          const usecase = new UsecaseSymbol({
            id: symbolId,
            layout: bound,
            label,
            theme,
          })
          r.setSymbol(usecase)
          r.setCharacs({ id: symbolId, layout: bound })
          r.setConstraint((builder) => {
            usecase.ensureLayoutBounds(builder)
          })
          return r.build()
        }).characs
      },

      /**
       * System Boundary Symbol を作成
       * @param label - System Boundary のラベル
       * @returns 生成された SystemBoundary の ISymbolCharacs
       */
      systemBoundary(label: string) {
        return symbols.register(plugin, "systemBoundary", (symbolId, r) => {
          const bound = r.createBounds("layout", "layout")
          const container = r.createBounds("container", "container")
          const boundary = new SystemBoundarySymbol({
            id: symbolId,
            layout: bound,
            container,
            label,
            theme,
          })
          r.setSymbol(boundary)
          r.setCharacs({ id: symbolId, layout: bound, container })
          r.setConstraint((builder) => {
            boundary.ensureLayoutBounds(builder)
          })
          return r.build()
        }).characs
      },
    }
  },

  createRelationshipFactory(relationships: Relationships, theme: Theme, _icons: PluginIcons) {
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

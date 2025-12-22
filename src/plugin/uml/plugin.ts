// src/plugin/uml/plugin.ts
import { ActorSymbol, SystemBoundarySymbol, UsecaseSymbol } from "./symbols"
import { Association, Extend, Generalize, Include } from "./relationships"
import type { DiagramPlugin, PluginIcons, Relationships, Symbols } from "../../dsl"
import type { RelationshipId } from "../../model"
import type { Theme } from "../../theme"
import type { IContainerSymbolCharacs } from "../../core"
import { toSymbolId, type SymbolOrId } from "../../dsl"
import type { IconRegistry } from "../../icon"

/**
 * UML Plugin (Namespace-based)
 *
 * UML 図のための Symbol と Relationship を提供する
 */
export const UMLPlugin = {
  name: "uml",

  createIconFactory(registry: IconRegistry) {
    const loaderFactory = registry.createLoaderFactory(this.name, import.meta)
    return {
      actor: loaderFactory.cacheLoader("icons/actor.svg"),
    }
  },

  createSymbolFactory(symbols: Symbols, theme: Theme, icons: PluginIcons) {
    const plugin = this.name

    return {
      /**
       * Create Actor Symbol
       * @param labelOrOptions - Actor label or options object
       * @returns Generated Actor's ISymbolCharacs
       */
      actor(labelOrOptions: string | { label: string; stereotype?: string }) {
        const label = typeof labelOrOptions === "string" ? labelOrOptions : labelOrOptions.label
        const stereotype =
          typeof labelOrOptions === "string" ? undefined : labelOrOptions.stereotype

        return symbols.register(plugin, "actor", (symbolId, r) => {
          const bound = r.createLayoutBounds("layout")
          const iconBounds = r.createItemBounds("icon")
          const labelBounds = r.createItemBounds("label")
          const stereotypeBounds = stereotype ? r.createItemBounds("stereotype") : undefined

          // Get icon from icons factory
          const iconGetter = icons.actor
          if (!iconGetter) {
            throw new Error("Actor icon is not available")
          }
          const iconMeta = iconGetter()

          const actor = new ActorSymbol({
            label,
            stereotype,
            icon: iconMeta,
            characs: {
              id: symbolId,
              bounds: bound,
              iconBounds,
              labelBounds,
              stereotypeBounds,
            },
            theme,
          })
          r.setSymbol(actor)
          r.setCharacs({ id: symbolId, bounds: bound })
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
          const bound = r.createLayoutBounds("layout")
          const usecase = new UsecaseSymbol({
            id: symbolId,
            bounds: bound,
            label,
            theme,
          })
          r.setSymbol(usecase)
          r.setCharacs({ id: symbolId, bounds: bound })
          r.setConstraint((builder) => {
            usecase.ensureLayoutBounds(builder)
          })
          return r.build()
        }).characs
      },

      /**
       * System Boundary Symbol を作成
       * @param label - System Boundary のラベル
       * @returns 生成された SystemBoundary の IContainerSymbolCharacs
       */
      systemBoundary(label: string): IContainerSymbolCharacs {
        return symbols.register(plugin, "systemBoundary", (symbolId, r) => {
          const bound = r.createLayoutBounds("layout")
          const container = r.createContainerBounds("container")
          const boundary = new SystemBoundarySymbol({
            id: symbolId,
            bounds: bound,
            container,
            label,
            theme,
          })
          r.setSymbol(boundary)
          r.setCharacs({ id: symbolId, bounds: bound, container } satisfies IContainerSymbolCharacs)
          r.setConstraint((builder) => {
            boundary.ensureLayoutBounds(builder)
          })
          return r.build()
        }).characs as IContainerSymbolCharacs
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

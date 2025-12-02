// src/dsl/namespace_types.ts
import type { DiagramPlugin } from "./diagram_plugin"
import type { LayoutContext } from "../layout"
import type { Symbols } from "../model"
import type { Relationships } from "./relationships"
import type { Theme } from "../theme"
import type { RelationshipId, SymbolBase } from "../model"
import type { IconMeta } from "../icon"

export type PluginIcons = Record<string, () => IconMeta | null>

/* eslint-disable @typescript-eslint/no-explicit-any */
type SymbolEnabledPlugins<TPlugins extends readonly DiagramPlugin[]> = Extract<
  TPlugins[number],
  {
    createSymbolFactory: (
      symbols: Symbols,
      context: LayoutContext,
      theme: Theme,
      icons: Record<string, () => IconMeta | null>
    ) => Record<string, (...args: any[]) => SymbolBase>
  }
>

type RelationshipEnabledPlugins<TPlugins extends readonly DiagramPlugin[]> = Extract<
  TPlugins[number],
  {
    createRelationshipFactory: (
      relationships: Relationships,
      context: LayoutContext,
      theme: Theme,
      icons: Record<string, () => IconMeta | null>
    ) => Record<string, (...args: any[]) => RelationshipId>
  }
>
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * プラグイン配列から ElementNamespace 型を生成
 *
 * @example
 * ```typescript
 * type Plugins = [typeof UMLPlugin, typeof SequencePlugin]
 * type El = BuildElementNamespace<Plugins>
 * // => { uml: {...}, sequence: {...} }
 * ```
 */
export type BuildElementNamespace<TPlugins extends readonly DiagramPlugin[]> = {
  [K in SymbolEnabledPlugins<TPlugins>["name"]]: ReturnType<
    Extract<SymbolEnabledPlugins<TPlugins>, { name: K }>["createSymbolFactory"]
  >
}

/**
 * プラグイン配列から RelationshipNamespace 型を生成
 *
 * @example
 * ```typescript
 * type Plugins = [typeof UMLPlugin, typeof SequencePlugin]
 * type Rel = BuildRelationshipNamespace<Plugins>
 * // => { uml: {...}, sequence: {...} }
 * ```
 */
export type BuildRelationshipNamespace<TPlugins extends readonly DiagramPlugin[]> = {
  [K in RelationshipEnabledPlugins<TPlugins>["name"]]: ReturnType<
    Extract<RelationshipEnabledPlugins<TPlugins>, { name: K }>["createRelationshipFactory"]
  >
}

// Icon namespace types
type IconEnabledPlugins<TPlugins extends readonly DiagramPlugin[]> = Extract<
  TPlugins[number],
  {
    registerIcons: NonNullable<DiagramPlugin["registerIcons"]>
  }
>

export type IconFactory = () => IconMeta | null

export type BuildIconNamespace<TPlugins extends readonly DiagramPlugin[]> = {
  [K in IconEnabledPlugins<TPlugins>["name"]]: PluginIcons
}

// src/dsl/namespace_types.ts
import type { DiagramPlugin } from "./diagram_plugin"
import type { Symbols } from "../model"
import type { Relationships } from "./relationships"
import type { Theme } from "../theme"
import type { RelationshipId } from "../model"
import type { IconMeta } from "../icon"
import type { ISymbolCharacs } from "../core"

export type PluginIcons = Record<string, () => IconMeta>

/* eslint-disable @typescript-eslint/no-explicit-any */
type SymbolEnabledPlugins<TPlugins extends readonly DiagramPlugin[]> = Extract<
  TPlugins[number],
  {
    createSymbolFactory: (
      symbols: Symbols,
      theme: Theme,
      icons: Record<string, () => IconMeta>
    ) => Record<string, (...args: any[]) => ISymbolCharacs>
  }
>

type RelationshipEnabledPlugins<TPlugins extends readonly DiagramPlugin[]> = Extract<
  TPlugins[number],
  {
    createRelationshipFactory: (
      relationships: Relationships,
      theme: Theme,
      icons: Record<string, () => IconMeta>
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
    createIconFactory: NonNullable<DiagramPlugin["createIconFactory"]>
  }
>

export type IconFactory = () => IconMeta | null

export type BuildIconNamespace<TPlugins extends readonly DiagramPlugin[]> = {
  [K in IconEnabledPlugins<TPlugins>["name"]]: PluginIcons
}

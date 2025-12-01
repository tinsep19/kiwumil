// src/dsl/namespace_types.ts
import type { DiagramPlugin } from "./diagram_plugin"
import type { LayoutContext } from "../layout"
import type { Symbols } from "./symbols"
import type { Relationships } from "./relationships"
import type { Theme } from "../theme"
import type { RelationshipId, SymbolBase } from "../model"

type SymbolEnabledPlugins<TPlugins extends readonly DiagramPlugin[]> = Extract<
  TPlugins[number],
  {
    createSymbolFactory: (
      symbols: Symbols,
      context: LayoutContext,
      theme: Theme
    ) => Record<string, (...args: any[]) => SymbolBase>
  }
>

type RelationshipEnabledPlugins<TPlugins extends readonly DiagramPlugin[]> = Extract<
  TPlugins[number],
  {
    createRelationshipFactory: (
      relationships: Relationships,
      context: LayoutContext,
      theme: Theme
    ) => Record<string, (...args: any[]) => RelationshipId>
  }
>

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

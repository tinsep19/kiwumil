// src/core/layout_hint.ts
// HintTarget interface definition and DSL builder interfaces

import type { BoundId } from "./types"
import type { LayoutBounds, ContainerBounds } from "./bounds"

/**
 * HintTarget: 制約適用の対象となるシンボルの境界情報
 */
export interface HintTarget {
  readonly boundId: BoundId
  readonly bounds: LayoutBounds
  readonly container?: ContainerBounds
}

// ============================================================================
// TypeScript Utility Types for Field Selection
// ============================================================================

/**
 * MinimalTarget: Extract only boundId and bounds from HintTarget
 * Useful for operations that don't need container information
 */
export type MinimalTarget = Pick<HintTarget, "boundId" | "bounds">

/**
 * TargetWithContainer: Require container field to be present
 * Used for nested layout operations that must have a parent container
 */
export type TargetWithContainer = Required<HintTarget>

/**
 * BoundsOnlyTarget: Target without boundId
 * For operations focused purely on spatial relationships
 */
export type BoundsOnlyTarget = Omit<HintTarget, "boundId">

// ============================================================================
// Fluent Builder Generic Type Generator
// ============================================================================

/**
 * ============================================================
 * Fluent Builder (TypeScript) - Generic Type Generator
 *  - FluentSpec を「初期子/必須/グループ必須/オプション/グループオプション/終端子」で規定
 *  - BuildFluent<Spec> で fluent builder の型を生成
 *  - required / requiredGroups が満たされるまで terminal は補完に出ない
 *  - optionalGroup は「グループ内のどれか1つ」を最大1回だけ（呼ぶと補完から消える）
 * ============================================================
 */

type Fn = (...a: any[]) => any;

/**
 * FluentSpec:
 * - init: 初期子（入口）。ここからチェーンが開始される
 * - required: AND必須（全て呼ぶ必要がある）
 * - requiredGroups: OR必須（各グループからどれか1つ必要）
 * - optional: 通常オプション（何回でも可）
 * - optionalGroup: ORオプション（各グループで最大1回）
 * - terminal: 終端子（複数可）。必須を満たした時だけ呼べる
 */
export type FluentSpec = {
  init: Record<string, Fn>;

  required?: Record<string, Fn>;
  requiredGroups?: Record<string, Record<string, Fn>>;

  optional?: Record<string, Fn>;
  optionalGroup?: Record<string, Record<string, Fn>>;

  terminal: Record<string, Fn>;
};

// ---- 型ユーティリティ
type Args<F> = F extends (...a: infer A) => any ? A : never;
type Ret<F>  = F extends (...a: any[]) => infer R ? R : never;

type Keys<T> = keyof T & string;
type ObjKeys<T> = T extends Record<string, any> ? Keys<T> : never;

type RequiredKeys<T extends FluentSpec> = ObjKeys<NonNullable<T["required"]>>;
type RequiredGroupNames<T extends FluentSpec> = ObjKeys<NonNullable<T["requiredGroups"]>>;

// ---- Builder生成
export type BuildFluent<T extends FluentSpec> = {
  [K in keyof T["init"] & string]: (
    ...a: Args<T["init"][K]>
  ) => Chain<
    T,
    RequiredKeys<T>,          // 未完了 required（AND）
    RequiredGroupNames<T>,    // 未完了 requiredGroups（OR）
    never                     // ロック済み optionalGroup 名集合
  >;
};

type Chain<
  T extends FluentSpec,
  REQ extends string,     // 未完了 required（AND）
  REQG extends string,    // 未完了 requiredGroups（OR）
  OPTG_LOCKED extends string
> =
  // ---- required（AND）----
  (T["required"] extends Record<string, Fn>
    ? {
        [K in keyof T["required"] & string]:
          K extends REQ
            ? (...a: Args<T["required"][K]>) =>
                Chain<T, Exclude<REQ, K>, REQG, OPTG_LOCKED>
            : never;
      }
    : {})
  &
  // ---- requiredGroups（OR 必須）----
  (T["requiredGroups"] extends Record<string, Record<string, Fn>>
    ? {
        [G in keyof T["requiredGroups"] & string]:
          G extends REQG
            ? {
                [M in keyof T["requiredGroups"][G] & string]:
                  (...a: Args<T["requiredGroups"][G][M]>) =>
                    Chain<T, REQ, Exclude<REQG, G>, OPTG_LOCKED>;
              }
            : { [M in keyof T["requiredGroups"][G] & string]: never };
      }[keyof T["requiredGroups"] & string]
    : {})
  &
  // ---- optional（何回でもOK）----
  (T["optional"] extends Record<string, Fn>
    ? {
        [K in keyof T["optional"] & string]:
          (...a: Args<T["optional"][K]>) =>
            Chain<T, REQ, REQG, OPTG_LOCKED>;
      }
    : {})
  &
  // ---- optionalGroup（OR オプション・最大1回）----
  (T["optionalGroup"] extends Record<string, Record<string, Fn>>
    ? {
        [G in keyof T["optionalGroup"] & string]:
          G extends OPTG_LOCKED
            ? { [M in keyof T["optionalGroup"][G] & string]: never } // 補完から消える
            : {
                [M in keyof T["optionalGroup"][G] & string]:
                  (...a: Args<T["optionalGroup"][G][M]>) =>
                    Chain<T, REQ, REQG, OPTG_LOCKED | G>;
              };
      }[keyof T["optionalGroup"] & string]
    : {})
  &
  // ---- terminal（required + requiredGroups 完了で解禁）----
  (REQ extends never
    ? (REQG extends never
        ? {
            [K in keyof T["terminal"] & string]:
              (...a: Args<T["terminal"][K]>) => Ret<T["terminal"][K]>;
          }
        : {})
    : {});

// ============================================================================
// Fluent DSL Builder Specifications and Types
// ============================================================================

/**
 * ArrangeSpec: Specification for arrange builder
 * 
 * Required: axis selection (x or y)
 * Optional: gap setting
 * Terminal: in (finalize with container)
 * 
 * @example
 * ```typescript
 * hint.arrange(targets)
 *   .x()              // Required: Select horizontal axis
 *   .gap(30)          // Optional: 30px spacing
 *   .in(container)    // Terminal: Finalize in container
 * ```
 */
export type ArrangeSpec = {
  init: {
    arrange: (targets: HintTarget[]) => void;
  };
  requiredGroups: {
    axis: {
      x: () => void;
      y: () => void;
    };
  };
  optional: {
    gap: (space: number) => void;
  };
  terminal: {
    in: (container: ContainerBounds) => void;
  };
};

/**
 * ArrangeBuilder: Type-safe fluent builder for sequential arrangements
 * 
 * Generated from ArrangeSpec using BuildFluent.
 * Ensures axis is selected before terminal methods are available.
 */
export type ArrangeBuilder = BuildFluent<ArrangeSpec>;

/**
 * FlowSpec: Specification for flow builder
 * 
 * Required: direction selection (horizontal or vertical)
 * Optional: wrap threshold and gap setting
 * Terminal: in (finalize with container)
 * 
 * @example
 * ```typescript
 * hint.flow(targets)
 *   .horizontal()     // Required: Flow left-to-right
 *   .wrap(400)        // Optional: Wrap at 400px
 *   .gap(10)          // Optional: 10px spacing
 *   .in(container)    // Terminal: Finalize
 * ```
 */
export type FlowSpec = {
  init: {
    flow: (targets: HintTarget[]) => void;
  };
  requiredGroups: {
    direction: {
      horizontal: () => void;
      vertical: () => void;
    };
  };
  optional: {
    wrap: (threshold: number) => void;
    gap: (space: number) => void;
  };
  terminal: {
    in: (container: ContainerBounds) => void;
  };
};

/**
 * FlowBuilder: Type-safe fluent builder for flowing layouts with wrapping
 * 
 * Generated from FlowSpec using BuildFluent.
 * Similar to CSS flexbox - ensures direction is selected before terminal.
 */
export type FlowBuilder = BuildFluent<FlowSpec>;

/**
 * AlignSpec: Specification for align builder
 * 
 * Required groups: one alignment method must be selected
 * Terminal: all alignment methods are terminal (directly apply constraints)
 * 
 * @example
 * ```typescript
 * hint.align(targets).left()      // Align left edges
 * hint.align(targets).centerX()   // Align horizontal centers
 * hint.align(targets).size()      // Align both width and height
 * ```
 */
export type AlignSpec = {
  init: {
    align: (targets: HintTarget[]) => void;
  };
  terminal: {
    left: () => void;
    right: () => void;
    top: () => void;
    bottom: () => void;
    centerX: () => void;
    centerY: () => void;
    width: () => void;
    height: () => void;
    size: () => void;
  };
};

/**
 * AlignBuilder: Type-safe fluent builder for alignment constraints
 * 
 * Generated from AlignSpec using BuildFluent.
 * All methods are terminal and directly apply alignment constraints.
 */
export type AlignBuilder = BuildFluent<AlignSpec>;


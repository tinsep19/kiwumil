/**
 * ============================================================
 * Fluent Builder (TypeScript) - Generic Type Generator
 *  - FluentSpec を「初期子/必須/グループ必須/オプション/グループオプション/終端子」で規定
 *  - Fluent<Spec> で fluent builder の型を生成
 *  - required / requiredGroups が満たされるまで terminal は補完に出ない
 *  - optionalGroup は「グループ内のどれか1つ」を最大1回だけ（呼ぶと補完から消える）
 * ============================================================
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fn = (...a: any[]) => any;

/**
 * Entry:
 *  - Fluent の入口（初期化子）
 *  - 戻り値は意味を持たない
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Entry<Args extends any[] = any[]> =
  (...args: Args) => unknown;

/**
 * Step:
 *  - 中間子（required / optional / group すべて共通）
 *  - 状態を変更するだけ
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Step<Args extends any[] = any[]> =
  (...args: Args) => unknown;

/**
 * Terminal:
 *  - 終端子
 *  - 戻り値が Fluent チェーンの結果になる
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Terminal<Args extends any[] = any[], Result = unknown> =
  (...args: Args) => Result;

/**
 * FluentSpec:
 * - init: 初期子（入口）。ここからチェーンが開始される
 * - required: AND必須（全て呼ぶ必要がある）
 * - requiredGroups: OR必須（各グループからどれか1つ必要）
 * - optional: 通常オプション（一回のみ可）
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Args<F> = F extends (...a: infer A) => any ? A : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ret<F>  = F extends (...a: any[]) => infer R ? R : never;

type Keys<T> = keyof T & string;
type ObjKeys<T> = T extends Record<string, Fn> ? Keys<T> : never;
type ObjGroupKeys<T> = T extends Record<string, Record<string, Fn>> ? Keys<T> : never;

type RequiredKeys<T extends FluentSpec> = ObjKeys<NonNullable<T["required"]>>;
type RequiredGroupNames<T extends FluentSpec> = ObjGroupKeys<NonNullable<T["requiredGroups"]>>;

// ---- Builder生成
export type Fluent<T extends FluentSpec> = {
  [K in keyof T["init"] & string]: (
    ...a: Args<T["init"][K]>
  ) => Chain<
    T,
    RequiredKeys<T>,          // 未完了 required（AND）
    RequiredGroupNames<T>,    // 未完了 requiredGroups（OR）
    never,                    // 使用済み optional 名集合（1回のみ）
    never                     // ロック済み optionalGroup 名集合（グループ最大1回）
  >;
};

type Chain<
  T extends FluentSpec,
  REQ extends string,            // 未完了 required（AND）
  REQG extends string,           // 未完了 requiredGroups（OR）
  OPT_CONSUMED extends string,   // 使用済み optional 名集合（1回のみ）
  OPTG_LOCKED extends string     // ロック済み optionalGroup 名集合
> =
  // ---- required（AND）----
  (T["required"] extends Record<string, Fn>
    ? {
        [K in Extract<keyof T["required"] & string, REQ>]:
          (...a: Args<T["required"][K]>) =>
            Chain<T, Exclude<REQ, K>, REQG, OPT_CONSUMED, OPTG_LOCKED>;
      }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    : {})
  &
  // ---- requiredGroups（OR 必須）----
  (T["requiredGroups"] extends Record<string, Record<string, Fn>>
    ? (REQG extends never
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        ? {}
        : {
            [G in Extract<keyof T["requiredGroups"] & string, REQG>]:
              {
                [M in keyof T["requiredGroups"][G] & string]:
                  (...a: Args<T["requiredGroups"][G][M]>) =>
                    Chain<T, REQ, Exclude<REQG, G>, OPT_CONSUMED, OPTG_LOCKED>;
              }
          }[Extract<keyof T["requiredGroups"] & string, REQG>])
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    : {})
  &
  // ---- optional（1回のみOK）----
  (T["optional"] extends Record<string, Fn>
    ? {
        [K in Exclude<keyof T["optional"] & string, OPT_CONSUMED>]:
          (...a: Args<T["optional"][K]>) =>
            Chain<T, REQ, REQG, OPT_CONSUMED | K, OPTG_LOCKED>;
      }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    : {})
  &
  // ---- optionalGroup（OR オプション・グループ最大1回）----
  (T["optionalGroup"] extends Record<string, Record<string, Fn>>
    ? (Exclude<keyof T["optionalGroup"] & string, OPTG_LOCKED> extends never
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        ? {}
        : {
            [G in Exclude<keyof T["optionalGroup"] & string, OPTG_LOCKED>]:
              {
                [M in keyof T["optionalGroup"][G] & string]:
                  (...a: Args<T["optionalGroup"][G][M]>) =>
                    Chain<T, REQ, REQG, OPT_CONSUMED, OPTG_LOCKED | G>;
              }
          }[Exclude<keyof T["optionalGroup"] & string, OPTG_LOCKED>])
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    : {})
  &
  // ---- terminal（required + requiredGroups 完了で解禁）----
  (REQ extends never
    ? (REQG extends never
        ? {
            [K in keyof T["terminal"] & string]:
              (...a: Args<T["terminal"][K]>) => Ret<T["terminal"][K]>;
          }
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        : {})
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    : {});
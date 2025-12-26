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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Args<F> = F extends (...a: infer A) => any ? A : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ret<F>  = F extends (...a: any[]) => infer R ? R : never;

type Keys<T> = keyof T & string;
type ObjKeys<T> = T extends Record<string, Fn> ? Keys<T> : never;

type RequiredKeys<T extends FluentSpec> = ObjKeys<NonNullable<T["required"]>>;
type RequiredGroupNames<T extends FluentSpec> = ObjKeys<NonNullable<T["requiredGroups"]>>;

// ---- Builder生成
export type Fluent<T extends FluentSpec> = {
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
    : Record<string, never>)
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
    : Record<string, never>)
  &
  // ---- optional（何回でもOK）----
  (T["optional"] extends Record<string, Fn>
    ? {
        [K in keyof T["optional"] & string]:
          (...a: Args<T["optional"][K]>) =>
            Chain<T, REQ, REQG, OPTG_LOCKED>;
      }
    : Record<string, never>)
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
    : Record<string, never>)
  &
  // ---- terminal（required + requiredGroups 完了で解禁）----
  (REQ extends never
    ? (REQG extends never
        ? {
            [K in keyof T["terminal"] & string]:
              (...a: Args<T["terminal"][K]>) => Ret<T["terminal"][K]>;
          }
        : Record<string, never>)
    : Record<string, never>);
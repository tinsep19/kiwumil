// src/dsl/matrix_utils.ts

/**
 * 2D配列が矩形（すべての行が同じ長さ）かどうかを判定
 * @param matrix - 検証する2D配列
 * @returns 矩形ならtrue、そうでなければfalse
 */
export function isRectMatrix<T>(matrix: readonly (readonly T[])[]): boolean {
  if (matrix.length === 0) return false
  const width = matrix[0]?.length
  if (width === undefined || width === 0) return false
  return matrix.every(row => row.length === width)
}

/**
 * TypeScript型レベルでの矩形検証
 */
export type Matrix<T = unknown> = readonly (readonly T[])[]

type FirstRow<T extends Matrix> =
  T extends readonly [infer F extends readonly unknown[], ...unknown[]] ? F : readonly unknown[]

type AllRowsSameLen<T extends Matrix, L extends number> =
  T extends readonly [infer R extends readonly unknown[], ...infer Rest extends Matrix]
    ? (R['length'] extends L ? (L extends R['length'] ? AllRowsSameLen<Rest, L> : false) : false)
    : true

export type IsRectMatrix<T extends Matrix> =
  T extends readonly [] ? false : AllRowsSameLen<T, FirstRow<T>['length']>

# hint.enclose API 仕様書（オーバーロード構成＋1D制約対応）

## 🧭 目的

`hint.enclose()` は、`container` 内に symbol 群を**配置または制約として登録**する API です。
配列の次元と構造により動作を切り替えます。

* **1D 配列** → 制約定義（配置は行わない）

  * `.constraints()`：制約のみ返す
  * `.apply()`：制約を配置として適用（現在の挙動）
* **2D 配列** → レイアウト構築

  * `.figure()`：行ごとに均等 gap。行頭は行によりズレ得る。
  * `.grid()`：N×M に空間分割。行頭位置は揃う。
  * `.auto()`：矩形なら grid、非矩形なら figure を選択。
* **引数なし** → 動的ビルダー（実行時に配列を渡す）

---

## 🧩 呼び出し例

```ts
declare const container: HTMLElement;
declare const s1:any,s2:any,s3:any,s4:any,s5:any,s6:any;

// --- 1D 配列：制約のみ ---
enclose(container, [s1, s2, s3] as const).constraints(); // 副作用なし
enclose(container, [s1, s2, s3] as const).apply();       // 現在の挙動（=配置）

// --- 2D 配列 ---
enclose(container, [[s1,s2],[s3,s4]] as const).grid();   // N×M
enclose(container, [[s1,s2],[s3]] as const).figure();    // 非矩形

// --- 動的 ---
const b = enclose(container);
b.constraints([s1, s2, s3]);    // 制約のみ
b.apply([s1, s2, s3]);          // 制約→配置
b.grid([[s1,s2],[s3,s4]]);      // 実行時矩形ガード
b.auto([[s1,s2],[s3]]);         // 自動選択
```

---

## 🧱 パブリック API 構成

```ts
export const hint: {
  /**
   * 1. 1D 配列: 制約ビルダー
   */
  enclose<C, T extends List1D>(container: C, list: T): ConstraintBuilder<T>;

  /**
   * 2. 2D 配列: レイアウトビルダー
   */
  enclose<C, T extends Matrix>(container: C, matrix: T): LayoutBuilder<T, IsRectMatrix<T>>;

  /**
   * 3. コンテナのみ: 動的ビルダー
   */
  enclose<C>(container: C): DynamicBuilder;
};
```

---

## 🔢 型定義・型ユーティリティ

```ts
export type List1D<T = unknown> = readonly T[];
export type Matrix<T = unknown> = readonly (readonly T[])[];

type FirstRow<T extends Matrix> =
  T extends readonly [infer F extends readonly unknown[], ...unknown[]] ? F : readonly unknown[];
type AllRowsSameLen<T extends Matrix, L extends number> =
  T extends readonly [infer R extends readonly unknown[], ...infer Rest extends Matrix]
    ? (R['length'] extends L ? (L extends R['length'] ? AllRowsSameLen<Rest, L> : false) : false)
    : true;
export type IsRectMatrix<T extends Matrix> =
  T extends readonly [] ? false : AllRowsSameLen<T, FirstRow<T>['length']>;
```

---

## ⚙️ 実行時ガード

```ts
export function isRectMatrix<T>(m: readonly (readonly T[])[]): boolean {
  if (m.length === 0) return false;
  const w = m[0].length;
  if (w === 0) return false;
  return m.every(r => r.length === w);
}
```

---

## 🏗️ 戻り値ビルダー

### 1️⃣ ConstraintBuilder（1D）

```ts
export class ConstraintBuilder<T extends List1D> {
  constructor(private container: unknown, private list: T) {}

  /** 制約のみ生成（配置しない） */
  constraints(): ConstraintPlan { return { kind: 'constraints' } }

  /** 制約を適用して配置（現在の挙動） */
  apply(): void {
    // 実際の配置処理。container 内に list の要素を配置。
  }
}
```

### 2️⃣ LayoutBuilder（2D）

```ts
export class LayoutBuilder<T extends Matrix, Rect extends boolean> {
  constructor(private container: unknown, private matrix: T) {}

  figure(): FigureLayout { return { kind: 'figure' } }

  grid(): Rect extends true ? GridLayout : never {
    if (!isRectMatrix(this.matrix)) throw new Error('Matrix is not rectangular');
    return { kind: 'grid' } as any;
  }

  auto(): Rect extends true ? GridLayout : FigureLayout {
    return (isRectMatrix(this.matrix) ? this.grid() : this.figure()) as any;
  }
}
```

### 3️⃣ DynamicBuilder（実行時選択）

```ts
export class DynamicBuilder {
  constructor(private container: unknown) {}

  constraints<T extends List1D>(list: T): ConstraintPlan {
    return { kind: 'constraints' };
  }

  apply<T extends List1D>(list: T): void {
    // 制約を反映して配置
  }

  figure<T extends Matrix>(matrix: T): FigureLayout {
    return { kind: 'figure' };
  }

  grid<T extends Matrix>(matrix: T): GridLayout {
    if (!isRectMatrix(matrix))
      throw new Error('Matrix is not rectangular; grid() requires an N×M matrix.');
    return { kind: 'grid' };
  }

  auto<T extends Matrix>(matrix: T): GridLayout | FigureLayout {
    return isRectMatrix(matrix) ? this.grid(matrix) : this.figure(matrix);
  }
}
```

---

## 🧩 レイアウト戻り値型

```ts
export type FigureLayout = { kind: 'figure' };
export type GridLayout   = { kind: 'grid' };
export type ConstraintPlan = { kind: 'constraints' };
```

---

## ⚙️ 実装本体（enclose関数）

```ts
export function enclose<C, T extends List1D>(container: C, list: T): ConstraintBuilder<T>;
export function enclose<C, T extends Matrix>(container: C, matrix: T): LayoutBuilder<T, IsRectMatrix<T>>;
export function enclose<C>(container: C): DynamicBuilder;

export function enclose(container: unknown, second?: unknown): any {
  if (second === undefined) return new DynamicBuilder(container);
  if (Array.isArray(second) && Array.isArray((second as any)[0])) {
    return new LayoutBuilder(container, second as Matrix);
  }
  return new ConstraintBuilder(container, second as List1D);
}
```

---

## 🧠 apply の意味と推奨理由

* `apply()` は「制約をコンテナに**適用**して配置する」意味。
* `render()` や `mount()` よりも中立的・設計意図に忠実。
* 今後の拡張（`dryRun`/`simulate`/`preview` など）にも親和性が高い。

---

## 🧪 テスト観点（Copilot テスト生成用）

| Case | 入力                  | 期待結果                                            |
| ---- | ------------------- | ----------------------------------------------- |
| 1    | `[s1,s2]`           | `.constraints()` returns `{kind:'constraints'}` |
| 2    | `[s1,s2]`           | `.apply()` triggers container modification      |
| 3    | `[[s1,s2],[s3,s4]]` | `.grid()` returns `{kind:'grid'}`               |
| 4    | `[[s1,s2],[s3]]`    | `.grid()` throws / `.figure()` ok               |
| 5    | 動的                  | `.grid(nonRect)` throws                         |
| 6    | `.auto()`           | grid/figure 分岐確認                                |
| 7    | `isRectMatrix()`    | true / false 判定全パターン                            |

---

## 🧩 JSDoc（Copilot補完向け）

```ts
/**
 * Enclose symbols within a container for layout or constraint definition.
 *
 * Overloads:
 * - `enclose(container, list1D)`: Returns a ConstraintBuilder — define constraints or `.apply()` them.
 * - `enclose(container, matrix2D)`: Returns a LayoutBuilder — use `.figure()`, `.grid()`, or `.auto()`.
 * - `enclose(container)`: Returns a DynamicBuilder — provide lists or matrices at runtime.
 *
 * @example
 * enclose(container, [a,b,c]).constraints(); // define constraints only
 * enclose(container, [a,b,c]).apply();       // apply immediately
 * enclose(container, [[a,b],[c,d]]).grid();  // 2D layout
 */
```

---

## ✅ 受け入れ条件

1. `enclose` は 3 種オーバーロード（1D / 2D / Dynamic）を持つ。
2. 1D → `.constraints()` / `.apply()` を提供。
3. `.apply()` は「現在の挙動＝制約を配置へ適用」。
4. 2D → `.figure()` / `.grid()` / `.auto()` を提供。
5. `.grid()` は型と実行時で矩形を検証。
6. `isRectMatrix()` 単体テストが全ケース通過。
7. Copilot が補完できる JSDoc・型が整備されている。

---

この仕様で、Copilot は以下を正しく補完できるようになります：

* `enclose(container, [ ... ])` → `.constraints()` / `.apply()`
* `enclose(container, [[ ... ], [ ... ]])` → `.grid()` / `.figure()` / `.auto()`
* `enclose(container)` → `.apply(list)` / `.grid(matrix)` / `.auto(matrix)`

# 2025-12-16 レイアウト変数のブランド型化実装

## 作業内容

レイアウト変数型（AnchorX/AnchorY/AnchorZ/Width/Height）をブランディング型（名義型）に変更し、型安全性を向上させました。

## 実装の詳細

### 1. ブランド型の追加 (src/core/layout_variable.ts)

単純な type alias から、ユニークなシンボルプロパティを持つ交差型に変更:

```typescript
// 変更前
export type AnchorX = Variable
export type Width = Variable

// 変更後
export type AnchorX = Variable & { readonly __brand_anchorX: "anchor_x" }
export type Width = Variable & { readonly __brand_width: "width" }
```

### 2. キャスト関数の追加

型安全なキャストを行うヘルパー関数を追加:

- `asAnchorX(v: Variable): AnchorX`
- `asAnchorY(v: Variable): AnchorY`
- `asAnchorZ(v: Variable): AnchorZ`
- `asWidth(v: Variable): Width`
- `asHeight(v: Variable): Height`

### 3. VariableFactory の導入

変数生成を抽象化する工場パターンを実装:

```typescript
export type VariableFactory = (id: VariableId) => Variable

export function createBrandVariableFactory(factory: VariableFactory) {
  return {
    createAnchorX(id: VariableId): AnchorX,
    createAnchorY(id: VariableId): AnchorY,
    // ...
  }
}
```

### 4. LayoutVariables の更新 (src/model/layout_variables.ts)

`createBounds` メソッドでキャスト関数を使用するように変更:

```typescript
// 変更前
const x = this.createVariable(`${prefix}.x`)

// 変更後
const x = asAnchorX(this.createVariable(`${prefix}.x`))
```

### 5. エクスポートの追加 (src/core/index.ts)

新しい型とヘルパー関数を公開 API に追加:

```typescript
export type { VariableFactory } from "./layout_variable"
export { asAnchorX, asAnchorY, asAnchorZ, asWidth, asHeight, createBrandVariableFactory } from "./layout_variable"
```

## テスト

新しいテストファイル `tests/branded_variables.test.ts` を作成し、以下をカバー:

1. 各キャスト関数が正しく動作すること
2. createBrandVariableFactory が正しいブランド型を生成すること
3. createBounds が正しいブランド型を返すこと
4. ブランド型が制約ソルバーで正常に動作すること

**テスト結果**: 159 テスト全てパス (9 つの新規テストを含む)

## ビルド確認

TypeScript コンパイルが正常に完了し、型エラーがないことを確認しました。

## 互換性

### ランタイム

- ブランド型はコンパイル時のみの機能
- ランタイムでは通常の Variable として動作
- **既存コードとの完全な互換性を維持**

### 型レベル

- Variable → ブランド型: 明示的キャストが必要（asAnchorX 等）
- ブランド型 → Variable: 暗黙的に変換可能
- **型安全性が向上し、誤った混用を防止**

## 変更ファイル

- `src/core/layout_variable.ts`: ブランド型、キャスト関数、ファクトリの追加
- `src/core/bounds.ts`: 型定義は変更されているが、実装は不変
- `src/model/layout_variables.ts`: createBounds でキャスト関数を使用
- `src/core/index.ts`: 新しい関数と型のエクスポート
- `tests/branded_variables.test.ts`: 新規テストファイル
- `docs/design/branded-layout-variables.ja.md`: 設計ドキュメント

## 今後の課題

以下は別 PR として検討:

1. **Phase 2**: LayoutVariables への DI 対応
2. **Phase 3**: constraint helper の型シグニチャの厳密化
3. 他のモデルやヘルパー関数でのブランド型活用

## 所感

- ブランド型の導入により、型レベルでの安全性が大幅に向上
- 既存コードへの影響を最小限に抑えられた
- キャスト関数の明示的な使用により、意図が明確になった
- テストの追加により、リグレッションのリスクを低減

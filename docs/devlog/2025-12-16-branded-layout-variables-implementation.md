# 2025-12-16 レイアウト変数のブランド型化実装

## 作業内容

レイアウト変数型（AnchorX/AnchorY/AnchorZ/Width/Height）をブランディング型（名義型）に変更し、型安全性を向上させました。

## 実装の詳細

### 1. ブランド型の追加 (src/core/layout_variable.ts)

単純な type alias から、unique symbol を使用したブランド型に変更:

```typescript
// 変更前
export type AnchorX = Variable
export type Width = Variable

// 最終実装（unique symbol 使用）
declare const __brand: unique symbol

export type AnchorX = Variable & { readonly [__brand]: "anchor_x" }
export type AnchorY = Variable & { readonly [__brand]: "anchor_y" }
export type AnchorZ = Variable & { readonly [__brand]: "anchor_z" }
export type Width = Variable & { readonly [__brand]: "width" }
export type Height = Variable & { readonly [__brand]: "height" }
```

**利点:**
- 同じ `__brand` シンボルで複数の値を分類可能
- TypeScript の型システムによるより厳密な型チェック
- コードベース内の他のブランド実装（KiwiSolver）との一貫性

### 2. VariableFactory の導入

変数生成を抽象化する工場パターンを実装（キャストを内包）:

```typescript
export type VariableFactory = (id: VariableId) => Variable

export function createBrandVariableFactory(factory: VariableFactory) {
  return {
    createAnchorX(id: VariableId): AnchorX {
      return factory(id) as AnchorX
    },
    createAnchorY(id: VariableId): AnchorY {
      return factory(id) as AnchorY
    },
    // ...
  }
}
```

### 3. LayoutVariables の更新 (src/model/layout_variables.ts)

`createBounds` メソッドで createBrandVariableFactory を使用してキャストを隠蔽:

```typescript
createBounds<Type extends BoundsType = "layout">(
  prefix: string,
  type: Type = "layout" as Type
): BoundsMap[Type] {
  const boundId = createBoundId(`${prefix}:${type}`)

  // ブランドファクトリを作成して変換関数を隠蔽
  const factory = createBrandVariableFactory((id) => this.createVariable(id))

  // 基本的な 4 つの変数を作成（ブランド型）
  const x = factory.createAnchorX(`${prefix}.x`)
  const y = factory.createAnchorY(`${prefix}.y`)
  const width = factory.createWidth(`${prefix}.width`)
  const height = factory.createHeight(`${prefix}.height`)

  // computed properties を作成（ブランド型）
  const right = factory.createAnchorX(`${prefix}.right`)
  const bottom = factory.createAnchorY(`${prefix}.bottom`)
  const centerX = factory.createAnchorX(`${prefix}.centerX`)
  const centerY = factory.createAnchorY(`${prefix}.centerY`)

  // z (depth) 変数を作成
  const z = factory.createAnchorZ(`${prefix}.z`)
  // ...
}
```

### 4. キャスト関数の削除

初期実装では公開 API として提供していたキャスト関数（`asAnchorX`, `asAnchorY`, `asAnchorZ`, `asWidth`, `asHeight`）を削除し、createBrandVariableFactory 内に隠蔽しました。これにより:

- API がシンプルになり、使用者が直接キャストする必要がなくなった
- 実装の詳細が隠蔽され、保守性が向上
- ファクトリパターンによる一貫した変数生成が可能に

### 5. エクスポートの更新 (src/core/index.ts)

公開 API を整理:

```typescript
// 型のエクスポート
export type {
  Variable,
  AnchorX, AnchorY, AnchorZ,
  Width, Height,
  Anchor, Dimension,
  VariableFactory,
} from "./layout_variable"

// ファクトリ関数のみエクスポート（キャスト関数は削除）
export { createBrandVariableFactory } from "./layout_variable"
```

## テスト

新しいテストファイル `tests/branded_variables.test.ts` を作成し、以下をカバー:

1. createBrandVariableFactory の各メソッド（createAnchorX, createAnchorY, createAnchorZ, createWidth, createHeight）が正しく動作すること
2. createBounds が正しいブランド型を返すこと
3. ブランド型が制約ソルバーで正常に動作すること

**テスト結果**: 159 テスト全てパス (9 つの新規テストを含む)

## ビルド確認

TypeScript コンパイルが正常に完了し、型エラーがないことを確認しました。

## 互換性

### ランタイム

- ブランド型はコンパイル時のみの機能
- ランタイムでは通常の Variable として動作
- **既存コードとの完全な互換性を維持**

### 型レベル

- Variable → ブランド型: ファクトリメソッドを使用（`factory.createAnchorX()` など）
- ブランド型 → Variable: 暗黙的に変換可能
- **型安全性が向上し、誤った混用を防止**

## 変更ファイル

- `src/core/layout_variable.ts`: unique symbol によるブランド型、ファクトリの実装
- `src/core/bounds.ts`: 型定義は変更されているが、実装は不変
- `src/model/layout_variables.ts`: createBounds で createBrandVariableFactory を使用してキャストを隠蔽
- `src/core/index.ts`: ファクトリ関数のみエクスポート（キャスト関数は削除）
- `tests/branded_variables.test.ts`: ファクトリベースのテスト（9 つ）
- `docs/design/branded-layout-variables.ja.md`: 設計ドキュメント
- `docs/devlog/2025-12-16-branded-layout-variables-implementation.md`: 実装ログ（このファイル）

## 実装の変遷

1. **初期実装**: 個別のブランドプロパティ（`__brand_anchorX`, `__brand_width` など）を使用
2. **リファクタリング1**: createBounds 内で createBrandVariableFactory を使用してキャストを隠蔽
3. **リファクタリング2**: unique symbol `__brand` を使用した統一ブランド型に変更
4. **リファクタリング3**: キャスト関数（`asAnchorX` など）を削除し、ファクトリ内に完全に隠蔽

## 今後の課題

以下は別 PR として検討:

1. **Phase 2**: LayoutVariables への DI 対応
2. **Phase 3**: constraint helper の型シグニチャの厳密化
3. 他のモデルやヘルパー関数でのブランド型活用

## 所感

- unique symbol によるブランド型の導入により、型レベルでの安全性が大幅に向上
- 同じブランドシンボルで複数の値を分類できるため、型システムがより柔軟かつ厳密に
- 既存コードへの影響を最小限に抑えられた
- キャスト関数を完全に隠蔽することで、公開 API がシンプルで使いやすくなった
- ファクトリパターンにより、変数生成が一元化され保守性が向上
- テストの追加により、リグレッションのリスクを低減
- コードベース内の他のブランド実装（KiwiSolver）との一貫性が確保された

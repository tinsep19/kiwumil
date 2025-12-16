# ブランド型レイアウト変数の導入

## 概要

レイアウト変数型（AnchorX/AnchorY/AnchorZ/Width/Height）をブランディング型（名義型）として実装し、型レベルでの区別を可能にします。これにより、誤った変数の混用をコンパイル時に検出できるようになります。

## 目的

1. **型安全性の強化**: Anchor と Dimension の混用をコンパイル時に検出
2. **Variable 生成の一元化**: VariableFactory API による柔軟な変数生成
3. **互換性の維持**: 既存コードへの影響を最小限に抑えた段階的移行

## 実装

### ブランド型の定義

```typescript
// src/core/layout_variable.ts

// ブランディング型: ユニークなシンボルプロパティを持つ交差型
export type AnchorX = Variable & { readonly __brand_anchorX: "anchor_x" }
export type AnchorY = Variable & { readonly __brand_anchorY: "anchor_y" }
export type AnchorZ = Variable & { readonly __brand_anchorZ: "anchor_z" }
export type Width = Variable & { readonly __brand_width: "width" }
export type Height = Variable & { readonly __brand_height: "height" }
```

### キャスト関数

型安全なキャストを提供するヘルパー関数:

```typescript
export function asAnchorX(v: Variable): AnchorX { return v as AnchorX }
export function asAnchorY(v: Variable): AnchorY { return v as AnchorY }
export function asAnchorZ(v: Variable): AnchorZ { return v as AnchorZ }
export function asWidth(v: Variable): Width { return v as Width }
export function asHeight(v: Variable): Height { return v as Height }
```

### VariableFactory

変数生成を抽象化する工場パターン:

```typescript
export type VariableFactory = (id: VariableId) => Variable

export function createBrandVariableFactory(factory: VariableFactory) {
  return {
    createAnchorX(id: VariableId): AnchorX {
      return asAnchorX(factory(id))
    },
    createAnchorY(id: VariableId): AnchorY {
      return asAnchorY(factory(id))
    },
    // ... 他の型も同様
    createVariable(id: VariableId): Variable {
      return factory(id)
    },
  }
}
```

## 変更されたファイル

### src/core/layout_variable.ts

- ブランド型の定義を追加
- キャスト関数 (asAnchorX, asAnchorY, etc.) を追加
- VariableFactory 型と createBrandVariableFactory を追加

### src/core/bounds.ts

- Bounds インターフェースのフィールド型がブランド型を使用（型定義のみの変更）

### src/model/layout_variables.ts

- createBounds メソッドでキャスト関数を使用
- 生成される変数が適切なブランド型を持つことを保証

### src/core/index.ts

- 新しい型とキャスト関数のエクスポートを追加

## 互換性

### ランタイム互換性

ブランド型は TypeScript のコンパイル時のみの機能であり、ランタイムでは通常の Variable として動作します。そのため、既存のコードとの**ランタイム互換性は完全に保たれます**。

### 型レベルの互換性

ブランド型は Variable を拡張した型であるため、Variable を期待する場所にブランド型を渡すことができます。逆方向（Variable からブランド型への暗黙の変換）は防止され、型安全性が向上します。

## 利点

1. **コンパイル時エラー検出**: 誤った型の混用を早期に発見
2. **自己文書化**: 型定義から意図が明確に
3. **リファクタリング支援**: 型チェッカーがリファクタリング時のミスを検出
4. **テスト容易性**: VariableFactory により変数生成のモック化が容易

## 将来の拡張

### Phase 2: DI対応（オプション）

LayoutVariables クラスにブランドファクトリを注入可能にすることで、テスト時のモック生成がより簡単になります。

### Phase 3: 型の厳密化（オプション）

constraint helper の関数シグニチャをさらに狭く定義することで、より厳密な型チェックが可能になります。例えば:

```typescript
function alignX(...vars: AnchorX[]): void
function setWidth(bounds: Bounds, width: Width | number): void
```

## テスト

新しいテストファイル `tests/branded_variables.test.ts` を追加し、以下をカバー:

- 各キャスト関数の動作確認
- createBrandVariableFactory の動作確認
- createBounds が正しいブランド型を返すことの確認
- ブランド型が制約ソルバーで正常に動作することの確認

全 159 テストがパス（9 つの新規テストを含む）。

## 参考文献

- [TypeScript Handbook - Nominal Typing](https://www.typescriptlang.org/docs/handbook/2/classes.html#nominal-typing)
- [Branded Types in TypeScript](https://egghead.io/blog/using-branded-types-in-typescript)

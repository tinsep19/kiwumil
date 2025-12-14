[English](layout-constraints-decoupling.md) | 日本語

# Symbol を見ずに LayoutConstraints を運用する計画

## ステータス: 完了 ✅

本計画で提案されたレイアウト制約とシンボルの分離は完了しました。

## 実装内容

### 1. Bounds に BoundId を追加

`src/core/bounds.ts` で `BoundId` を型として定義し、ブランド化を削除:

```typescript
export type BoundId = string

export interface Bounds {
  readonly type: BoundsType
  readonly x: ILayoutVariable
  readonly y: ILayoutVariable
  readonly width: ILayoutVariable
  readonly height: ILayoutVariable
  readonly right: ILayoutVariable
  readonly bottom: ILayoutVariable
  readonly centerX: ILayoutVariable
  readonly centerY: ILayoutVariable
}
```

### 2. HintTarget の導入

`src/core/hint_target.ts` に `HintTarget` インターフェースを配置 (旧 `LayoutConstraintTarget`):

```typescript
export interface HintTarget {
  ownerId: SymbolId
  layout: LayoutBounds
  container?: ContainerBounds
}
```

### 3. ILayoutVariable への統一

すべての `Bounds` プロパティが `ILayoutVariable` インターフェースを使用:

- 具象 `LayoutVariable` クラスへの直接依存を排除
- `src/core` のインターフェースのみに依存

## 完了した実装

| 領域 | 実装内容 |
| --- | --- |
| Bounds モデル | `BoundId` を `string` 型として `src/core/symbols.ts` に追加。`Bounds` のすべてのプロパティが `ILayoutVariable` を使用。 |
| HintTarget | `HintTarget` インターフェースを `src/core/hint_target.ts` に配置し、`ownerId`、`layout`、`container` を保持。 |
| LayoutConstraints | `HintTarget` を活用し、Bounds ベースでの制約構築を実現。 |

## 得られたメリット

1. **依存性の逆転**: 制約レイヤーが具象型ではなくインターフェースに依存
2. **型安全性の向上**: コンパイル時の型チェックが強化
3. **アーキテクチャの明確化**: `src/core` で公開API、`src/kiwi` で実装という明確な境界
4. **循環依存の排除**: コア型定義が実装から分離

## 関連変更

- `LayoutVariable` → `ILayoutVariable` への統一
- `LayoutConstraintTarget` → `HintTarget` への名前変更
- `BoundId` のブランド化削除 (単純な `string` 型に)

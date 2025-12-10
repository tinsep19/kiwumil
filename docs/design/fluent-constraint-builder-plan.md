# Fluent 制約ビルダー移行計画

## ステータス: 完了 ✅

本計画で提案された `IConstraintsBuilder` インターフェースの抽出と、型の整理は完了しました。

## 実装内容

### 1. インターフェース抽出

`src/core/constraints_builder.ts` に以下のコアインターフェースを配置:

```typescript
export interface IConstraintsBuilder {
  eq(lhs: Term, rhs: Term | number, strength?: ConstraintStrength): this
  ge(lhs: Term, rhs: Term | number, strength?: ConstraintStrength): this
  le(lhs: Term, rhs: Term | number, strength?: ConstraintStrength): this
}

export type Term = ILayoutVariable | number
export type ConstraintSpec = (builder: IConstraintsBuilder) => void
```

### 2. 型の標準化

- `ConstraintStrength`: `"required" | "strong" | "medium" | "weak"`
- `ISuggestHandle`: 旧 `SuggestHandle` から名前変更
- `ISuggestHandleFactory`: 旧 `SuggestHandleFactory` から名前変更
- `ILayoutVariable`: 旧 `LayoutVariable<T>` から型パラメータを削除

### 3. シンボル実装の更新

すべてのシンボルクラス (`SymbolBase` およびその派生クラス) が `ensureLayoutBounds(builder: IConstraintsBuilder)` メソッドを実装:

```typescript
export abstract class SymbolBase {
  ensureLayoutBounds(builder: IConstraintsBuilder): void {
    // 各シンボルが固有の制約を追加
  }
}
```

### 4. アーキテクチャの改善

- **依存性の逆転**: `src/layout` の具象クラスではなく `src/core` のインターフェースに依存
- **循環依存の解消**: `src/core` が型定義のみを持ち、実装から分離
- **型安全性の向上**: すべての公開APIがインターフェースベース

## 移行完了項目

- [x] `IConstraintsBuilder` インターフェースの抽出と `src/core` への配置
- [x] `Term` と `ConstraintSpec` の `src/core` への移動
- [x] `ConstraintStrength` への名前変更と `"required"` の追加
- [x] `ISuggestHandle` / `ISuggestHandleFactory` への名前変更
- [x] すべてのシンボル実装で `IConstraintsBuilder` を使用
- [x] テストの更新と検証 (129 tests pass)

## 参照

- `src/core/constraints_builder.ts` - コアインターフェース定義
- `src/layout/constraints_builder.ts` - 具象実装
- `src/model/symbol_base.ts` - シンボル基底クラス

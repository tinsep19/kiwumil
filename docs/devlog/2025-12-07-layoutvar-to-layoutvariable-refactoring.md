# LayoutVar から Variable へのリファクタリング

## 概要

LayoutVar のブランディング型から明確なインターフェース・実装クラス構造への移行を実施。
createLayoutVar API も createVariable にリネームし、より明示的な設計にした。

## 変更日時

2025-12-07

## 背景

以前の実装では Symbol ブランディングを使用して kiwi.Variable を LayoutVar として扱っていたが、
これには以下の問題があった：

1. 型の分離が不十分で、kiwi 依存が暗黙的
2. インターフェースと実装が分離されていない
3. テストやモックが困難

## 変更内容

### 1. 新しい型定義の追加

```typescript
export type VariableId = string

export interface Variable<T = kiwi.Variable> {
  id: VariableId
  value(): number
  variable: T
}

export class Variable implements Variable<kiwi.Variable> {
  constructor(
    public readonly id: VariableId,
    public readonly variable: kiwi.Variable
  ) {}

  value(): number {
    return this.variable.value()
  }
}
```

### 2. API の変更

- `createLayoutVar(name: string): LayoutVar` → `createVariable(id: VariableId): Variable`
- `isLayoutVar()` を削除（instanceof Variable を使用）
- LAYOUT_VAR_BRAND を削除

### 3. 更新されたファイル

#### コア実装
- `src/kiwi/layout_solver.ts` - 新しい Variable クラスと API
- `src/kiwi/layout_variables.ts` - createVariable の使用
- `src/kiwi/constraints_builder.ts` - Term 型を Variable に更新
- `src/kiwi/bounds.ts` - Bounds インターフェースを Variable に更新
- `src/kiwi/index.ts` - エクスポートを更新

#### ヒント機能
- `src/hint/hints.ts` - HintVariable を Variable に更新
- `src/hint/guide_builder.ts` - GuideBuilder インターフェースを更新

#### モデル
- `src/model/layout_context.ts` - valueOf を Variable 対応に

#### テスト
- `tests/suggest_handle.test.ts` - createVariable を使用
- `tests/hints_createHintVariable.test.ts` - instanceof チェックに変更

#### ドキュメント
- `docs/design/layout-system.md` - API ドキュメントを更新
- `docs/design/layout-system.ja.md` - 日本語版を更新
- `docs/draft/suggest_handle.md` - SuggestHandle の例を更新

## 利点

1. **型の分離**: インターフェース (Variable) と実装 (Variable) が明確に分離
2. **kiwi 依存の明示化**: variable プロパティで kiwi.Variable へのアクセスを明示
3. **テスト性の向上**: instanceof による型チェックが可能
4. **将来のモジュール分割**: インターフェースベースの設計により、将来的な分割が容易

## テスト結果

- 全テスト通過: 123 pass / 0 fail
- ビルド成功
- Lint チェック通過

## 互換性

この変更は破壊的変更だが、すべての内部使用箇所を一括で移行したため、
リポジトリ内での互換性は完全に保たれている。

外部利用者がいる場合は、以下の移行が必要：

```typescript
// Before
const v = solver.createLayoutVar("x")
if (isLayoutVar(v)) { ... }

// After
const v = solver.createVariable("x")
if (v instanceof Variable) { ... }
```

## 関連コミット

- 0e7541e: Refactor LayoutVar to Variable with clear interface
- c52a09b: Update documentation to reflect Variable API changes

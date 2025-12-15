[English](architecture.md) | 日本語

# アーキテクチャ概要

Kiwumil は循環依存を避け、メンテナンス性を保つためにレイヤー構成を採用しています。推奨されるレイヤー構成は以下です：

```
Layer 4: DSL        (dsl/)
   ↓
Layer 3: Plugins    (plugin/)
   ↓
Layer 2: Model      (model/, hint/)
   ↓
Layer 1: Core       (core/, kiwi/, theme/, icon/, utils/)
```

ルール:
- 上位レイヤーは下位レイヤーに依存可能だが、下位レイヤーは上位レイヤーに依存してはいけない。
- re-export は同一ディレクトリか下位レイヤーの項目に限定し、循環を防ぐ。

詳細は [循環依存防止ガイドライン](../guidelines/circular-dependency-prevention.ja.md) を参照してください（レイヤーに基づく ESLint ルール案などを含む）。


---

[English](dependency-cleanup-plan.md) | 日本語

# 依存整理の計画

## ステータス: 大幅に完了 ✅

本計画で提案された依存関係の整理と `src/core` への型の集約が完了しました。

## 実装内容

### 1. `src/core` モジュールの導入

公開インターフェースと型定義を `src/core` に集約:

**`src/core/symbols.ts`**:
- `SymbolId`, `Point`, `ISymbol`, `ISymbolCharacs`
- `VariableId`, `ILayoutVariable`, `BoundId`
- `LayoutConstraintId`, `ILayoutConstraint`
- `ConstraintStrength`, `ISuggestHandle`, `ISuggestHandleFactory`

**`src/core/bounds.ts`**:
- `Bounds`, `LayoutBounds`, `ContainerBounds`, `ItemBounds`
- `BoundsType`, `BoundsMap`

**`src/core/constraints_builder.ts`**:
- `IConstraintsBuilder`, `Term`, `ConstraintSpec`

**`src/core/layout_solver.ts`**:
- `ILayoutSolver`

**`src/core/hint_target.ts`**:
- `HintTarget`

### 2. インポートパスの統一

すべての公開型は `src/core` から一元的にインポート:

```typescript
// Before (分散)
import type { SymbolId } from "../model/types"
import type { ILayoutVariable } from "../kiwi"
import type { LayoutBounds } from "../kiwi/bounds"

// After (集約)
import type { SymbolId, ILayoutVariable, LayoutBounds } from "../core"
```

### 3. モジュール構成の明確化

**`src/core/`** (型定義とインターフェース):
- 実装を持たない純粋な型定義
- 他モジュールへの依存なし
- すべての公開APIの基盤

**`src/model/`** (ドメインモデル):
- `SymbolBase`, `RelationshipBase`, `DiagramSymbol`
- `LayoutVariables` (moved from `src/kiwi`)
- `src/core` のインターフェースに依存

**`src/kiwi/`** (レイアウトエンジン):
- `KiwiSolver`, `ConstraintsBuilder` の具象実装
- `ILayoutSolver`, `IConstraintsBuilder` を実装
- `src/core` のインターフェースに依存

### 4. 循環依存の排除

- `src/core` が型定義のみを持ち、実装を含まない
- すべての実装モジュールが `src/core` に依存するが、その逆はない
- インターフェースベースの設計により循環を防止

## 完了した実装

| ステップ | 実装内容 | 状態 |
| -------- | ---- | ---- |
| 1. エクスポート調査 | 全ファイルの import/export 関係を調査 | ✅ 完了 |
| 2. `src/core` 整備 | コアインターフェースを `src/core` に集約 | ✅ 完了 |
| 3. インポートパス統一 | 50+ ファイルのインポートを `src/core` に更新 | ✅ 完了 |
| 4. 循環依存の排除 | インターフェースベースの設計に移行 | ✅ 完了 |
| 5. 型安全性の向上 | ブランド型の削除、インターフェース統一 | ✅ 完了 |
| 6. テスト検証 | 全テスト (129個) の合格を確認 | ✅ 完了 |

## 主な成果

1. **アーキテクチャの明確化**
   - コア型定義 (`src/core`)
   - ドメインモデル (`src/model`)  
   - レイアウトエンジン (`src/kiwi`)
   - プラグイン (`src/plugin`)

2. **型安全性の向上**
   - すべての公開APIがインターフェースベース
   - ブランド型の削除により型の単純化
   - コンパイル時の型チェック強化

3. **保守性の向上**
   - 依存関係の方向が明確
   - 循環依存の排除
   - モジュール間の境界が明確

## 今後の課題

- [ ] ESLint ルールによる直接ファイルインポートの検出
- [ ] さらなる型定義の整理
- [ ] ドキュメントの継続的な更新

## 関連ファイル

- `src/core/index.ts` - コア型の一元エクスポート
- `src/model/index.ts` - モデル層のエクスポート
- `src/kiwi/index.ts` - レイアウト層のエクスポート

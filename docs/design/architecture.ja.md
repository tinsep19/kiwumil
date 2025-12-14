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

詳細は `docs/guidelines/circular-dependency-prevention.md` を参照してください（レイヤーに基づく ESLint ルール案などを含む）。


---

[English](guide-builder-refactoring.md) | 日本語

# GuideBuilder 実装の共通化とディレクトリ整理

## 概要

`GuideBuilderX` と `GuideBuilderY` の重複実装を解消し、共通実装を `GuideBuilderImpl` として抽出しました。さらに、レイアウト関連の Builder ファイルを `src/kiwi/hint` ディレクトリに移動し、コードの構造を改善しました。

## 目的

1. **コードの重複削減**: `GuideBuilderX` と `GuideBuilderY` はほぼ同じ実装を持っていたため、共通化によりメンテナンス性を向上
2. **型安全性の維持**: インターフェイスとして `GuideBuilderX` と `GuideBuilderY` を定義し、既存コードとの互換性を保証
3. **実行時エラーチェック**: 軸に応じて使用できないメソッドを呼び出した場合、明確なエラーメッセージを表示
4. **ディレクトリ構造の改善**: レイアウト関連の Builder を `src/kiwi/hint` に移動し、責務を明確化

## ディレクトリ構造の変更

### 変更前
```
src/dsl/
  ├── hint_factory.ts
  ├── grid_builder.ts
  ├── figure_builder.ts
  └── guide_builder.ts
```

### 変更後
```
src/dsl/
  └── hint_factory.ts      # DSL エントリポイントのみ残す

src/kiwi/hint/
  ├── grid_builder.ts      # レイアウトヒントの実装
  ├── figure_builder.ts    # レイアウトヒントの実装
  └── guide_builder.ts     # レイアウトヒントの実装
```

### 設計意図

- **src/dsl**: DSL の公開 API とエントリポイントを配置
- **src/kiwi/hint**: レイアウトロジックの実装を配置
- これにより、DSL 層とレイアウト層の責務が明確に分離されました

## アーキテクチャ

### 新規ファイル: `src/kiwi/hint/guide_builder.ts`

```
GuideBuilderX (interface)
GuideBuilderY (interface)
   ↓
GuideBuilderImpl (class)
```

- **GuideBuilderX インターフェイス**: X軸（水平方向）のガイド用 API
  - `x: LayoutVar`
  - `alignLeft()`, `alignRight()`, `alignCenter()`
  - `followLeft()`, `followRight()`, `followCenter()`
  - `arrange()` (垂直方向に配置)

- **GuideBuilderY インターフェイス**: Y軸（垂直方向）のガイド用 API
  - `y: LayoutVar`
  - `alignTop()`, `alignBottom()`, `alignCenter()`
  - `followTop()`, `followBottom()`, `followCenter()`
  - `arrange()` (水平方向に配置)

- **GuideBuilderImpl クラス**: 共通実装
  - `axis: 'x' | 'y'` パラメータで振る舞いを切り替え
  - 軸に応じて `x` または `y` プロパティを設定
  - 軸に適さないメソッドが呼ばれた場合、実行時エラーを投げる

### 変更ファイル: `src/dsl/hint_factory.ts`

- `GuideBuilderX` と `GuideBuilderY` のクラス実装を削除（約260行削減）
- `src/kiwi/hint/guide_builder.ts` から GuideBuilderImpl と型をインポート
- `src/kiwi/hint/grid_builder.ts` と `figure_builder.ts` のインポートパスを更新
- `createGuideX()` と `createGuideY()` が `GuideBuilderImpl` を生成
- 戻り値の型は `GuideBuilderX` / `GuideBuilderY` インターフェイス

## 実装の詳細

### 軸の切り替え

`GuideBuilderImpl` のコンストラクタで `axis` パラメータを受け取り、以下のように動作を切り替えます：

```typescript
if (axis === "x") {
  this.x = this.guideVar
} else {
  this.y = this.guideVar
}
```

### メソッドの実装

- **X軸専用メソッド** (`alignLeft`, `alignRight`, `followLeft`, `followRight`): 
  - `ensureAxisIs('x', methodName)` でチェック
  - `bounds.x` や `bounds.right` を使用

- **Y軸専用メソッド** (`alignTop`, `alignBottom`, `followTop`, `followBottom`):
  - `ensureAxisIs('y', methodName)` でチェック
  - `bounds.y` や `bounds.bottom` を使用

- **共通メソッド** (`alignCenter`, `followCenter`):
  - `axis` に応じて `bounds.centerX` または `bounds.centerY` を使用

- **arrange メソッド**:
  - X軸ガイド: `arrangeVertical()` を呼び出し（垂直方向に配置）
  - Y軸ガイド: `arrangeHorizontal()` を呼び出し（水平方向に配置）

### エラーチェック

1. **軸の不一致**: X軸ガイドに対して Y軸専用メソッド（またはその逆）を呼び出した場合
   ```
   GuideBuilderX.alignTop(): This method is only available for GuideBuilderY
   ```

2. **複数の follow 制約**: 1つのガイドに対して複数の `follow*` メソッドを呼び出した場合
   ```
   GuideBuilderX.followRight(): guide already follows another symbol. Create a new guide for multiple follow constraints.
   ```

## 互換性

### 既存の API は完全に維持

```typescript
// 既存コードはそのまま動作
const guide = hint.createGuideX(300)
guide.alignCenter(a, b, c).arrange()

const vGuide = hint.createGuideY()
vGuide.followTop(symbol).alignTop(otherSymbol)
```

### 型の互換性

- `createGuideX()` の戻り値型: `GuideBuilderX`
- `createGuideY()` の戻り値型: `GuideBuilderY`
- 既存のコードで型注釈を使用している場合も互換性を維持

### インポートの変更

Builder の実装は `src/kiwi/hint` に移動しましたが、`HintFactory` を通じてアクセスするため、外部からの使用方法は変更ありません。

```typescript
// 既存コードはそのまま動作
import { TypeDiagram } from "@tinsep19/kiwumil"

TypeDiagram("Example")
  .build(({ el, rel, hint }) => {
    // hint.createGuideX(), hint.grid(), hint.figure() など
    // すべて変更なく使用可能
  })
```

## テスト

`tests/guide_builder.test.ts` で以下をカバー：

- GuideBuilderX の全メソッド（align*, follow*, arrange）
- GuideBuilderY の全メソッド（align*, follow*, arrange）
- エラーチェックの動作（軸間違い、複数の follow）
- インターフェイス互換性（x/y プロパティの存在）
- 既存テストとの互換性（layout_solver.test.ts の動作を再現）

## メリット

1. **コードの重複削減**: 約260行のコード削減
2. **メンテナンス性の向上**: 変更が必要な場合、1つの実装を修正すれば良い
3. **既存コードへの影響なし**: API と動作は完全に互換
4. **型安全性の向上**: インターフェイスによる明確な契約
5. **実行時の安全性**: 軸に応じた適切なエラーメッセージ
6. **ディレクトリ構造の改善**: 責務の明確な分離（DSL vs Layout）
7. **拡張性の向上**: レイアウトロジックが独立し、将来の拡張が容易

## 今後の拡張可能性

- 新しい軸（Z軸など）の追加が容易
- ガイド機能の拡張が一箇所で完結
- デバッグやロギングの追加が容易


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

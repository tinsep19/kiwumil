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

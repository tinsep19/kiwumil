# 2025-12-18: Fluent Grid API 実装

## 作業内容

Fluent Grid API を実装し、グリッド座標系への直接アクセスを提供する新しい API を追加しました。

## 実装した機能

### 1. FluentGridBuilder クラス

`src/hint/fluent_grid_builder.ts` に新しいクラスを作成：

- 2次元配列を受け取り、グリッドレイアウトを構築
- M×N のグリッドに対して：
  - `x: AnchorX[]` (サイズ M+1)
  - `y: AnchorY[]` (サイズ N+1)
  - `width: Width[]` (サイズ M)
  - `height: Height[]` (サイズ N)
- `getArea()` メソッドでセル境界を取得可能
- `.in(container)` と `.layout()` の両方のメソッドをサポート

### 2. HintFactory の拡張

`src/dsl/hint_factory.ts` を更新：

- `grid()` メソッドをオーバーロード
- 配列を渡すと FluentGridBuilder を返す
- SymbolId を渡すと既存の GridBuilder を返す（後方互換性）

### 3. 制約の定義

#### 位置制約（Required）
```
x[i+1] = x[i] + width[i]
y[i+1] = y[i] + height[i]
```

#### コンテナ制約（Required、コンテナ指定時）
```
container.width = sum(widths)
container.height = sum(heights)
x[0] = container.x
y[0] = container.y
```

#### シンボル配置制約（Strong）
```
y[row] ≤ symbol.top ≤ y[row+1]
y[row] ≤ symbol.bottom ≤ y[row+1]
x[col] ≤ symbol.left ≤ x[col+1]
x[col] ≤ symbol.right ≤ x[col+1]
```

## テスト

`tests/fluent_grid_api.test.ts` に包括的なテストを追加：

- 基本的な 2D 配列構文のテスト
- コンテナ付きグリッドのテスト
- `getArea()` メソッドのテスト
- エラーハンドリング（非矩形行列、空行列、無効なインデックス）
- すべてのテストが成功

## 例

`examples/fluent_grid_api.ts` に3つの例を追加：

1. 基本的な 2×2 グリッド（`.layout()` 使用）
2. コンテナ付きグリッド（`.in(container)` 使用）
3. `getArea()` を使用したセルアクセス

## ドキュメント

以下のドキュメントを作成：

- `docs/design/fluent-grid-api.md` - 英語版
- `docs/design/fluent-grid-api.ja.md` - 日本語版

API 仕様、制約定義、使用例、エラー処理について詳細に説明。

## 技術的な決定事項

### ブランド型の使用

Width と Height は `createBrandVariableFactory` を使用してブランド型として作成。これにより型安全性を確保。

### Cell 型の定義

`Cell` インターフェースは `Variable` 型を使用（ブランド型ではない）。これは AnchorX と AnchorY が直接 Variable として公開されるため。

### 制約の強度

- グリッド座標定義：Required（構造的制約）
- コンテナ制約：Required（サイズと位置を完全に決定）
- シンボル配置：Strong（柔軟性を残しながら範囲を制限）

## 後方互換性

既存の `hint.grid(container)` API は完全に保持。新しい API は追加機能として実装され、既存コードに影響なし。

## 今後の改善案

1. Gap オプションの追加（行/列の間隔指定）
2. Padding オプションの追加（セル内の余白）
3. アライメントオプション（セル内でのシンボル配置）
4. スパンセル機能（複数セルにまたがるシンボル）

## 確認事項

- ✅ すべてのテストが成功（既存テスト含む）
- ✅ ビルドエラーなし
- ✅ 例が正常に実行され、SVG を生成
- ✅ ドキュメント作成完了
- ✅ 型安全性確保
- ✅ エラーハンドリング実装

## 次のステップ

- コードレビュー依頼
- セキュリティチェック実行

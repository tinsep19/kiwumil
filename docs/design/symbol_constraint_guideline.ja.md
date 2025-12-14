[English](symbol_constraint_guideline.md) | 日本語

# 制約（Constraint）とは何か・その追加方法について

Symbol設計・配置の基礎となる「制約」について解説します。

---

## 制約（Constraint）とは？

制約とは、**Symbol内部の変数や区画（Bounds）間の値関係を線形条件で表したもの**です。  
これにより、Symbol同士や内部要素の整合性が自動的に保たれます。  
最終的な配置は**制約ソルバー**によって、すべての制約を満たす値が計算・決定されます。

---

## 制約追加までの図作成ステップ

1. **Symbolの作成（変数の作成）**  
   - Symbol内部の必要な変数（位置・サイズ、特性値など）を定義します。
   - Symbol内部の制約を作成します（この部分はSymbol作成者が担います）。

2. **配置ヒントの作成**  
   - Symbol同士の相対配置や並び方など、外部からのヒントを定義します。

3. **制約ソルバーによる解決**  
   - 追加した全ての制約・ヒントを元に、制約ソルバーが最適な値を決定します。

4. **レンダリング**  
   - 計算された値（位置・サイズなど）を元に、最終的にSVG等で描画します。

---

## 制約の具体例・記述例

### 例：`rect`矩形と`layout`外接矩形の制約

rectを描画する矩形、layoutをLayoutBounds（Symbol外接矩形）とすると、幅・位置に関する制約は次のように表せます。

```plain
layout.width >= rect.width + strokeWidth
layout.x + 0.5 * strokeWidth <= rect.x
layout.right >= rect.right + 0.5 * strokeWidth
```

これら**線形条件**を、プラットフォームの `ConstraintsBuilder` で記述すると：

```javascript
builder.expr([1, layout.width]).ge([1, rect.width], [1, strokeWidth]).strong()
builder.expr([1, layout.x], [0.5, strokeWidth]).le([1, rect.x]).strong()
builder.expr([1, layout.right]).ge([1, rect.right], [0.5, strokeWidth]).strong()
```

- `expr([...])` : 左辺（係数・変数の組）を指定。
- `.ge([...])`, `.le([...])` : 右辺（係数・変数・値）を指定し、大小関係を定義。
- `.strong()` : 制約の強度（優先度）を設定。

---

## 制約作成時のポイント

- **Symbol内部の制約はSymbol作成者が明示的に定義する必要があります。**
- 制約は基本的に「線形（一次）」条件で記述してください。
- `ConstraintsBuilder` を活用し、Symbolごとに関連するBounds・Variables間の関係式を追加します。

### ⚠️ 注意：特殊なケースについて

以下の制約タイプは **サポートされていません**：

| 制約タイプ | 説明 | 例 |
|-----------|------|-----|
| **非線形制約** | 変数の乗算や除算、べき乗、関数を含む制約 | `x * y >= 20`, `sin(x) > 0` |
| **条件付き制約** | 条件分岐を含む制約 | `if A then B` |

- **必ず線形条件（一次式）で制約式を記述**してください。
- 特殊な表現が必要な場合は、Symbol設計・構成の工夫で線形式に落とし込むことが求められます。

### 特殊な表現が必要な場合の対処法

非線形や条件付きの表現が必要な場合は、以下のような **構成の工夫** で対応してください：

1. **固定値の事前計算**: 実行前に値を計算し、定数として制約に組み込む
   ```typescript
   // 面積を固定したい場合、事前に幅と高さを計算
   const width = 100
   const height = 50  // 面積5000を維持するよう事前計算
   builder.expr([1, bounds.width]).eq([width, 1]).required()
   builder.expr([1, bounds.height]).eq([height, 1]).required()
   ```

2. **補助変数の導入**: 複雑な関係を複数の線形制約に分解
   ```typescript
   // 比率を維持したい場合
   // width : height = 16 : 9 → 9 * width = 16 * height
   builder.expr([9, bounds.width]).eq([16, bounds.height]).strong()
   ```

3. **制約強度の活用**: 優先順位を設定して柔軟なレイアウトを実現
   ```typescript
   builder.expr([1, bounds.width]).ge([100, 1]).required()  // 最小幅は必須
   builder.expr([1, bounds.width]).eq([200, 1]).weak()      // 理想幅は弱い制約
   ```

---

## 制約の効果

制約ソルバーはSymbol内部・外部の全ての制約と配置ヒントを考慮して、  
**自動的かつ整合性を保った位置・サイズ**を計算します。

この結果に基づき、**正しく整列したSymbol描画**が可能となります。

---

## 関連ドキュメント

- **[Layout System 設計書](./layout-system.ja.md)** - レイアウトシステムの内部実装
- **[Layout Hints API](./layout-hints.ja.md)** - ユーザー向けレイアウトヒント API
- **[Fluent 制約ビルダー移行計画](./fluent-constraint-builder-plan.ja.md)** - 制約ビルダーの設計

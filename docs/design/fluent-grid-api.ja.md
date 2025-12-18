# Fluent Grid API（流暢なグリッド API）

## 概要

Fluent Grid API は、グリッド座標系への明示的なアクセスを提供する、宣言的なグリッドベースのレイアウト作成方法です。この API は、基礎となるグリッドガイドと次元変数を公開することで、既存の GridBuilder を補完します。

## API 設計

### グリッドの作成

```typescript
const grid = hint.grid([
  [symbol1, symbol2],
  [null, symbol3],
  [null, symbol4]
])
```

`hint.grid()` メソッドは2次元配列（N×M 行列）を受け取ります：
- 各要素は `ISymbolCharacs` オブジェクトまたは `null`
- すべての行は同じ列数を持つ必要があります（矩形行列）
- `null` はグリッド内の空セルを表します

### レイアウトメソッド

#### 直接レイアウト
```typescript
hint.grid([
  [symbol1, symbol2],
  [null, symbol3]
]).layout()
```

コンテナなしで図全体にグリッドレイアウトを適用します。

#### コンテナ付きレイアウト
```typescript
hint.grid([
  [symbol1, symbol2],
  [null, symbol3]
]).in(container)
```

指定されたコンテナ内にグリッドレイアウトを適用します。グリッド寸法は自動的にコンテナの境界に合わせて制約されます。

### グリッドオブジェクトのプロパティ

`.layout()` と `.in(container)` の両方から返されるグリッドオブジェクトは以下を公開します：

```typescript
{
  x: AnchorX[],  // サイズ M+1 の配列（垂直グリッド線）
  y: AnchorY[],  // サイズ N+1 の配列（水平グリッド線）
  width: Width[],      // サイズ M の配列（列幅）
  height: Height[]     // サイズ N の配列（行高）
}
```

ここで：
- **M** = 列数
- **N** = 行数

### セル境界の取得

`getArea()` メソッドを使用して特定のセル境界にアクセスします：

```typescript
const cell = grid.getArea({
  top: 0,    // 上行インデックス
  left: 0,   // 左列インデックス
  bottom: 1, // 下行インデックス（排他的）
  right: 1   // 右列インデックス（排他的）
})

// 戻り値: { left, top, right, bottom } と Variable 参照
```

インデックスは0ベースで、グリッド線の番号付けに従います。異なる top/bottom または left/right 値を指定することで、複数のセルにまたがることができます。

## 制約の定義

### 幅/高さの合計制約

`.in(container)` を使用する場合、グリッドは自動的に必須制約を作成します：

```
container.bounds.width = w1 + w2 + w3 + ... + wM
container.bounds.height = h1 + h2 + h3 + ... + hN
```

### 位置制約

グリッド位置は必須制約で定義されます：

```
x[i+1] = x[i] + width[i]
y[i+1] = y[i] + height[i]
```

これにより、各グリッド線が前の線とセル寸法を加えた位置に配置されます。

### シンボル配置制約

位置 (row, col) の各非 null シンボルに対して、強制約がシンボルをセル内に保持します：

```
y[row] ≤ symbol.bounds.top ≤ y[row+1]
y[row] ≤ symbol.bounds.bottom ≤ y[row+1]
x[col] ≤ symbol.bounds.left ≤ x[col+1]
x[col] ≤ symbol.bounds.right ≤ x[col+1]
```

これらの制約により、シンボルはセル内のどこにでも配置でき、セル境界を越えて拡張することを防ぎます。

## 使用例

### 基本的な 2×2 グリッド

```typescript
const grid = hint.grid([
  [symbol1, symbol2],
  [symbol3, symbol4]
]).layout()

console.log(grid.x.length)  // 3 (M+1)
console.log(grid.y.length)  // 3 (N+1)
console.log(grid.width.length)  // 2 (M)
console.log(grid.height.length)  // 2 (N)
```

### 空セルのあるグリッド

```typescript
hint.grid([
  [symbol1, symbol2],
  [null, symbol3],
  [null, symbol4]
]).in(container)
```

### グリッド座標へのアクセス

```typescript
const grid = hint.grid([
  [a, b, c],
  [d, e, f]
]).layout()

// 左上セルの境界を取得
const cell00 = grid.getArea({ top: 0, left: 0, bottom: 1, right: 1 })

// 上部行全体を取得
const topRow = grid.getArea({ top: 0, left: 0, bottom: 1, right: 3 })

// 左列を取得
const leftCol = grid.getArea({ top: 0, left: 0, bottom: 2, right: 1 })
```

## 型安全性

API は完全に型安全です：
- 行列検証により矩形形状を保証
- `getArea()` でインデックス境界を検証
- TypeScript 型が無効なグリッド構成を防止
- 一般的な間違いに対する適切なエラーメッセージ

## GridBuilder との比較

| 機能 | FluentGridBuilder | GridBuilder |
|---------|------------------|-------------|
| API スタイル | 直接配列構文 | ビルダーパターン |
| グリッドアクセス | 完全な座標系を公開 | 制約のみ |
| 使用例 | グリッド座標が必要な場合 | シンプルなグリッドレイアウト |
| コンテナ | `.in()` でオプション | コンストラクタで必須 |

## エラー処理

API は一般的な問題に対して明確なエラーメッセージを提供します：

- **非矩形行列**: 行の長さが異なる場合にエラーをスロー
- **空の行列**: 配列が空の場合にエラーをスロー
- **無効なインデックス**: `getArea()` がすべてのインデックスが範囲内であることを検証
- **無効な範囲**: top < bottom および left < right を保証

## 実装ノート

- グリッド座標は直接変数アクセスのため AnchorX と AnchorY 型を使用
- Width と Height は制約システムからのブランド型
- すべてのグリッド制約は適切な強度（required または strong）で作成
- 座標系は既存のレイアウトヒントとシームレスに統合

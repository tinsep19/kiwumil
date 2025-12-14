[English](layout-hints.md) | 日本語

# Kiwumil レイアウトヒント API

## 概要

Kiwumil のレイアウトヒント API は、図の要素を宣言的に配置するためのユーザー向けインターフェースです。
Cassowary 制約ソルバーを利用した制約ベースのレイアウトエンジンを、直感的な API で操作できます。

内部実装の詳細については [Layout System 設計書](./layout-system.md) を参照してください。

---

## 設計哲学

### 1. 宣言的 API

ユーザーは「どう配置するか」ではなく「どう配置されるべきか」を宣言します。

```typescript
// ❌ 命令的（座標を直接指定）
a.setPosition(100, 200)
b.setPosition(150, 200)

// ✅ 宣言的（関係を指定）
hint.arrangeHorizontal(a, b)
```

### 2. 制約の組み合わせ

複数のレイアウトヒントを組み合わせて複雑な配置を実現します。

```typescript
hint.arrangeVertical(a, b, c)    // 縦に並べる
hint.alignCenterX(a, b, c)       // X軸中央を揃える
```

### 3. 直感的な命名

- **Arrange** = 配置（要素を並べる）
- **Align** = 整列（位置を揃える）
- **Enclose** = 包含（コンテナ内に配置）

---

## 基本的なヒント

### 1. Arrange（配置）

要素を特定の方向に等間隔で並べます。

#### arrangeHorizontal - 水平方向に並べる

```typescript
hint.arrangeHorizontal(a, b, c)
// 結果: a --- b --- c
```

**特徴:**
- デフォルト間隔: 80px
- Y 方向の位置は自動では揃わない（必要なら `alignTop/CenterY` などと組み合わせる）

#### arrangeVertical - 垂直方向に並べる

```typescript
hint.arrangeVertical(a, b, c)
// 結果:
// a
// |
// b
// |
// c
```

**特徴:**
- デフォルト間隔: 50px
- X 方向の位置は自動では揃わない（必要なら `alignLeft/CenterX` などと組み合わせる）

### 2. Align（整列）

要素の特定の辺や中心を揃えます。

#### 水平方向の整列

```typescript
// 左端を揃える
hint.alignLeft(a, b, c)
// 結果:
// |a
// |bb
// |ccc

// 右端を揃える
hint.alignRight(a, b, c)
// 結果:
//   a|
//  bb|
// ccc|

// X軸中央を揃える
hint.alignCenterX(a, b, c)
// 結果:
//   a
//  bb
// ccc
```

#### 垂直方向の整列

```typescript
// 上端を揃える
hint.alignTop(a, b, c)
// 結果: ___
//      |a|bb|ccc|

// 下端を揃える
hint.alignBottom(a, b, c)
// 結果:
//      |a|bb|ccc|
//      ‾‾‾

// Y軸中央を揃える
hint.alignCenterY(a, b, c)
// 結果: a  bb  ccc  (Y軸中央が揃う)
```

#### サイズの整列

```typescript
// 幅を揃える
hint.alignWidth(a, b, c)

// 高さを揃える
hint.alignHeight(a, b, c)

// 幅と高さの両方を揃える
hint.alignSize(a, b, c)
```

### 3. Enclose（包含）

コンテナ内に子要素を配置し、コンテナサイズを自動調整します。

```typescript
hint.enclose(container, [a, b, c])
hint.arrangeVertical(a, b, c)

// 結果:
// ┌─────────┐
// │    a    │
// │    b    │
// │    c    │
// └─────────┘
//  ↑ コンテナが自動拡大
```

**特徴:**
- コンテナは子要素を包含するよう自動的に拡大
- パディング: 20px（デフォルト）
- タイトルスペース: 50px（上部）

---

## 制約の組み合わせパターン

### パターン1: 垂直スタック + X軸中央揃え

```typescript
hint.arrangeVertical(a, b, c)
hint.alignCenterX(a, b, c)

// 結果:
//     a
//    bbb
//   ccccc
```

### パターン2: 水平スタック + Y軸中央揃え

```typescript
hint.arrangeHorizontal(a, b, c)
hint.alignCenterY(a, b, c)

// 結果: a bbb ccccc (Y軸中央が揃う)
```

### パターン3: コンテナ内配置

```typescript
hint.enclose(container, [a, b, c])
hint.arrangeVertical(a, b, c)
hint.alignCenterX(a, b, c)

// 結果: container内に中央揃えで縦並び
// ┌─────────┐
// │    a    │
// │   bbb   │
// │  ccccc  │
// └─────────┘
```

---

## Grid/Figure Builder

コンテナ内の要素配置を直感的に記述できる fluent-style API です。

### Grid Builder - 矩形行列配置

N×M の矩形配置をサポート。すべての行が同じ列数である必要があります。

```typescript
// 基本的な使い方（container引数省略 - diagram全体がデフォルト）
hint.grid()
  .enclose([[a, b], [c, d]] as const)
  .gap(10)                              // 行・列共通
  .gap({ row: 20, col: 10 })           // 個別指定
  .layout()

// 特定のコンテナを指定する場合
hint.grid(container)
  .enclose([[a, b], [c, d]] as const)
  .gap(10)
  .layout()

// 結果:
// ┌─────────────┐
// │  a     b    │
// │  c     d    │
// └─────────────┘
```

**特徴:**
- **引数省略対応**: `grid()` の引数を省略すると、diagram全体（`DIAGRAM_CONTAINER_ID`）がデフォルトコンテナになる
- 矩形検証: `isRectMatrix()` で検証、非矩形の場合はエラー
- gap設定: row/col 別々に指定可能
- alignment: なし（矩形グリッドのため）

### Figure Builder - 非矩形配置

行ごとに異なる要素数を許容する柔軟な配置。

```typescript
// 基本的な使い方（container引数省略 - diagram全体がデフォルト）
hint.figure()
  .enclose([[a, b], [c]] as const)
  .gap(15)                              // 行間のみ
  .align('center')                      // left/center/right
  .layout()

// 特定のコンテナを指定する場合
hint.figure(container)
  .enclose([[a, b], [c]] as const)
  .gap(15)
  .align('center')
  .layout()

// 結果 (center):
// ┌─────────────┐
// │   a    b    │
// │      c      │
// └─────────────┘
```

**特徴:**
- **引数省略対応**: `figure()` の引数を省略すると、diagram全体（`DIAGRAM_CONTAINER_ID`）がデフォルトコンテナになる
- 非矩形許容: 各行の要素数が異なってもOK
- gap設定: 行間のみ（列間は自動）
- alignment: left（デフォルト）, center, right

### Diagram全体のレイアウト

Grid/Figure Builder は diagram 全体のレイアウトにも対応しています。

**引数省略版（推奨）:**

```typescript
TypeDiagram("System Architecture")
  .build(({ el, rel, hint }) => {
    const frontend = el.core.rectangle("Frontend")
    const backend = el.core.rectangle("Backend")
    const database = el.core.rectangle("Database")
    
    // ✅ 引数なしで diagram 全体を Grid レイアウト
    hint.grid()
      .enclose([
        [frontend],
        [backend, database]
      ])
      .gap({ row: 40, col: 60 })
      .layout()
  })
```

**明示的指定版（下位互換）:**

```typescript
import { TypeDiagram, DIAGRAM_CONTAINER_ID } from "kiwumil"

TypeDiagram("System Architecture")
  .build(({ el, rel, hint }) => {
    const a = el.core.circle("A")
    const b = el.core.circle("B")
    
    // ✅ DIAGRAM_CONTAINER_ID を明示的に指定
    hint.grid(DIAGRAM_CONTAINER_ID)
      .enclose([[a, b]])
      .gap(20)
      .layout()
  })
```

### 使用例

#### 2×2グリッド

```typescript
const boundary = el.uml.systemBoundary("System")
const [a, b, c, d] = [
  el.core.rectangle("A"),
  el.core.rectangle("B"),
  el.core.rectangle("C"),
  el.core.rectangle("D")
]

hint.grid(boundary)
  .enclose([[a, b], [c, d]] as const)
  .gap({ row: 30, col: 60 })
  .layout()
```

#### 非矩形配置

```typescript
const boundary = el.uml.systemBoundary("System")
const [a, b, c, d, e] = [
  el.core.rectangle("A"),
  el.core.rectangle("B"),
  el.core.rectangle("C"),
  el.core.rectangle("D"),
  el.core.rectangle("E")
]

hint.figure(boundary)
  .enclose([[a], [b, c, d], [e]] as const)
  .gap(20)
  .align('center')
  .layout()

// 結果:
// ┌─────────────┐
// │      a      │
// │  b  c  d    │
// │      e      │
// └─────────────┘
```

---

## Guide API - ガイドラインによる配置

### 概要

Guide API は、水平・垂直の「ガイドライン」を定義し、複数のシンボルを共通の位置に配置する機能です。
Adobe Illustrator や Figma のガイドラインに相当します。

**設計思想:**
- ガイドラインは制約変数として表現
- シンボルを「ガイドに揃える」「ガイドに追従する」制約を追加
- Fluent API でメソッドチェーン可能

### 基本的な使い方

#### 1. 垂直ガイド（X軸）

```typescript
// 垂直ガイドを作成（X座標を共有）
const guide = hint.createGuideX(100)

// シンボルの左端をガイドに揃える
guide.alignLeft(a, b, c)

// 結果:
// a, b, c の左端が X=100 に揃う
```

#### 2. 水平ガイド（Y軸）

```typescript
// 水平ガイドを作成（Y座標を共有）
const guide = hint.createGuideY(200)

// シンボルの上端をガイドに揃える
guide.alignTop(a, b, c)

// 結果:
// a, b, c の上端が Y=200 に揃う
```

#### 3. シンボルからガイドを作成

```typescript
// シンボルの右端を基準にガイドを作成
const guide = hint.createGuideX(a, "right")

// 他のシンボルをガイドに揃える
guide.alignLeft(b, c)

// 結果:
// b, c の左端が a の右端に揃う
```

### GuideBuilderX のメソッド

垂直ガイド（X軸）用のビルダー。

| メソッド | 説明 | 制約 |
|---------|------|------|
| `alignLeft(...symbols)` | 左端を揃える | `symbol.x = guide.x` |
| `alignRight(...symbols)` | 右端を揃える | `symbol.right = guide.x` |
| `alignCenter(...symbols)` | X軸中央を揃える | `symbol.centerX = guide.x` |
| `followLeft(symbol)` | 左端に追従 | `guide.x = symbol.x` |
| `followRight(symbol)` | 右端に追従 | `guide.x = symbol.right` |
| `followCenter(symbol)` | X軸中央に追従 | `guide.x = symbol.centerX` |
| `arrange(gap?)` | 揃えたシンボルを縦に並べる | `arrangeVertical` |

**例:**

```typescript
const guide = hint.createGuideX(100)
guide
  .alignCenter(a, b, c)  // X軸中央を揃える
  .arrange(10)           // 縦に10px間隔で並べる

// 結果:
//    a
//    b  ← X軸中央が揃っている
//    c
```

### GuideBuilderY のメソッド

水平ガイド（Y軸）用のビルダー。

| メソッド | 説明 | 制約 |
|---------|------|------|
| `alignTop(...symbols)` | 上端を揃える | `symbol.y = guide.y` |
| `alignBottom(...symbols)` | 下端を揃える | `symbol.bottom = guide.y` |
| `alignCenter(...symbols)` | Y軸中央を揃える | `symbol.centerY = guide.y` |
| `followTop(symbol)` | 上端に追従 | `guide.y = symbol.y` |
| `followBottom(symbol)` | 下端に追従 | `guide.y = symbol.bottom` |
| `followCenter(symbol)` | Y軸中央に追従 | `guide.y = symbol.centerY` |
| `arrange(gap?)` | 揃えたシンボルを横に並べる | `arrangeHorizontal` |

**例:**

```typescript
const guide = hint.createGuideY(200)
guide
  .alignCenter(a, b, c)  // Y軸中央を揃える
  .arrange(20)           // 横に20px間隔で並べる

// 結果:
// a  b  c  ← Y軸中央が揃っている
```

### Follow系メソッドの使い方

`follow*` は、ガイドをシンボルの位置に追従させます。

**align vs follow:**

```typescript
// align: ガイドの位置にシンボルを揃える
guide.alignLeft(a, b)  // a.x = guide.x, b.x = guide.x

// follow: シンボルの位置にガイドを追従
guide.followRight(a)   // guide.x = a.right
```

**実用例（相対配置）:**

```typescript
// a の右端から 10px 離れた位置にガイドを作成
const guide = hint.createGuideX()
guide.followRight(a)

// b をガイドに揃える（= a の右端に揃える）
guide.alignLeft(b)

// a と b の間に gap を追加
// （別の制約で gap を指定）
```

> Note: `follow*` メソッドはガイド自身に強い `Eq` 制約を貼るため、1つのガイドにつき1回だけ呼び出せます。複数のシンボルを基準にしたい場合はガイドを分けてください。

### 応用例

#### 例1: 複雑な整列

```typescript
// 中央揃えのガイドライン
const centerX = hint.createGuideX().followCenter(container)
const centerY = hint.createGuideY().followCenter(container)

// タイトルを中央上部に配置
centerX.alignCenter(title)
hint.createGuideY(50).alignTop(title)

// コンテンツを中央に配置
centerX.alignCenter(content)
centerY.alignCenter(content)

// 結果:
// ┌─────────────┐
// │    title    │  ← X軸中央、Y=50
// │             │
// │   content   │  ← XY両方中央
// │             │
// └─────────────┘
```

#### 例2: マルチカラムレイアウト

```typescript
// 3つのカラムガイドを作成
const col1 = hint.createGuideX(100)
const col2 = hint.createGuideX(250)
const col3 = hint.createGuideX(400)

// 各カラムにシンボルを配置
col1.alignLeft(a1, a2, a3).arrange(10)
col2.alignLeft(b1, b2, b3).arrange(10)
col3.alignLeft(c1, c2, c3).arrange(10)

// 結果:
// a1  b1  c1
// a2  b2  c2
// a3  b3  c3
```

#### 例3: ベースライン揃え

```typescript
// テキストのベースラインを揃える
const baseline = hint.createGuideY()
baseline.followBottom(title)  // タイトルの下端を基準
baseline.alignBottom(subtitle, date)  // 他のテキストも揃える

// 結果:
// Title___  Subtitle___  2024-01-01___  ← 下端が揃う
```

---

## まとめ

### 実装済み機能

- ✅ **Arrange**: arrangeHorizontal / arrangeVertical
- ✅ **Align**: alignLeft / alignRight / alignTop / alignBottom / alignCenterX / alignCenterY / alignWidth / alignHeight / alignSize
- ✅ **Enclose**: コンテナ内への自動配置とサイズ調整
- ✅ **Grid/Figure Builder**: 直感的な2Dレイアウト API
- ✅ **Guide API**: 水平・垂直ガイドラインによる配置

### 設計原則

- ✅ **宣言的 API**: 「どう配置されるべきか」を記述
- ✅ **制約の組み合わせ**: 複数のヒントで複雑な配置を実現
- ✅ **直感的な命名**: Arrange, Align, Enclose の3つの基本概念
- ✅ **Fluent API**: メソッドチェーンで読みやすいコード

### 将来の拡張

- [ ] Distribute（等間隔配置）
- [ ] Flexbox風レイアウト
- [ ] Grid/Figure Builder の padding サポート
- [ ] 複雑なalignmentオプション（stretch, baseline等）
- [ ] ネストされたグリッド
- [ ] レスポンシブ対応（min/max constraints）

---

## 関連ドキュメント

- **[Layout System 設計書](./layout-system.md)** - 内部実装の詳細（LayoutContext, 制約ソルバー、LayoutBound など）
- **[Namespace-based DSL](./namespace-dsl.md)** - DSL設計とAPI使い方
- **[Plugin System](./plugin-system.md)** - プラグイン作成ガイド
- **[Theme System](./theme-system.md)** - テーマシステムの設計

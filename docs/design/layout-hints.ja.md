[English](layout-hints.md) | 日本語

## ヒント API の思想

**Hint API は「数値で描くための API」ではありません。しかし、数値を排除する API でもありません。**
マージンやパディング、線幅、場合によっては縦横比など、数値が意味を持つ場面では数値を使いますが、座標を直接指定する命令的な配置は避けます。

kiwumil が避けるもの:

- 絶対座標の指定
- 「要素を (x, y) に置く」ような命令的な指示
- 見た目の都合だけで意味を歪める指定

### "きれい" の本質

kiwumil は「整列」が視覚的に重要だと考えます。

- 中心が揃う
- 端が揃う
- 間隔が均一である
- 視覚基準線が通る

これらはすべて関係性として表現可能であり、Hint API はそのための手段を提供します。

### 自動レイアウトの立ち位置

完全自動は目指さず、次の2段階で扱います：

1. `figure` / `grid` で大まかな骨格を配置
2. Hint で人の意図（整列や関係）を与えて細部を整える

### 使い方の感覚（上位概念）

1. `figure` / `grid`（enclose 系）で構造を作る
2. `align` / `arrange` でエッジや中心を揃え、間隔を整える

Hint は「ここに置け」ではなく「こう揃えたい」「この関係を保ちたい」という意図を伝える API です。

### まとめ

- 数値は使うが、数値が支配しない
- 自動化は補助であり主役ではない
- 視覚品質は整列で決まる
- 大まかな構造 → 人による細部調整、が基本ワークフローです


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
  .layout(({ el, rel, hint }) => {
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
  .layout(({ el, rel, hint }) => {
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


---

# HintFactory の配置と layout hint の拡張性に関する設計メモ

目的
- HintFactory（src/dsl/hint_factory.ts）の現在の配置と、layout hint（layout/hint 以下）の拡張性に関する設計判断を明文化する。
- 将来の変更（移動、拡張）時の判断基準と実務的手順を残す。

結論（要旨）
- 現状は src/dsl/hint_factory.ts に置くのが妥当。理由は DSL 層の API（ユーザーが hint を記述する窓口）としての責務が明確であり、既存のインポート／テスト構成や循環依存回避策と整合しているため。
- layout/hint 以下（src/kiwi/hint）にはヒントの具象 Builder 実装（GridBuilder, FigureBuilder, GuideBuilderImpl 等）を置くのが妥当。
- ただし将来的な拡張要件に備えて、小さくて互換性を壊さない拡張ポイント（metadata や handler registry の余地）を残すことを推奨する。

現状コード参照（代表）
- HintFactory: src/dsl/hint_factory.ts
  - https://github.com/tinsep19/kiwumil/blob/8207ee5d694964ca96e54646308b04302c6c424a/src/dsl/hint_factory.ts
- GridBuilder: src/kiwi/hint/grid_builder.ts
  - https://github.com/tinsep19/kiwumil/blob/8207ee5d694964ca96e54646308b04302c6c424a/src/kiwi/hint/grid_builder.ts
- FigureBuilder: src/kiwi/hint/figure_builder.ts
  - https://github.com/tinsep19/kiwumil/blob/8207ee5d694964ca96e54646308b04302c6c424a/src/kiwi/hint/figure_builder.ts

設計理由（詳細）
- 層の責務分離
  - HintFactory は LayoutContext と Symbols を受け取り、DSL から呼ばれる「hint API」を提供するファサード的役割を果たしている。これは DSL 層に属する責務であり、src/dsl に置くことで責務分離が明確になる。
- 既存のインポート／テストとの整合
  - テストや他の DSL コードが src/dsl/hint_factory を直接参照しているため、移動は参照の一括更新を伴う。現状のままにしておくことで互換性を保てる。
- 循環依存の回避
  - layout/hint/* の方は HintFactory を型のみ参照（`import type { HintFactory }`）しており、実行時循環を避ける設計になっている。HintFactory を layout 側に移すと import の向きや値/型インポートを見直す必要があり、注意が必要。

拡張性に関する方針（平衡的な案）
- 当面は非拡張（固定メソッド群）でシンプルに保つ。
- 将来に備えた小さな拡張ポイントを追加する（互換性を壊さない範囲で）：
  1. LayoutHint オブジェクトに optional metadata?: Record<string, unknown> を追加（既存コードは無視して動くようにする）。
  2. LayoutContext に optional handler registry を用意し、将来プラグインが handler を登録できるようにする（未登録の hint は無害スキップ）。
  3. 未知の kind を安全に無視し、開発時には警告を出すロギングを入れる。
- これらは大きな API 変更を伴わず段階的に導入可能。

いつ移動を検討するか（トリガー）
- 外部プラグイン／テーマで独自 hint を追加する予定が生じたとき
- 要素種別ごとに大量の専用ヒントが必要になり、ヒントの集合が肥大化してきたとき
- リファクタで DSL と layout 層の境界を再定義する大きな作業を行うと判断したとき

移行（ファイル移動）チェックリスト
1. 影響調査
   - リポジトリ全体で `hint_factory` を参照している箇所を列挙する（例: rg/git grep）。
2. 一時ブランチ作成
   - git checkout -b feat/move-hint-factory
3. ファイル移動
   - mkdir -p src/kiwi/hint (移動先)
   - git mv src/dsl/hint_factory.ts src/kiwi/hint/hint_factory.ts
4. インポート更新
   - 参照しているファイルの import を更新（型のみ import の箇所は `import type` のまま維持）。
5. バレル／再エクスポート（互換性）
   - 必要なら src/dsl/index.ts に旧パスをエクスポートする薄いラッパーを置き、一時互換を保つ。
6. ビルド・テスト・リンタ実行
   - pnpm/yarn/npm run build
   - pnpm/yarn/npm test
   - eslint/tsc の警告・エラーを解消
7. 循環依存チェック
   - madge や depcruise によるサイクル検査
8. CI 実行・PR 作成
   - CI が通ることを確認してから Pull Request を作成

短いコード例（拡張ポイント）
- metadata を受ける hint の形（擬似）
```ts
type LayoutHint = {
  kind: string
  params?: Record<string, unknown>
  metadata?: Record<string, unknown> // 拡張ポイント
}
```

- handler registry の形（擬似）
```ts
class LayoutContext {
  private hintHandlers = new Map<string, (hint: LayoutHint) => void>()

  registerHintHandler(kind: string, handler: (hint: LayoutHint) => void) {
    this.hintHandlers.set(kind, handler)
  }

  applyHint(hint: LayoutHint) {
    const handler = this.hintHandlers.get(hint.kind)
    if (handler) {
      handler(hint)
    } else {
      // 未知の kind は無視（または警告ログ）
      console.warn(`Unknown hint kind: ${hint.kind}`)
    }
  }
}
```

まとめ
- 現在の配置（HintFactory → src/dsl, Builders → src/kiwi/hint）は合理的で問題ない。
- 拡張性は非拡張（固定）を基本としつつ、小さな拡張ポイント（metadata, handler registry）を段階的に追加する方針が推奨される。
- 移動が必要になった場合は、上記チェックリストに従って慎重に作業すること。


---

# DESIGN: Hints / Symbols / HintFactory の設計

日付: 2025-12-04  
ステータス: 実装完了  
作成者: tinsep19 チーム

## 背景と目的
Guide を作成する際に、Guide 側で Variable を直接扱いたい（制約を直接作成できるようにしたい）という要望がありました。これに合わせて以下の設計方針を採用します：

- KiwiSolver の既存 API を変更しない（新メソッドは追加しない）。
- Hints は内部的に既存の KiwiSolver API を使って Variable（＝ソルバが管理する変数）を生成するが、生成された変数を Symbols に自動登録しない。
- HintFactory は LayoutContext を保持せず Hints を保持する。Guide は Hints を経由して変数を得て、その変数と既存 Symbols が管理する Symbol との間で制約を作る。
- Symbols は旧 LayoutVariables と Variables の責務を一つに併合する（別ハンドル型は定義しない）。

この設計は、Guide が変数を直接操作できる柔軟性を確保しつつ、既存のソルバ API 互換性を保持して影響範囲を限定することをねらいとします。

---

## 主要コンポーネントと責務

### KiwiSolver
- 既存の変数作成・制約作成・解法 API をそのまま使う（変更は行わない）。
- 変数（Variable）と制約（Constraint）の実体を管理する（所有者）。
- Constraint に creator/tag 等のメタ情報を付与できると望ましい（管理・削除が容易になる）。

### Symbols（旧: LayoutVariables + Variables の併合）
- Symbol 名、Bounds、関連する既存 Symbol に関するユーティリティ（align, pin, setMin/Max 等）を管理する。
- Symbols は solver が管理する変数への参照を持つことはあるが、Hints が作った変数を自動的に登録・管理はしない。
- Symbols は Symbol 間の補助的な制約生成メソッドを提供する（ただし Hints の変数は登録対象外）。

### Hints
- Hints.createHintVariable(...) などの API で内部的に既存 KiwiSolver の API を呼んで Variable を生成する。
- 生成された変数は Hints のスコープ（その Hint の生成物）として保持する。Symbols へは登録しない。
- Hint 固有の制約は solver に登録し、その制約 ID 等を Hints が保持する。

### HintFactory
- HintFactory は LayoutContext を保持しない。代わりに Hints インスタンスを注入して保持する。
- Guide からのリクエストを受け、Hints を使って Variable を作成し、その変数オブジェクトを Guide に渡す。
- Guide は受け取った変数を使って、必要な制約を自ら生成（solver API を呼ぶ）して Symbols が管理する Symbol とつなぐ。

### Guide（利用者側の振る舞い）
- HintFactory から渡された Variable（オブジェクト参照）を受け取り、必要に応じて Symbols の Symbol（名前で取得）と制約を作成する。
- Guide が作成した制約のライフサイクル管理（削除タイミング）は Guide 側が明確に持つ。

---

## 生成・接続フロー（例）
1. Guide が HintFactory に対してヒント（例:「アンカー変数が欲しい」）を要求する。
2. HintFactory が Hints.createHintVariable を呼ぶ。
3. Hints は既存の KiwiSolver API を呼び、必要な Variable を生成する。必要なら Hint 固有の補助制約を solver に登録する。
4. Hints は生成した Variable を Guide に返す（Symbols には登録しない）。
5. Guide は Symbols.get("symbolX") で既存 Symbol を参照し、solver の制約作成 API を呼んで Symbol と Hints が作った Variable を結ぶ制約を作る。
6. Guide の不要化時に、Guide は自分が作成した制約を削除する。

---

## API 注意点（設計上の約束）
- KiwiSolver の API 変更は行わない。Hints は既存 API をそのまま利用する。
- Constraint の生成 API は「変数オブジェクト参照」を受け入れることが前提。もし現実装が名前ベースのみであれば、ラッパーを用意する必要あり。
- Constraint に creator/tag 情報を付加するオプションがあると管理が容易（どの Hint/Guide が生成したか追跡可能）。

---

## 命名・スコープポリシー
- Hints が生成する変数に名前付けする場合は自動プレフィックスを付与する（例: hint:anchor_x_1234）。
- Symbols が管理する変数名と衝突しないように注意する。
- Guide が作成する制約には、作成元を示すメタデータ（creator/tag）を付与することを推奨する。

---

## 実装状況

### 実装完了（2025-12-04）

#### Hints クラス (`src/hint/hints.ts`)
- ✅ `createHintVariable(options?: HintVariableOptions): HintVariable` メソッドを実装
  - 内部で `KiwiSolver.createLayoutVar()` を呼び出し
  - 自動プレフィックス `hint:` を付与
  - カウンターによる自動命名（例: `hint:guide_x_0`, `hint:guide_x_1`）
  - 生成した変数を Hints インスタンスで保持
- ✅ `getHintVariables(): readonly HintVariable[]` メソッドを実装
  - Hints が作成したすべての hint 変数を取得可能

#### HintVariableOptions インターフェース
```typescript
interface HintVariableOptions {
  name?: string        // 変数名サフィックス（オプション）
  baseName?: string    // ベース名（デフォルト: "var"）
}
```

#### HintVariable インターフェース
```typescript
interface HintVariable {
  variable: LayoutVar           // 生成された LayoutVar
  name: string                  // hint: プレフィックス付きの完全な変数名
  constraintIds: LayoutConstraintId[]  // 関連する制約 ID
}
```

#### GuideBuilder の統合 (`src/hint/guide_builder.ts`)
- ✅ `GuideBuilderImpl` のコンストラクタを更新
  - `context.variables.createVar()` から `context.hints.createHintVariable()` に変更
  - GuideBuilder が作成する変数も Hints で追跡可能

### テストカバレッジ
- ✅ `tests/hints_createHintVariable.test.ts`: 基本動作テスト（9件）
- ✅ `tests/hintfactory_integration.test.ts`: 統合テスト（6件）
- ✅ 既存テスト（108件）もすべて合格

### 利用例

#### 基本的な使用方法
```typescript
const context = new LayoutContext(theme)

// Hint 変数を作成
const anchor = context.hints.createHintVariable({
  baseName: "anchor_x",
  name: "center"
})
// 生成される変数名: "hint:anchor_x_center"

// 制約を作成
context.createConstraint("anchor/position", (builder) => {
  builder.ct([1, anchor.variable]).eq([100, 1]).strong()
})
```

#### GuideBuilder との統合
```typescript
const hint = new HintFactory({ context, symbols })

// ガイドを作成（内部で Hints.createHintVariable を使用）
const guideX = hint.createGuideX(100)
guideX.alignLeft(symbol1.id, symbol2.id)

// Hints が作成した変数を確認
const hintVars = context.hints.getHintVariables()
console.log(hintVars.map(v => v.name))
// => ["hint:guide_x_guideX-0", ...]
```

### 実装の特徴
1. **既存 API との互換性**: KiwiSolver の API は一切変更していない
2. **Symbols との分離**: Hints が作成した変数は Symbols に自動登録されない
3. **追跡可能性**: `getHintVariables()` で作成した変数を取得可能
4. **命名規則**: `hint:` プレフィックスで明確に区別
5. **後方互換性**: 既存のコードはすべて動作し続ける

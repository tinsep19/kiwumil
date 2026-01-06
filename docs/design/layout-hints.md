[日本語](layout-hints.ja.md) | English

## Hint API — Design philosophy

**Hint API is not an API to "draw numbers" — but it is not an API that forbids numbers either.**
Use numeric values when they have meaning (margins, padding, stroke widths, aspect hints), but avoid commanding absolute positions.

Kiwumil avoids:

- absolute coordinate specifications
- imperative placement like "put this element at (x, y)"
- tweaking visual details in a way that breaks semantic meaning

### What matters visually

Kiwumil is built on the premise that alignment is the biggest factor in perceived cleanliness:

- centers aligned
- edges aligned
- consistent spacing
- visual reference lines

These are relationships; Hint API expresses those relationships.

### Auto layout stance

Kiwumil does not aim for fully automatic layout. Instead it uses a two-stage approach:

1. rough placement via `figure` / `grid` to build the skeleton
2. refinement via human-directed Hints to express alignment/intention

This avoids hiding user intent while providing automation where it helps.

### How to use Hints (high level)

1. Use `figure` / `grid` (enclose) to create the broad structure.
2. Use `align` / `arrange` Hints to align edges/centers and tidy spacing.

Hints communicate intent ("I want these centered", "I want these aligned"). The engine converts intent into constraints and solves for coordinates.

### Key takeaways

- Use numbers when meaningful, but don't let numbers dominate layout decisions.
- Automation is an assistant, not the decision-maker.
- Alignment (relationships) is the core of visual quality.
- Workflow: broad structure → human-guided refinement.



## Quick start (example)

```typescript
import { TypeDiagram, UMLPlugin } from "kiwumil"

TypeDiagram("First Milestone")
  .use(UMLPlugin)
  .layout(({ el, rel, hint }) => {
    const user = el.uml.actor("User")
    const login = el.uml.usecase("Login")

    rel.uml.associate(user, login)
    hint.arrangeVertical(user, login)
  })
  .render("output.svg")
```


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

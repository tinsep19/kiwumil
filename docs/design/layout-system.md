# Kiwumil レイアウトシステム設計書

## 概要

Kiwumil のレイアウトシステムは、制約ベースの自動レイアウトエンジンです。
Cassowary アルゴリズムを使用して、宣言的なレイアウトヒントから最適な配置を計算します。

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

## 制約システムの概要

### 制約の種類

Kiwumil は3種類の制約を提供します：

#### 1. Arrange（配置）

要素を特定の方向に等間隔で並べます。

```typescript
// 水平方向に並べる
hint.arrangeHorizontal(a, b, c)
// 結果: a --- b --- c

// 垂直方向に並べる
hint.arrangeVertical(a, b, c)
// 結果:
// a
// |
// b
// |
// c
```

#### 2. Align（整列）

要素の特定の辺や中心を揃えます。

```typescript
// 左端を揃える
hint.alignLeft(a, b, c)

// X軸中央を揃える
hint.alignCenterX(a, b, c)

// Y軸中央を揃える
hint.alignCenterY(a, b, c)
```

#### 3. Enclose（包含）

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

### 制約の優先順位

制約ソルバー（Cassowary）は以下の強度で制約を解決します：

| 制約タイプ | 強度 | 理由 |
|-----------|------|------|
| Enclose（子要素の位置） | REQUIRED | 子要素が必ずコンテナ内に配置 |
| Enclose（コンテナの拡大） | REQUIRED | コンテナが必ず子要素を含む |
| Arrange（間隔） | STRONG | 要素間の間隔を厳密に保つ |
| Align（整列） | STRONG | 整列を厳密に保つ |
| コンテナの最小サイズ | WEAK | 子要素に応じて拡大可能 |
| 非コンテナのサイズ | REQUIRED (Eq) | サイズは固定 |

この優先順位により、制約が競合せずに解決されます。

### 制約の組み合わせパターン

#### パターン1: 垂直スタック + X軸中央揃え

```typescript
hint.arrangeVertical(a, b, c)
hint.alignCenterX(a, b, c)

// 結果:
//     a
//    bbb
//   ccccc
```

#### パターン2: 水平スタック + Y軸中央揃え

```typescript
hint.arrangeHorizontal(a, b, c)
hint.alignCenterY(a, b, c)

// 結果: a bbb ccccc (Y軸中央が揃う)
```

#### パターン3: コンテナ内配置

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

## Symbol の役割

### Symbol とは

Symbol は図の要素（ノード）を表現する基底クラスです。すべてのシンボルは以下のプロパティを持ちます：

```typescript
interface SymbolBase {
  id: SymbolId
  name: string
  bounds: Bounds  // レイアウト後に確定
}

interface Bounds {
  x: number
  y: number
  width: number
  height: number
}
```

### Symbol の種類

以下のような Symbol が存在します。これらは**プラグインから提供**されます：

- **Usecase** - 楕円形（ユースケース図）
- **Actor** - 棒人間（ユースケース図）
- **SystemBoundary** - システム境界（コンテナ）
- **Rectangle** - 矩形
- **RoundedRectangle** - 角丸矩形
- **Circle** - 円形
- **DiagramSymbol** - 図全体を表す特殊なシンボル（後述）

プラグインは `createSymbolFactory()` を実装して、これらの Symbol を生成する DSL 関数を提供します。
詳細は [Plugin System](./plugin-system.md) を参照してください。

### Symbol の責務

#### 1. 形状の定義と描画

各 Symbol は自身の形状の定義を持ち、SVG での描画の責務を持ちます。

```typescript
class Circle extends SymbolBase {
  toSVG(): string {
    const cx = this.bounds.x + this.bounds.width / 2
    const cy = this.bounds.y + this.bounds.height / 2
    const r = Math.min(this.bounds.width, this.bounds.height) / 2
    return `<circle cx="${cx}" cy="${cy}" r="${r}" ... />`
  }
}
```

#### 2. 接続点の計算

各 Symbol は関係線の接続点を計算します（詳細は後述）。

```typescript
interface SymbolBase {
  getConnectionPoint(from: Point): Point
}
```

---

## 関係線（Relationship）の役割

### Relationship とは

Relationship は Symbol 間の関係（エッジ）を表現します。

```typescript
interface RelationshipBase {
  id: RelationshipId
  fromId: SymbolId
  toId: SymbolId
}
```

### Relationship の種類

以下のような Relationship が存在します。これらは**プラグインから提供**されます：

- **Association** - 関連（実線）
- **Include** - インクルード（破線 + <<include>>）
- **Extend** - 拡張（破線 + <<extend>>）
- **Generalize** - 汎化（実線 + 三角形）

プラグインは `createRelationshipFactory()` を実装して、これらの Relationship を生成する DSL 関数を提供します。
詳細は [Plugin System](./plugin-system.md) を参照してください。

### 接続点の計算

Relationship は始点と終点の Symbol に接続点を問い合わせます。

```typescript
class Association extends RelationshipBase {
  toSVG(symbols: Map<SymbolId, SymbolBase>): string {
    const fromSymbol = symbols.get(this.fromId)!
    const toSymbol = symbols.get(this.toId)!
    
    // 各シンボルの中心を計算
    const fromCenter = {
      x: fromSymbol.bounds.x + fromSymbol.bounds.width / 2,
      y: fromSymbol.bounds.y + fromSymbol.bounds.height / 2
    }
    const toCenter = {
      x: toSymbol.bounds.x + toSymbol.bounds.width / 2,
      y: toSymbol.bounds.y + toSymbol.bounds.height / 2
    }
    
    // 各シンボルに接続点を問い合わせ
    const fromPoint = fromSymbol.getConnectionPoint(toCenter)
    const toPoint = toSymbol.getConnectionPoint(fromCenter)
    
    return `<line x1="${fromPoint.x}" y1="${fromPoint.y}" 
                  x2="${toPoint.x}" y2="${toPoint.y}" ... />`
  }
}
```

### 接続点計算のアルゴリズム

各 Symbol は、関係線が接続される際に最適な接続点を計算します。

接続点を Symbol の役割とすることで、シンプルなアルゴリズムで以下の効果が得られます：

- ✅ 矢印がシンボル内部に入り込まない
- ✅ 楕円、矩形、アクターなど各シンボル形状に対応
- ✅ 始点からの方向に基づいた最適な接続点を計算

#### アクターシンボルの例

アクターの頭部（円）または胴体（矩形）の境界との交点を返します。

```typescript
getConnectionPoint(from: Point): Point {
  // 頭部の中心
  const headCx = this.bounds.x + this.bounds.width / 2
  const headCy = this.bounds.y + this.headRadius
  
  // 胴体の中心
  const bodyCx = this.bounds.x + this.bounds.width / 2
  const bodyCy = this.bounds.y + this.bounds.height / 2
  
  // 始点から頭部/胴体のどちらが近いかを判定
  const distToHead = Math.hypot(from.x - headCx, from.y - headCy)
  const distToBody = Math.hypot(from.x - bodyCx, from.y - bodyCy)
  
  if (distToHead < distToBody) {
    // 頭部（円）との交点を計算
    // ...
  } else {
    // 胴体（矩形）との交点を計算
    // ...
  }
}
```

---

## 特別な Symbol: DiagramSymbol

### 概要

DiagramSymbol は、図全体を表す特殊なシンボルです。すべてのユーザー定義シンボルを自動的に包含し、タイトルやメタデータを表示します。

### 設計思想

従来は最初のシンボルを (50, 50) に配置していましたが、DiagramSymbol の導入により：

1. **DiagramSymbol** が常に配列の最初の要素として追加される
2. DiagramSymbol が (0, 0) に固定される
3. すべてのユーザーシンボルが DiagramSymbol 内に enclose される
4. **viewport が常に (0, 0) から始まる**

これにより、図全体の境界計算が不要になり、より予測可能なレイアウトを実現します。

### 使用例

```typescript
TypeDiagram("My Diagram", (el, rel, hint) => {
  const a = el.circle("A")
  const b = el.circle("B")
  hint.arrangeHorizontal(a, b)
})
```

内部処理：

1. `TypeDiagram` が `LayoutVariableContext` を生成
2. すべてのシンボルが `layoutBounds = { x, y, width, height }` の `LayoutVar` を取得
3. `DiagramSymbol("__diagram__", "My Diagram")` を作成し、配列の先頭へ追加
4. 自動的に `hint.enclose(diagramSymbol, userSymbols)` を挿入
5. レイアウト計算を実行
   - DiagramSymbol は (0, 0) 付近に固定
   - ユーザーシンボルは DiagramSymbol 内に配置
   - DiagramSymbol のサイズは内容に応じて自動拡大

### レイアウト制約

#### DiagramSymbol の位置固定

```typescript
// LayoutSolver.solve() - DiagramSymbol の LayoutVar を固定
const layout = new LayoutVariableContext()
const diagram = diagramSymbol.ensureLayoutBounds(layout)

layout.addConstraint(diagram.x, kiwi.Operator.Eq, 0)
layout.addConstraint(diagram.y, kiwi.Operator.Eq, 0)
```

#### DiagramSymbol のサイズ制約

DiagramSymbol はコンテナとして扱われるため、最小サイズのみ指定されます（WEAK 制約）。

```typescript
// 最小サイズのみ指定 (LayoutVariableContext)
layout.addConstraint(diagram.width, kiwi.Operator.Ge, 200, kiwi.Strength.weak)
layout.addConstraint(diagram.height, kiwi.Operator.Ge, 150, kiwi.Strength.weak)
```

#### ユーザーシンボルの配置制約

自動的に追加される enclose ヒント：

```typescript
// TypeDiagram 内部
if (userSymbols.length > 0) {
  hints.push({
    type: "enclose",
    symbolIds: [],
    containerId: diagramSymbol.id,
    childIds: userSymbols.map(s => s.id)
  })
}
```

これにより、すべてのユーザーシンボルが DiagramSymbol 内に配置され、DiagramSymbol が自動的に拡大します。

### パディングとスペース

DiagramSymbol は以下のスペースを確保します：

```typescript
// DiagramSymbol.toSVG()
const titleSpace = 50      // タイトル用（上部）
const metadataSpace = 30   // メタデータ用（下部、オプション）
const sidePadding = 20     // 左右のパディング
```

実際の enclose 制約でのパディング：

```typescript
// LayoutVariableContext を使った enclose 制約
const padding = 20
layout.addConstraint(child.x, kiwi.Operator.Ge, layout.expression([{ variable: container.x }], padding))
layout.addConstraint(child.y, kiwi.Operator.Ge, layout.expression([{ variable: container.y }], 50)) // タイトル分

layout.addConstraint(
  layout.expression([{ variable: container.width }, { variable: container.x }]),
  kiwi.Operator.Ge,
  layout.expression([{ variable: child.x }, { variable: child.width }], padding)
)

layout.addConstraint(
  layout.expression([{ variable: container.height }, { variable: container.y }]),
  kiwi.Operator.Ge,
  layout.expression([{ variable: child.y }, { variable: child.height }], padding)
)
```

### SVG 出力

DiagramSymbol は以下を描画します：

```xml
<g id="__diagram__">
  <!-- 背景 -->
  <rect x="0" y="0" width="..." height="..." fill="white" stroke="..." />
  
  <!-- タイトル（上部中央） -->
  <text x="centerX" y="30" 
        text-anchor="middle" 
        font-size="18" 
        font-weight="bold">
    My Diagram
  </text>
  
  <!-- メタデータ（右下、オプション） -->
  <text x="width-10" y="height-10" 
        text-anchor="end" 
        font-size="9" 
        opacity="0.5">
    Created: 2025-11-13 | Author: Team
  </text>
</g>
```

### viewport の計算

DiagramSymbol を使用することで、viewport の計算が単純化されます：

```typescript
// SvgRenderer.ts
const diagramSymbol = symbols[0]  // 必ず最初の要素
const viewBox = `0 0 ${diagramSymbol.bounds.width} ${diagramSymbol.bounds.height}`

// SVG
<svg viewBox="0 0 300 200">
  <!-- DiagramSymbol + ユーザーシンボル -->
</svg>
```

以前は全シンボルの境界を計算する必要がありましたが、現在は DiagramSymbol の境界がそのまま viewport になります。

### メリット

1. **viewport が常に (0, 0) 起点** - 予測可能で一貫した出力
2. **境界計算が不要** - DiagramSymbol の bounds がそのまま図全体のサイズ
3. **タイトルとメタデータの統合** - 特別な処理が不要
4. **既存の enclose 機構を活用** - 新しいレイアウトロジックが不要
5. **統一的なシンボル階層** - すべてが SymbolBase として扱われる

---

## 詳細な制約実装

### LayoutVariableContext と LayoutVar

- すべてのシンボルは `LayoutVariableContext` から `LayoutVar`（ブランド型）を取得し、`bounds.x/y/width/height` を変数として保持する。
- レイアウト計算時は `layout.addConstraint(...)` で制約を登録し、`layout.solve()` 後に `layout.valueOf(var)` で数値へ変換して `symbol.bounds` に書き戻す。
- これにより、ヒントや将来のカスタム制約が `kiwi.Variable` を直接触らずに扱える。

### ガイド API

`HintFactory.createGuideX/Y()` で仮想ガイド線を生成し、シンボルの `LayoutVar` と結びつけられる。

```typescript
const guide = hint.createGuideY()
guide.alignTop(symbolA).alignBottom(symbolB)    // ガイド上に A を揃え、B を反対側に配置

const mainLine = hint.createGuideY().followBottom(symbolA)
mainLine.alignTop(symbolC)                      // A の下端にガイドを合わせ、C を同じライン上へ
```

内部では `guide.alignTop()` などが `LayoutVariableContext.addConstraint()` を呼び、ユーザーコードはガイドとシンボル ID を指定するだけで制約を貼れる。

### Arrange（配置）の実装

#### arrangeHorizontal の実装

要素を水平方向に等間隔で並べます。

```typescript
hint.arrangeHorizontal(a, b, c)
// 結果: a --- b --- c
```

**制約:**
- 要素間の距離が等しい
- 左から右の順序で配置
- デフォルト間隔: 80px
- 制約強度: STRONG（enclose 制約より優先）

**実装詳細:**

```typescript
// layout_solver.ts
private addHorizontalConstraints(symbolIds: string[], gap: number) {
  for (let i = 0; i < symbolIds.length - 1; i++) {
    const a = this.vars.get(symbolIds[i])!
    const b = this.vars.get(symbolIds[i + 1])!
    
    // b.x = a.x + a.width + gap (STRONG strength)
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(b.x),
        kiwi.Operator.Eq,
        new kiwi.Expression(a.x, a.width, gap),
        kiwi.Strength.strong
      )
    )
    
    // Y軸を揃える (STRONG strength)
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(b.y),
        kiwi.Operator.Eq,
        new kiwi.Expression(a.y),
        kiwi.Strength.strong
      )
    )
  }
}
```

#### arrangeVertical の実装

要素を垂直方向に等間隔で並べます。

```typescript
hint.arrangeVertical(a, b, c)
// 結果:
// a
// |
// b
// |
// c
```

**制約:**
- 要素間の距離が等しい
- 上から下の順序で配置
- デフォルト間隔: 50px
- 制約強度: STRONG（enclose 制約より優先）

**実装詳細:**

```typescript
// layout_solver.ts
private addVerticalConstraints(symbolIds: string[], gap: number) {
  for (let i = 0; i < symbolIds.length - 1; i++) {
    const a = this.vars.get(symbolIds[i])!
    const b = this.vars.get(symbolIds[i + 1])!
    
    // b.y = a.y + a.height + gap (STRONG strength)
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(b.y),
        kiwi.Operator.Eq,
        new kiwi.Expression(a.y, a.height, gap),
        kiwi.Strength.strong
      )
    )
    
    // X軸を揃える (STRONG strength)
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(b.x),
        kiwi.Operator.Eq,
        new kiwi.Expression(a.x),
        kiwi.Strength.strong
      )
    )
  }
}
```

---

### Align（整列）の実装

#### alignLeft の実装

要素の左端を揃えます。

```typescript
hint.alignLeft(a, b, c)
// 結果:
// |a
// |bb
// |ccc
```

**実装詳細:**

```typescript
private addAlignLeftConstraints(symbolIds: string[]) {
  const first = this.vars.get(symbolIds[0])!
  
  for (let i = 1; i < symbolIds.length; i++) {
    const curr = this.vars.get(symbolIds[i])!
    
    // curr.x = first.x
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(curr.x),
        kiwi.Operator.Eq,
        new kiwi.Expression(first.x),
        kiwi.Strength.strong
      )
    )
  }
}
```

#### alignRight の実装

要素の右端を揃えます。

```typescript
hint.alignRight(a, b, c)
// 結果:
//   a|
//  bb|
// ccc|
```

**実装詳細:**

```typescript
private addAlignRightConstraints(symbolIds: string[]) {
  const first = this.vars.get(symbolIds[0])!
  
  for (let i = 1; i < symbolIds.length; i++) {
    const curr = this.vars.get(symbolIds[i])!
    
    // curr.x + curr.width = first.x + first.width
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(curr.x, curr.width),
        kiwi.Operator.Eq,
        new kiwi.Expression(first.x, first.width),
        kiwi.Strength.strong
      )
    )
  }
}
```

#### alignCenterX の実装

要素の X 軸中央を揃えます。

```typescript
hint.alignCenterX(a, b, c)
// 結果:
//   a
//  bb
// ccc
```

**実装詳細:**

```typescript
private addAlignCenterXConstraints(symbolIds: string[]) {
  const first = this.vars.get(symbolIds[0])!
  
  for (let i = 1; i < symbolIds.length; i++) {
    const curr = this.vars.get(symbolIds[i])!
    
    // curr.x + curr.width/2 = first.x + first.width/2
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(curr.x, [curr.width, 0.5]),
        kiwi.Operator.Eq,
        new kiwi.Expression(first.x, [first.width, 0.5]),
        kiwi.Strength.strong
      )
    )
  }
}
```

#### alignTop の実装

要素の上端を揃えます。

```typescript
hint.alignTop(a, b, c)
// 結果: ___
//      |a|bb|ccc|
```

**実装詳細:**

```typescript
private addAlignTopConstraints(symbolIds: string[]) {
  const first = this.vars.get(symbolIds[0])!
  
  for (let i = 1; i < symbolIds.length; i++) {
    const curr = this.vars.get(symbolIds[i])!
    
    // curr.y = first.y
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(curr.y),
        kiwi.Operator.Eq,
        new kiwi.Expression(first.y),
        kiwi.Strength.strong
      )
    )
  }
}
```

#### alignBottom の実装

要素の下端を揃えます。

```typescript
hint.alignBottom(a, b, c)
// 結果:
//      |a|bb|ccc|
//      ‾‾‾
```

**実装詳細:**

```typescript
private addAlignBottomConstraints(symbolIds: string[]) {
  const first = this.vars.get(symbolIds[0])!
  
  for (let i = 1; i < symbolIds.length; i++) {
    const curr = this.vars.get(symbolIds[i])!
    
    // curr.y + curr.height = first.y + first.height
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(curr.y, curr.height),
        kiwi.Operator.Eq,
        new kiwi.Expression(first.y, first.height),
        kiwi.Strength.strong
      )
    )
  }
}
```

#### alignCenterY の実装

要素の Y 軸中央を揃えます。

```typescript
hint.alignCenterY(a, b, c)
// 結果: a  bb  ccc  (Y軸中央が揃う)
```

**実装詳細:**

```typescript
private addAlignCenterYConstraints(symbolIds: string[]) {
  const first = this.vars.get(symbolIds[0])!
  
  for (let i = 1; i < symbolIds.length; i++) {
    const curr = this.vars.get(symbolIds[i])!
    
    // curr.y + curr.height/2 = first.y + first.height/2
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(curr.y, [curr.height, 0.5]),
        kiwi.Operator.Eq,
        new kiwi.Expression(first.y, [first.height, 0.5]),
        kiwi.Strength.strong
      )
    )
  }
}
```

---

### Enclose（包含）の実装

#### enclose の概要

コンテナ内に子要素を配置します。コンテナサイズは自動的に子要素に合わせて拡大します。

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

#### 実装の仕組み

**1. コンテナのサイズ制約:**

```typescript
// コンテナは最小サイズのみ指定（WEAK）
const isContainer = hints.some(h => h.type === "enclose" && h.containerId === symbol.id)

if (isContainer) {
  // 最小サイズのみ（子要素に合わせて拡大可能）
  this.solver.addConstraint(
    new kiwi.Constraint(
      new kiwi.Expression(v.width), 
      kiwi.Operator.Ge, 
      100, 
      kiwi.Strength.weak
    )
  )
  this.solver.addConstraint(
    new kiwi.Constraint(
      new kiwi.Expression(v.height), 
      kiwi.Operator.Ge, 
      100, 
      kiwi.Strength.weak
    )
  )
}
```

**2. enclose 制約（子要素の配置とコンテナの拡大）:**

```typescript
private addEncloseConstraints(containerId: string, childIds: string[]) {
  const container = this.vars.get(containerId)!
  const padding = 20

  for (const childId of childIds) {
    const child = this.vars.get(childId)!

    // 子要素の最小位置制約（コンテナ内に配置）
    // child.x >= container.x + padding
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(child.x),
        kiwi.Operator.Ge,
        new kiwi.Expression(container.x, padding),
        kiwi.Strength.required
      )
    )

    // child.y >= container.y + 50 (タイトルスペース考慮)
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(child.y),
        kiwi.Operator.Ge,
        new kiwi.Expression(container.y, 50),
        kiwi.Strength.required
      )
    )

    // コンテナを子要素に合わせて拡大（重要！）
    // container.width + container.x >= child.x + child.width + padding
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(container.width, container.x),
        kiwi.Operator.Ge,
        new kiwi.Expression(child.x, child.width, padding),
        kiwi.Strength.required
      )
    )

    // container.height + container.y >= child.y + child.height + padding
    this.solver.addConstraint(
      new kiwi.Constraint(
        new kiwi.Expression(container.height, container.y),
        kiwi.Operator.Ge,
        new kiwi.Expression(child.y, child.height, padding),
        kiwi.Strength.required
      )
    )
  }
}
```

#### キーポイント

- コンテナのサイズは固定せず、最小サイズのみ指定（WEAK 制約）
- 子要素の位置に応じてコンテナが自動的に拡大（REQUIRED 制約）
- `arrange` 制約（STRONG）と `enclose` 制約（REQUIRED）は競合しない

#### enclose + arrange の実装例

```typescript
// 実装例
const boundary = el.systemBoundary("System")
const a = el.usecase("A")
const b = el.usecase("B")
const c = el.usecase("C")

hint.enclose(boundary, [a, b, c])
hint.arrangeVertical(a, b, c)  // ✅ 重ならずに配置される

// 実装結果:
// usecase_0 (A): x=50, y=50, w=120, h=60
// usecase_1 (B): x=50, y=160, w=120, h=60  ← gap=50
// usecase_2 (C): x=50, y=270, w=120, h=60  ← gap=50
// systemBoundary: x=30, y=0, w=160, h=350  ← 自動拡大！
```

---

## LayoutHint の型定義

```typescript
export interface LayoutHint {
  type: 
    | "horizontal"           // deprecated: use arrangeHorizontal
    | "vertical"             // deprecated: use arrangeVertical
    | "arrangeHorizontal"    // ✅ 実装済み
    | "arrangeVertical"      // ✅ 実装済み
    | "alignLeft"            // ✅ 実装済み
    | "alignRight"           // ✅ 実装済み
    | "alignTop"             // ✅ 実装済み
    | "alignBottom"          // ✅ 実装済み
    | "alignCenterX"         // ✅ 実装済み
    | "alignCenterY"         // ✅ 実装済み
    | "enclose"              // ✅ 実装済み
  symbolIds: SymbolId[]
  gap?: number
  containerId?: SymbolId
  childIds?: SymbolId[]
}
```

### Guide ヒント

`HintFactory` は従来の列挙型ヒントに加えて `createGuideX/Y()` を提供し、`HorizontalGuide` / `VerticalGuide` インスタンスを返す。これらは `alignTop/Bottom/Left/Right/Center` や `followTop/Bottom...` などのメソッドを持ち、基準となる `LayoutVar` をガイドとして共有できる。従来のヒントと組み合わせることで、ガイドラインに沿った複雑な整列シナリオをシンプルに記述できる。

---

## まとめ

Kiwumil のレイアウトシステムは、宣言的で直感的な API を提供します：

### 実装済み機能（v0.2.0）

- ✅ **設計哲学**: 宣言的 API、制約の組み合わせ、直感的な命名
- ✅ **制約システム**: Arrange, Align, Enclose の 3 種類
- ✅ **Symbol**: 各形状の定義と接続点計算
- ✅ **Relationship**: 関係線の描画と接続点問い合わせ
- ✅ **DiagramSymbol**: 図全体の自動管理と viewport の (0, 0) 固定
- ✅ **詳細実装**: すべての制約の内部実装を文書化

### 主な成果

- ✅ **arrangeHorizontal / arrangeVertical** - 要素を並べる
- ✅ **alignLeft / alignRight / alignTop / alignBottom** - 位置を揃える
- ✅ **alignCenterX / alignCenterY** - 中央揃え
- ✅ **enclose + Arrange の組み合わせ** - コンテナ内の自動配置
- ✅ **自動サイズ調整コンテナ** - 子要素に合わせてコンテナが拡大
- ✅ **制約の優先度調整** - 競合なく解決
- ✅ **シンボル形状に応じた接続点計算** - 矢印がシンボルと重ならない
- ✅ **DiagramSymbol** - 図全体の統一的な管理

### 将来の拡張

#### Phase 2: Grid Layout

```typescript
hint.arrangeGrid(a, b, c, d, e, f, { 
  columns: 3,
  gap: 20 
})
// 結果:
// a b c
// d e f
```

#### Phase 3: Distribute（等間隔配置）

```typescript
hint.distributeHorizontal(a, b, c)  // 全体の幅に均等配置
hint.distributeVertical(a, b, c)    // 全体の高さに均等配置
```

#### Phase 4: Flexbox 風レイアウト

```typescript
hint.flex(container, [a, b, c], {
  direction: 'row',
  justifyContent: 'space-between',
  alignItems: 'center'
})
```

---

**🎉 First Milestone 達成！** Enclose 内要素の自動配置をサポートし、ユーザーが直感的にレイアウトを記述できるようになりました。

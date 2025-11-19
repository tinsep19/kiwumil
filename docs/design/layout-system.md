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

layout.addConstraint(diagram.x, LayoutConstraintOperator.Eq, 0)
layout.addConstraint(diagram.y, LayoutConstraintOperator.Eq, 0)
```

#### DiagramSymbol のサイズ制約

DiagramSymbol はコンテナとして扱われるため、最小サイズのみ指定されます（WEAK 制約）。

```typescript
// 最小サイズのみ指定 (LayoutVariableContext)
layout.addConstraint(
  diagram.width,
  LayoutConstraintOperator.Ge,
  200,
  LayoutConstraintStrength.Weak
)
layout.addConstraint(
  diagram.height,
  LayoutConstraintOperator.Ge,
  150,
  LayoutConstraintStrength.Weak
)
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
layout.addConstraint(
  child.x,
  LayoutConstraintOperator.Ge,
  layout.expression([{ variable: container.x }], padding),
  LayoutConstraintStrength.Required
)
layout.addConstraint(
  child.y,
  LayoutConstraintOperator.Ge,
  layout.expression([{ variable: container.y }], 50),
  LayoutConstraintStrength.Required
) // タイトル分

layout.addConstraint(
  layout.expression([{ variable: container.width }, { variable: container.x }]),
  LayoutConstraintOperator.Ge,
  layout.expression([{ variable: child.x }, { variable: child.width }], padding),
  LayoutConstraintStrength.Required
)

layout.addConstraint(
  layout.expression([{ variable: container.height }, { variable: container.y }]),
  LayoutConstraintOperator.Ge,
  layout.expression([{ variable: child.y }, { variable: child.height }], padding),
  LayoutConstraintStrength.Required
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
- これにより、ヒントや将来のカスタム制約が `LayoutVar`（kiwi.Variable のラッパー）を介して安全に扱える。
- `LayoutConstraintOperator` / `LayoutConstraintStrength` が公開されており、`kiwi.Operator` / `kiwi.Strength` を隠蔽したまま制約タイプと優先度を指定できる。

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
- Y 方向の位置は**自動では揃わない**ため、必要なら `alignTop/CenterY` などと組み合わせる

**実装詳細:**

```typescript
// layout_solver.ts
private addHorizontalConstraints(symbolIds: string[], gap: number) {
  for (let i = 0; i < symbolIds.length - 1; i++) {
    const a = this.boundsMap.get(symbolIds[i])
    const b = this.boundsMap.get(symbolIds[i + 1])
    if (!a || !b) continue

    // b.x = a.x + a.width + gap (STRONG strength)
    this.layoutContext.addConstraint(
      b.x,
      LayoutConstraintOperator.Eq,
      this.layoutContext.expression(
        [
          { variable: a.x },
          { variable: a.width }
        ],
        gap
      ),
      LayoutConstraintStrength.Strong
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
- X 方向の位置は**自動では揃わない**ため、必要なら `alignLeft/CenterX` などと併用する

**実装詳細:**

```typescript
// layout_solver.ts
private addVerticalConstraints(symbolIds: string[], gap: number) {
  for (let i = 0; i < symbolIds.length - 1; i++) {
    const a = this.boundsMap.get(symbolIds[i])
    const b = this.boundsMap.get(symbolIds[i + 1])
    if (!a || !b) continue

    // b.y = a.y + a.height + gap (STRONG strength)
    this.layoutContext.addConstraint(
      b.y,
      LayoutConstraintOperator.Eq,
      this.layoutContext.expression(
        [
          { variable: a.y },
          { variable: a.height }
        ],
        gap
      ),
      LayoutConstraintStrength.Strong
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
  if (symbolIds.length < 2) return
  const firstId = symbolIds[0]
  if (!firstId) return
  const first = this.boundsMap.get(firstId)
  if (!first) return

  for (let i = 1; i < symbolIds.length; i++) {
    const symbolId = symbolIds[i]
    if (!symbolId) continue
    const symbol = this.boundsMap.get(symbolId)
    if (!symbol) continue

    // curr.x = first.x
    this.layoutContext.addConstraint(
      symbol.x,
      LayoutConstraintOperator.Eq,
      first.x,
      LayoutConstraintStrength.Strong
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
  if (symbolIds.length < 2) return
  const firstId = symbolIds[0]
  if (!firstId) return
  const first = this.boundsMap.get(firstId)
  if (!first) return

  for (let i = 1; i < symbolIds.length; i++) {
    const symbolId = symbolIds[i]
    if (!symbolId) continue
    const symbol = this.boundsMap.get(symbolId)
    if (!symbol) continue
    
    // curr.x + curr.width = first.x + first.width
    this.layoutContext.addConstraint(
      this.layoutContext.expression([
        { variable: symbol.x },
        { variable: symbol.width }
      ]),
      LayoutConstraintOperator.Eq,
      this.layoutContext.expression([
        { variable: first.x },
        { variable: first.width }
      ]),
      LayoutConstraintStrength.Strong
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
  if (symbolIds.length < 2) return
  const firstId = symbolIds[0]
  if (!firstId) return
  const first = this.boundsMap.get(firstId)
  if (!first) return
  
  for (let i = 1; i < symbolIds.length; i++) {
    const symbolId = symbolIds[i]
    if (!symbolId) continue
    const symbol = this.boundsMap.get(symbolId)
    if (!symbol) continue
    
    // curr.x + curr.width/2 = first.x + first.width/2
    this.layoutContext.addConstraint(
      this.layoutContext.expression([
        { variable: symbol.x },
        { variable: symbol.width, coefficient: 0.5 }
      ]),
      LayoutConstraintOperator.Eq,
      this.layoutContext.expression([
        { variable: first.x },
        { variable: first.width, coefficient: 0.5 }
      ]),
      LayoutConstraintStrength.Strong
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
  if (symbolIds.length < 2) return
  const firstId = symbolIds[0]
  if (!firstId) return
  const first = this.boundsMap.get(firstId)
  if (!first) return
  
  for (let i = 1; i < symbolIds.length; i++) {
    const symbolId = symbolIds[i]
    if (!symbolId) continue
    const symbol = this.boundsMap.get(symbolId)
    if (!symbol) continue
    
    // curr.y = first.y
    this.layoutContext.addConstraint(
      symbol.y,
      LayoutConstraintOperator.Eq,
      first.y,
      LayoutConstraintStrength.Strong
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
  if (symbolIds.length < 2) return
  const firstId = symbolIds[0]
  if (!firstId) return
  const first = this.boundsMap.get(firstId)
  if (!first) return
  
  for (let i = 1; i < symbolIds.length; i++) {
    const symbolId = symbolIds[i]
    if (!symbolId) continue
    const symbol = this.boundsMap.get(symbolId)
    if (!symbol) continue
    
    // curr.y + curr.height = first.y + first.height
    this.layoutContext.addConstraint(
      this.layoutContext.expression([
        { variable: symbol.y },
        { variable: symbol.height }
      ]),
      LayoutConstraintOperator.Eq,
      this.layoutContext.expression([
        { variable: first.y },
        { variable: first.height }
      ]),
      LayoutConstraintStrength.Strong
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
  if (symbolIds.length < 2) return
  const firstId = symbolIds[0]
  if (!firstId) return
  const first = this.boundsMap.get(firstId)
  if (!first) return
  
  for (let i = 1; i < symbolIds.length; i++) {
    const symbolId = symbolIds[i]
    if (!symbolId) continue
    const symbol = this.boundsMap.get(symbolId)
    if (!symbol) continue
    
    // curr.y + curr.height/2 = first.y + first.height/2
    this.layoutContext.addConstraint(
      this.layoutContext.expression([
        { variable: symbol.y },
        { variable: symbol.height, coefficient: 0.5 }
      ]),
      LayoutConstraintOperator.Eq,
      this.layoutContext.expression([
        { variable: first.y },
        { variable: first.height, coefficient: 0.5 }
      ]),
      LayoutConstraintStrength.Strong
    )
  }
}
```

#### サイズ整列系

`alignWidth` / `alignHeight` / `alignSize` ではそれぞれ幅、高さ、幅+高さの等値制約を STRONG 強度で追加します。実装は `alignLeft/Right` と同様に先頭シンボルを基準として `width` や `height` の `LayoutVar` を直接 `Eq` で束縛するだけです。

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
const layoutBounds = symbol.ensureLayoutBounds(this.layoutContext)

if (isContainer) {
  // 最小サイズのみ（子要素に合わせて拡大可能）
  this.layoutContext.addConstraint(
    layoutBounds.width,
    LayoutConstraintOperator.Ge,
    100,
    LayoutConstraintStrength.Weak
  )
  this.layoutContext.addConstraint(
    layoutBounds.height,
    LayoutConstraintOperator.Ge,
    100,
    LayoutConstraintStrength.Weak
  )
}
```

**2. enclose 制約（子要素の配置とコンテナの拡大）:**

```typescript
private addEncloseConstraints(containerId: string, childIds: string[] = []) {
  const container = this.boundsMap.get(containerId)
  if (!container) return
  const padding = 20

  for (const childId of childIds) {
    const child = this.boundsMap.get(childId)
    if (!child) continue

    // 子要素の最小位置制約（コンテナ内に配置）
    // child.x >= container.x + padding
    this.layoutContext.addConstraint(
      child.x,
      LayoutConstraintOperator.Ge,
      this.layoutContext.expression([{ variable: container.x }], padding),
      LayoutConstraintStrength.Required
    )

    // child.y >= container.y + 50 (タイトルスペース考慮)
    this.layoutContext.addConstraint(
      child.y,
      LayoutConstraintOperator.Ge,
      this.layoutContext.expression([{ variable: container.y }], 50),
      LayoutConstraintStrength.Required
    )

    // コンテナを子要素に合わせて拡大（重要！）
    // container.width + container.x >= child.x + child.width + padding
    this.layoutContext.addConstraint(
      this.layoutContext.expression([
        { variable: container.width },
        { variable: container.x }
      ]),
      LayoutConstraintOperator.Ge,
      this.layoutContext.expression(
        [
          { variable: child.x },
          { variable: child.width }
        ],
        padding
      ),
      LayoutConstraintStrength.Required
    )

    // container.height + container.y >= child.y + child.height + padding
    this.layoutContext.addConstraint(
      this.layoutContext.expression([
        { variable: container.height },
        { variable: container.y }
      ]),
      LayoutConstraintOperator.Ge,
      this.layoutContext.expression(
        [
          { variable: child.y },
          { variable: child.height }
        ],
        padding
      ),
      LayoutConstraintStrength.Required
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
    | "arrangeHorizontal"
    | "arrangeVertical"
    | "alignLeft"
    | "alignRight"
    | "alignTop"
    | "alignBottom"
    | "alignCenterX"
    | "alignCenterY"
    | "alignWidth"
    | "alignHeight"
    | "alignSize"            // width+height
    | "enclose"
  symbolIds: SymbolId[]
  gap?: number
  containerId?: SymbolId
  childIds?: SymbolId[]
}
```

### Guide ヒント

`HintFactory` は `createGuideX()` / `createGuideY()` で `GuideBuilderX` / `GuideBuilderY` を返す。ガイドごとに `alignLeft/Right/Center`（X軸）または `alignTop/Bottom/Center`（Y軸）が用意され、`follow*` で既存シンボルの位置をガイドへコピーできる。`arrange()` を呼ぶとガイドに紐づいたシンボル全体に `arrangeVertical` / `arrangeHorizontal` ヒントが追加され、整列と並べ替えをまとめて表現できる。さらに `guide.x` / `guide.y` から `LayoutVar` を取り出し、低レベルな制約と組み合わせることも可能。

```typescript
const gy = hint
  .createGuideY()
  .alignBottom(user, admin)
  .alignTop(screen, server)
  .arrange() // arrangeHorizontal: [user, admin, screen, server]

// レイアウト変数を別制約に使うこともできる
layoutContext.addConstraint(gy.y, LayoutConstraintOperator.Eq, 200)

const gx = hint
  .createGuideX()
  .alignLeft(database)
  .alignRight(cache)
  .arrange() // arrangeVertical: [database, cache]
```

> Note: `follow*` メソッドはガイド自身に強い `Eq` 制約を貼るため、1つのガイドにつき1回だけ呼び出せます。複数のシンボルを基準にしたい場合はガイドを分けてください。

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

---

## Grid/Figure Builder（v0.x実装済み）

### 概要

Grid/Figure Builderは、コンテナ内の要素配置を直感的に記述できるfluent-style APIです。ユーザーのイメージに基づいた設計となっています。

### API設計

#### Grid Builder - 矩形行列配置

N×M の矩形配置をサポート。すべての行が同じ列数である必要があります。

```typescript
hint.grid(container)
  .enclose([[a, b], [c, d]] as const)
  .gap(10)                              // 行・列共通
  .gap({ row: 20, col: 10 })           // 個別指定
  .layout()

// 結果:
// ┌─────────────┐
// │  a     b    │
// │  c     d    │
// └─────────────┘
```

**特徴:**
- 矩形検証: `isRectMatrix()` で検証、非矩形の場合はエラー
- gap設定: row/col 別々に指定可能
- alignment: なし（矩形グリッドのため）

#### Figure Builder - 非矩形配置

行ごとに異なる要素数を許容する柔軟な配置。

```typescript
hint.figure(container)
  .enclose([[a, b], [c]] as const)
  .gap(15)                              // 行間のみ
  .align('center')                      // left/center/right
  .layout()

// 結果 (center):
// ┌─────────────┐
// │   a    b    │
// │      c      │
// └─────────────┘
```

**特徴:**
- 非矩形許容: 各行の要素数が異なってもOK
- gap設定: 行間のみ（列間は自動）
- alignment: left（デフォルト）, center, right

### 設計方針

#### DX（Developer Experience）重視

```typescript
// ❌ 型を自動選択（暗黙的）
hint.enclose(container, [[a,b],[c,d]]).auto()

// ✅ 型を明示的に指定（直感的）
hint.grid(container).enclose([[a,b],[c,d]]).layout()
hint.figure(container).enclose([[a,b],[c]]).layout()
```

**メリット:**
- レイアウトタイプが一目瞭然
- 予測可能な動作
- IntelliSenseによる完全な補完

#### Guide APIとの一貫性

Grid/Figure Builderは既存のGuide APIと同じパターンを採用：

```typescript
// Guide API
hint.createGuideY()
  .alignBottom(user, admin)
  .alignTop(screen, server)
  .arrange()

// Grid/Figure Builder
hint.grid(container)
  .enclose([[a, b], [c, d]])
  .gap(10)
  .layout()
```

**共通パターン:** 型指定 → 対象指定 → オプション → 適用

### 実装詳細

#### 矩形検証

```typescript
// src/dsl/matrix_utils.ts
export function isRectMatrix<T>(matrix: readonly (readonly T[])[]): boolean {
  if (matrix.length === 0) return false
  const width = matrix[0]?.length
  if (width === undefined || width === 0) return false
  return matrix.every(row => row.length === width)
}
```

#### 制約生成

Grid/Figure Builderは `LayoutConstraints.encloseGrid()` / `.encloseFigure()` を呼び出します：

```typescript
// src/layout/layout_constraints.ts

encloseGrid(
  containerId: ContainerSymbolId,
  matrix: SymbolId[][],
  options?: { rowGap?: number; colGap?: number; padding?: ... }
): void {
  // 1. enclose 制約（Required）
  this.enclose(containerId, matrix.flat())
  
  // 2. 各行を水平配置
  for (const row of matrix) {
    this.createArrangeHorizontalConstraints(row, colGap)
  }
  
  // 3. 各列を垂直配置
  for (let col = 0; col < numCols; col++) {
    const column = matrix.map(row => row[col])
    this.createArrangeVerticalConstraints(column, rowGap)
  }
}
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

### 将来の拡張

- [ ] padding サポート
- [ ] 複雑なalignmentオプション（stretch, baseline等）
- [ ] ネストされたグリッド
- [ ] レスポンシブ対応（min/max constraints）

---

## LayoutContext（v0.x実装済み）

### 概要

`LayoutContext` は、レイアウトシステムの中核となるファサードです。`LayoutVariables` と `LayoutConstraints` を束ね、シンボルやヒントからの制約操作を一元管理します。

### アーキテクチャ

```
┌─────────────────────────────────────┐
│        LayoutContext                │
│  (ファサード・コーディネーター)       │
├─────────────────────────────────────┤
│  - solver: kiwi.Solver              │
│  - variables: LayoutVariables       │
│  - constraints: LayoutConstraints   │
└─────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────┐    ┌──────────────────┐
│ Layout       │    │ Layout           │
│ Variables    │    │ Constraints      │
├──────────────┤    ├──────────────────┤
│ - 変数生成   │    │ - 制約生成       │
│ - Expression │    │ - 制約管理       │
│              │    │ - ID採番         │
└──────────────┘    └──────────────────┘
```

### 役割分担

#### LayoutVariables（変数管理）

kiwi の Variable/Constraint 生成を担う薄い層。

```typescript
export class LayoutVariables {
  createVariable(name: string): LayoutVar
  expression(terms: LayoutTerm[], constant?: number): kiwi.Expression
  addConstraint(
    lhs: LayoutExpressionInput,
    op: LayoutConstraintOperator,
    rhs: LayoutExpressionInput,
    strength: LayoutConstraintStrength
  ): kiwi.Constraint
}
```

#### LayoutConstraints（制約管理）

kiwumil レベルの制約を管理。各制約に ID とメタ情報を付与。

```typescript
export interface LayoutConstraint {
  id: LayoutConstraintId          // "constraints/${id}" 形式
  type: LayoutConstraintType      // "arrangeHorizontal", "encloseGrid" 等
  rawConstraints: kiwi.Constraint[]
}

export class LayoutConstraints {
  arrangeHorizontal(symbolIds: LayoutSymbolId[], gap?: number): void
  arrangeVertical(symbolIds: LayoutSymbolId[], gap?: number): void
  alignLeft(symbolIds: LayoutSymbolId[]): void
  // ... 他のヒントメソッド
  encloseGrid(containerId: ContainerSymbolId, matrix: SymbolId[][], options?): void
  encloseFigure(containerId: ContainerSymbolId, rows: SymbolId[][], options?): void
}
```

#### LayoutContext（ファサード）

Variables と Constraints を束ね、統一されたインターフェースを提供。

```typescript
export class LayoutContext {
  readonly solver: kiwi.Solver
  readonly variables: LayoutVariables
  readonly constraints: LayoutConstraints
  
  constructor(theme: Theme, resolveSymbol: (id: LayoutSymbolId) => SymbolBase | undefined)
  
  solve(): void
  getVariable(name: string): LayoutVar | undefined
  getBounds(symbolId: LayoutSymbolId): Bounds
}
```

### オンライン制約適用

従来はヒント情報を `LayoutHint[]` に蓄積し、solve時にバッチ処理していましたが、現在は**ヒント呼び出し時に即座に制約を追加**します。

#### 旧設計（バッチ処理）

```typescript
// ❌ 旧: ヒントを蓄積
hint.arrangeHorizontal(a, b, c)  // → hints.push({ type: "horizontal", ids: [a,b,c] })

// solve時に制約生成
solver.solve(symbols, hints)     // → hints をループして制約追加
```

#### 新設計（オンライン適用）

```typescript
// ✅ 新: 即座に制約追加
hint.arrangeHorizontal(a, b, c)  // → layoutContext.constraints.arrangeHorizontal([a,b,c])
                                  // → solver.addConstraint(...) が即座に実行
```

**メリット:**
- シンプルな実装（中間データ構造が不要）
- 制約の追跡が容易（`LayoutConstraint` ID で管理）
- Guide APIとの統一感

### Symbol生成時の制約適用

Symbol生成時に `LayoutContext` を注入し、初期制約を登録します。

```typescript
// src/plugin/core/plugin.ts
export const CorePlugin: DiagramPlugin = {
  createSymbolFactory: (layout: LayoutContext) => ({
    rectangle: (label: string, options?: { width?: number; height?: number }) => {
      const symbol = new Rectangle(
        generateSymbolId(label),
        label,
        layout,  // ← LayoutContext を渡す
        options
      )
      return symbol.id
    }
  })
}

// src/plugin/core/symbols/rectangle.ts
export class Rectangle extends SymbolBase {
  constructor(
    id: SymbolId,
    label: string,
    layout: LayoutContext,
    options?: { width?: number; height?: number }
  ) {
    super(id, label, "rectangle")
    const bounds = this.ensureLayoutBounds(layout.variables)
    
    // 初期制約を登録（Required, サイズ固定）
    layout.constraints.withSymbol(this.id, "symbolBounds", builder => {
      builder.eq(bounds.width, options?.width ?? 80)
      builder.eq(bounds.height, options?.height ?? 60)
    })
  }
}
```

### ヒントからの制約適用

`HintFactory` は `LayoutContext.constraints` を直接呼び出します。

```typescript
// src/dsl/hint_factory.ts
export class HintFactory {
  constructor(
    private readonly layout: LayoutContext,
    private readonly symbols: SymbolBase[]
  ) {}
  
  arrangeHorizontal(...symbolIds: LayoutTargetId[]) {
    this.layout.constraints.arrangeHorizontal(symbolIds)
  }
  
  grid(container: ContainerSymbolId): GridBuilder {
    return new GridBuilder(this, container)
  }
}
```

### 制約の追跡

各制約には一意なIDが付与され、デバッグや削除が可能です。

```typescript
// 制約ID形式
"constraints/${serial}"                    // 通常の制約
"constraints/${symbolId}/${serial}"        // Symbol固有の制約

// 制約の削除（将来実装予定）
layoutContext.constraints.remove("constraints/user/0")
```

---

## まとめ

### 完了した機能

- ✅ **Grid/Figure Builder**: 直感的な2Dレイアウト API
- ✅ **LayoutContext**: Variables/Constraints のファサード化
- ✅ **オンライン制約適用**: ヒント呼び出し時に即座に制約追加
- ✅ **ContainerSymbolBase**: コンテナの共通基底クラス
- ✅ **Guide API**: 水平・垂直ガイドラインによる配置
- ✅ **派生変数**: right/bottom/centerX/centerY の自動計算

### 今後の拡張

- [ ] Grid/Figure Builder の padding サポート
- [ ] Theme と LayoutOptions の分離
- [ ] Distribute（等間隔配置）
- [ ] Flexbox風レイアウト
- [ ] 制約の動的削除・更新

---

## Guide API - ガイドラインによる配置

### 概要

Guide API は、水平・垂直の「ガイドライン」を定義し、複数のシンボルを共通の位置に配置する機能です。
Adobe Illustrator や Figma のガイドラインに相当します。

**設計思想:**
- ガイドラインは `LayoutVar`（制約変数）として表現
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

## 派生レイアウト変数

### 概要

`LayoutBounds` は、基本的な4つの変数（`x`, `y`, `width`, `height`）に加えて、**派生変数**を提供します。
派生変数は、初回アクセス時に自動生成され、以降はキャッシュされます。

### 派生変数の種類

| 変数名 | 計算式 | 説明 |
|--------|--------|------|
| `right` | `x + width` | 右端のX座標 |
| `bottom` | `y + height` | 下端のY座標 |
| `centerX` | `x + width * 0.5` | X軸中央座標 |
| `centerY` | `y + height * 0.5` | Y軸中央座標 |

### 実装

```typescript
export class LayoutBounds {
  readonly x: LayoutVar
  readonly y: LayoutVar
  readonly width: LayoutVar
  readonly height: LayoutVar

  private _right?: LayoutVar
  private _bottom?: LayoutVar
  private _centerX?: LayoutVar
  private _centerY?: LayoutVar

  constructor(
    private readonly ctx: LayoutVariables,
    x: LayoutVar,
    y: LayoutVar,
    width: LayoutVar,
    height: LayoutVar
  ) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  get right(): LayoutVar {
    if (!this._right) {
      this._right = this.ctx.createVar(`${this.x.name}.right`)
      this.ctx.addConstraint(
        this._right,
        LayoutConstraintOperator.Eq,
        this.ctx.expression([
          { variable: this.x },
          { variable: this.width }
        ])
      )
    }
    return this._right
  }

  // bottom, centerX, centerY も同様
}
```

**設計ポイント:**

1. **遅延生成（Lazy Evaluation）**
   - getter で初回アクセス時のみ変数と制約を生成
   - 使われない派生変数は生成されない

2. **キャッシュ**
   - 2回目以降のアクセスは生成済みの変数を返す
   - 同じ式を複数回計算しない

3. **自動制約登録**
   - 派生変数は制約として自動登録される
   - ユーザーは制約を意識する必要がない

### 使用例

#### Guide API での利用

```typescript
// Before: 毎回 expression を作成
this.layout.vars.addConstraint(
  this.layout.vars.expression([
    { variable: bounds.x },
    { variable: bounds.width }
  ]),
  LayoutConstraintOperator.Eq,
  this.x
)

// After: 派生変数を直接使用
this.layout.vars.addConstraint(
  bounds.right,
  LayoutConstraintOperator.Eq,
  this.x
)
```

#### カスタム制約での利用

```typescript
// 将来的なユーザーAPI
const boundsA = symbolA.getLayoutBounds()
const boundsB = symbolB.getLayoutBounds()

// A の右端と B の左端の間に 10px のギャップ
layout.constraints.withSymbol(symbolB.id, "gap", builder => {
  builder.eq(boundsB.x, boundsA.right, 10)
})
```

### パフォーマンス効果

**Before（式を毎回計算）:**

```typescript
// GuideBuilderX.alignRight() を2回呼び出すと...
guide.alignRight(a)  // expression([a.x, a.width]) 生成
guide.alignRight(b)  // expression([b.x, b.width]) 生成
```

**After（派生変数を再利用）:**

```typescript
// 初回のみ変数・制約生成、2回目以降は再利用
guide.alignRight(a)  // a.right 生成 (x + width)
guide.alignRight(b)  // b.right 生成 (x + width)
guide.followRight(a) // a.right 再利用（生成済み）
```

### メリット

1. **コード簡潔化**
   - `bounds.right` で直接参照
   - expression 計算の記述が不要

2. **パフォーマンス向上**
   - 同じ式を複数回計算しない
   - 制約も1回だけ登録

3. **可読性向上**
   - `bounds.right` は `bounds.x + bounds.width` より直感的
   - Guide API などの実装が読みやすくなる

4. **拡張性**
   - 将来的に他の派生変数（`area`, `diagonal` など）を追加可能

---

## まとめ（更新）

### 完了した機能

- ✅ **Grid/Figure Builder**: 直感的な2Dレイアウト API
- ✅ **LayoutContext**: Variables/Constraints のファサード化
- ✅ **オンライン制約適用**: ヒント呼び出し時に即座に制約追加
- ✅ **ContainerSymbolBase**: コンテナの共通基底クラス
- ✅ **Guide API**: 水平・垂直ガイドラインによる配置
- ✅ **派生変数**: right/bottom/centerX/centerY の自動計算

### 今後の拡張

- [ ] Grid/Figure Builder の padding サポート
- [ ] Theme と LayoutOptions の分離
- [ ] Distribute（等間隔配置）
- [ ] Flexbox風レイアウト
- [ ] 制約の動的削除・更新
- [ ] Guide API のドキュメント example 追加

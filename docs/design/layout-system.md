# Kiwumil レイアウトシステム設計書

## 概要

Kiwumil のレイアウトシステムは、Cassowary アルゴリズムを使用した制約ベースの自動レイアウトエンジンです。
このドキュメントでは、レイアウトシステムの内部実装とアーキテクチャについて説明します。

ユーザー向けのレイアウトヒント API については [Layout Hints API](./layout-hints.md) を参照してください。

---

## アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────┐
│        LayoutContext                │
│  (ファサード・コーディネーター)       │
├─────────────────────────────────────┤
│  - solver: LayoutSolver             │
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

#### LayoutContext（ファサード）

Variables と Constraints を束ね、統一されたインターフェースを提供。

```typescript
export class LayoutContext {
  readonly solver: LayoutSolver
  readonly variables: LayoutVariables
  readonly constraints: LayoutConstraints
  readonly theme: Theme
  
  constructor(
    theme: Theme,
    resolveSymbol: (id: SymbolId) => SymbolBase | undefined
  )
  
  solve(): void
  solveAndApply(symbols: SymbolBase[]): void
  valueOf(variable: LayoutVariable): number
  getSolver(): LayoutSolver
}
```

#### LayoutVariables（変数管理）

kiwi の Variable/Constraint 生成を担う薄い層。

```typescript
export class LayoutVariables {
  createVar(name: string): LayoutVariable
  createBound(id: SymbolId): Bounds
  expression(terms: LayoutTerm[], constant?: number): kiwi.Expression
  addConstraint(
    lhs: LayoutExpressionInput,
    op: LayoutConstraintOperator,
    rhs: LayoutExpressionInput,
    strength: LayoutConstraintStrength
  ): kiwi.Constraint
  valueOf(variable: LayoutVariable): number
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
  encloseGrid(containerId: SymbolId, matrix: SymbolId[][], options?): void
  encloseFigure(containerId: SymbolId, rows: SymbolId[][], options?): void
}
```

---

## Bounds とレイアウト変数

### Bounds の定義

Bounds はインターフェースとして定義され、すべてのプロパティが事前に作成されます。

```typescript
export interface Bounds {
  readonly type: BoundsType  // "layout" | "container" | "item"
  readonly x: LayoutVariable
  readonly y: LayoutVariable
  readonly width: LayoutVariable
  readonly height: LayoutVariable
  readonly right: LayoutVariable    // 派生変数: x + width
  readonly bottom: LayoutVariable   // 派生変数: y + height
  readonly centerX: LayoutVariable  // 派生変数: x + width * 0.5
  readonly centerY: LayoutVariable  // 派生変数: y + height * 0.5
}
```

### 派生変数の実装

派生変数は `createBound()` 呼び出し時に事前生成され、制約も同時に設定されます。

```typescript
// LayoutVariables.createBound() で生成時に派生変数を作成し制約を設定
createBound(id: SymbolId): Bounds {
  const x = this.createVar(\`\${id}.x\`)
  const y = this.createVar(\`\${id}.y\`)
  const width = this.createVar(\`\${id}.width\`)
  const height = this.createVar(\`\${id}.height\`)

  // 派生変数を作成し、制約を設定
  const right = this.createVar(\`\${id}.right\`)
  this.addConstraint(right, LayoutConstraintOperator.Eq, 
    this.expression([{ variable: x }, { variable: width }]))

  const bottom = this.createVar(\`\${id}.bottom\`)
  this.addConstraint(bottom, LayoutConstraintOperator.Eq,
    this.expression([{ variable: y }, { variable: height }]))

  const centerX = this.createVar(\`\${id}.centerX\`)
  this.addConstraint(centerX, LayoutConstraintOperator.Eq,
    this.expression([{ variable: x }, { variable: width, coefficient: 0.5 }]))

  const centerY = this.createVar(\`\${id}.centerY\`)
  this.addConstraint(centerY, LayoutConstraintOperator.Eq,
    this.expression([{ variable: y }, { variable: height, coefficient: 0.5 }]))

  return { x, y, width, height, right, bottom, centerX, centerY }
}
```

**設計ポイント:**
- **事前生成**: すべての派生変数は createBound() 呼び出し時に生成される
- **一貫性**: 派生変数は常に存在し、nullable でない
- **自動制約登録**: 派生変数の定義式は制約として自動登録される

### パフォーマンス

事前作成アプローチ:
- アクセスが高速（getter のオーバーヘッドなし）
- すべてのプロパティが常に存在（nullable チェック不要）
- 制約の一貫性が保証される

---

## Symbol と Relationship の役割

### Symbol の責務

Symbol は図の要素（ノード）を表現する基底クラスです。

```typescript
export abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  protected readonly layoutBounds: Bounds
  bounds?: { x: number; y: number; width: number; height: number }

  constructor(id: SymbolId, label: string, layoutBounds: Bounds)
  
  getLayoutBounds(): Bounds
  abstract toSVG(): string
  abstract getConnectionPoint(from: Point): Point
}
```

**主な責務:**
1. **形状の定義と描画**: SVG での描画
2. **接続点の計算**: 関係線の接続点を計算
3. **Bounds の保持**: レイアウト変数への参照

### Relationship の責務

Relationship は Symbol 間の関係（エッジ）を表現します。

```typescript
export abstract class RelationshipBase {
  readonly id: RelationshipId
  readonly from: SymbolId
  readonly to: SymbolId

  constructor(id: RelationshipId, from: SymbolId, to: SymbolId)
  
  abstract toSVG(symbols: Map<SymbolId, SymbolBase>): string
  abstract calculateZIndex(symbols: Map<SymbolId, SymbolBase>): number
}
```

**接続点の計算例:**

```typescript
class Association extends RelationshipBase {
  toSVG(symbols: Map<SymbolId, SymbolBase>): string {
    const fromSymbol = symbols.get(this.from)!
    const toSymbol = symbols.get(this.to)!
    
    // 各シンボルの中心を計算
    const fromBounds = fromSymbol.getLayoutBounds()
    const toBounds = toSymbol.getLayoutBounds()
    
    const fromCenter = {
      x: fromBounds.centerX.value(),
      y: fromBounds.centerY.value()
    }
    const toCenter = {
      x: toBounds.centerX.value(),
      y: toBounds.centerY.value()
    }
    
    // 各シンボルに接続点を問い合わせ
    const fromPoint = fromSymbol.getConnectionPoint(toCenter)
    const toPoint = toSymbol.getConnectionPoint(fromCenter)
    
    return \`<line x1="\${fromPoint.x}" y1="\${fromPoint.y}" 
                  x2="\${toPoint.x}" y2="\${toPoint.y}" ... />\`
  }
}
```

---

## 特別な Symbol: DiagramSymbol

### 概要

DiagramSymbol は、図全体を表す特殊なシンボルです。すべてのユーザー定義シンボルを自動的に包含し、タイトルやメタデータを表示します。

### 設計思想

DiagramSymbol の導入により：

1. **DiagramSymbol** が常に配列の最初の要素として追加される
2. DiagramSymbol が (0, 0) に固定される
3. すべてのユーザーシンボルが DiagramSymbol 内に enclose される
4. **viewport が常に (0, 0) から始まる**

これにより、図全体の境界計算が不要になり、より予測可能なレイアウトを実現します。

### レイアウト制約

#### DiagramSymbol の位置固定

```typescript
// DiagramSymbol の LayoutBound を (0, 0) に固定
const diagram = diagramSymbol.getLayoutBounds()

layout.constraints.addConstraint(diagram.x, LayoutConstraintOperator.Eq, 0)
layout.constraints.addConstraint(diagram.y, LayoutConstraintOperator.Eq, 0)
```

#### DiagramSymbol のサイズ制約

DiagramSymbol はコンテナとして扱われるため、最小サイズのみ指定されます（WEAK 制約）。

```typescript
// 最小サイズのみ指定
layout.constraints.addConstraint(
  diagram.width,
  LayoutConstraintOperator.Ge,
  200,
  LayoutConstraintStrength.Weak
)
layout.constraints.addConstraint(
  diagram.height,
  LayoutConstraintOperator.Ge,
  150,
  LayoutConstraintStrength.Weak
)
```

#### ユーザーシンボルの配置制約

自動的に追加される enclose 制約により、すべてのユーザーシンボルが DiagramSymbol 内に配置され、DiagramSymbol が自動的に拡大します。

---

## 制約の実装詳細

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

### Arrange（配置）の実装

#### arrangeHorizontal の実装

要素を水平方向に等間隔で並べます。

```typescript
// 概念的な例（実際は LayoutConstraints が制約を管理）
private addHorizontalConstraints(symbolIds: string[], gap: number) {
  for (let i = 0; i < symbolIds.length - 1; i++) {
    const a = this.boundsMap.get(symbolIds[i])
    const b = this.boundsMap.get(symbolIds[i + 1])
    if (!a || !b) continue

    // b.x = a.x + a.width + gap (STRONG strength)
    this.layoutContext.constraints.addConstraint(
      b.x,
      LayoutConstraintOperator.Eq,
      this.layoutContext.constraints.expression(
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

**制約:**
- 要素間の距離が等しい
- 左から右の順序で配置
- デフォルト間隔: 80px
- 制約強度: STRONG

#### arrangeVertical の実装

要素を垂直方向に等間隔で並べます。

```typescript
// 概念的な例（実際は LayoutConstraints が制約を管理）
private addVerticalConstraints(symbolIds: string[], gap: number) {
  for (let i = 0; i < symbolIds.length - 1; i++) {
    const a = this.boundsMap.get(symbolIds[i])
    const b = this.boundsMap.get(symbolIds[i + 1])
    if (!a || !b) continue

    // b.y = a.y + a.height + gap (STRONG strength)
    this.layoutContext.constraints.addConstraint(
      b.y,
      LayoutConstraintOperator.Eq,
      this.layoutContext.constraints.expression(
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

**制約:**
- 要素間の距離が等しい
- 上から下の順序で配置
- デフォルト間隔: 50px
- 制約強度: STRONG

### Align（整列）の実装

Align 系のメソッドは、派生変数を利用して効率的に制約を追加します。

```typescript
// alignRight の例（派生変数 right を利用）
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
    
    // curr.right = first.right (派生変数を利用)
    this.layoutContext.constraints.addConstraint(
      symbol.right,
      LayoutConstraintOperator.Eq,
      first.right,
      LayoutConstraintStrength.Strong
    )
  }
}
```

同様に、\`alignCenterX\`, \`alignCenterY\`, \`alignBottom\` でも派生変数を利用します。

### Enclose（包含）の実装

#### コンテナのサイズ制約

```typescript
// コンテナは最小サイズのみ指定（WEAK）
if (isContainer) {
  this.layoutContext.constraints.addConstraint(
    layoutBounds.width,
    LayoutConstraintOperator.Ge,
    100,
    LayoutConstraintStrength.Weak
  )
  this.layoutContext.constraints.addConstraint(
    layoutBounds.height,
    LayoutConstraintOperator.Ge,
    100,
    LayoutConstraintStrength.Weak
  )
}
```

#### enclose 制約（子要素の配置とコンテナの拡大）

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
    this.layoutContext.constraints.addConstraint(
      child.x,
      LayoutConstraintOperator.Ge,
      this.layoutContext.constraints.expression([{ variable: container.x }], padding),
      LayoutConstraintStrength.Required
    )

    // child.y >= container.y + 50 (タイトルスペース考慮)
    this.layoutContext.constraints.addConstraint(
      child.y,
      LayoutConstraintOperator.Ge,
      this.layoutContext.constraints.expression([{ variable: container.y }], 50),
      LayoutConstraintStrength.Required
    )

    // コンテナを子要素に合わせて拡大（重要！）
    // container.width + container.x >= child.x + child.width + padding
    this.layoutContext.constraints.addConstraint(
      this.layoutContext.constraints.expression([
        { variable: container.width },
        { variable: container.x }
      ]),
      LayoutConstraintOperator.Ge,
      this.layoutContext.constraints.expression(
        [
          { variable: child.x },
          { variable: child.width }
        ],
        padding
      ),
      LayoutConstraintStrength.Required
    )

    // container.height + container.y >= child.y + child.height + padding
    this.layoutContext.constraints.addConstraint(
      this.layoutContext.constraints.expression([
        { variable: container.height },
        { variable: container.y }
      ]),
      LayoutConstraintOperator.Ge,
      this.layoutContext.constraints.expression(
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

**キーポイント:**
- コンテナのサイズは固定せず、最小サイズのみ指定（WEAK 制約）
- 子要素の位置に応じてコンテナが自動的に拡大（REQUIRED 制約）
- \`arrange\` 制約（STRONG）と \`enclose\` 制約（REQUIRED）は競合しない

---

## オンライン制約適用

従来はヒント情報を \`LayoutHint[]\` に蓄積し、solve時にバッチ処理していましたが、現在は**ヒント呼び出し時に即座に制約を追加**します。

### 旧設計（バッチ処理）

```typescript
// ❌ 旧: ヒントを蓄積
hint.arrangeHorizontal(a, b, c)  // → hints.push({ type: "horizontal", ids: [a,b,c] })

// solve時に制約生成
solver.solve(symbols, hints)     // → hints をループして制約追加
```

### 新設計（オンライン適用）

```typescript
// ✅ 新: 即座に制約追加
hint.arrangeHorizontal(a, b, c)  // → layoutContext.constraints.arrangeHorizontal([a,b,c])
                                  // → solver.addConstraint(...) が即座に実行
```

**メリット:**
- シンプルな実装（中間データ構造が不要）
- 制約の追跡が容易（\`LayoutConstraint\` ID で管理）
- Guide APIとの統一感

---

## Symbol生成時の制約適用

Symbol生成時に \`LayoutContext\` を注入し、初期制約を登録します。

```typescript
// プラグインでのシンボル生成
circle(label: string): SymbolId {
  const symbol = symbols.register(plugin, 'circle', (symbolId) => {
    const bound = layout.variables.createBound(symbolId)
    const circle = new CircleSymbol(symbolId, label, bound)
    
    // 必要に応じて制約を追加（例: 固定サイズ）
    layout.constraints.addConstraint(
      bound.width,
      LayoutConstraintOperator.Eq,
      80,
      LayoutConstraintStrength.Required
    )
    layout.constraints.addConstraint(
      bound.height,
      LayoutConstraintOperator.Eq,
      80,
      LayoutConstraintStrength.Required
    )
    
    return circle
  })
  return symbol.id
}
```

---

---

## Naming Conventions

* Use `context` to name LayoutContext instances.
* Use `constraints` for LayoutConstraints.
* Use `variables` for LayoutVariables.

## LayoutBound Injection

### 概要

SymbolBase は `{ id, layoutBounds, theme }` をまとめたオプションオブジェクトを受け取り、immutable に保持します。コンテナシンボルは自前で `container: ContainerBounds` を生成し、`LayoutConstraints.withSymbol(symbolId, …)` 内の builder で `containerInbounds` 制約を登録します。これにより `setTheme` や `ContainerSymbolBase` のような手続きが不要になり、インスタンス生成時にすべての依存を明示できます。

### SymbolBase の構造

```typescript
interface SymbolBaseOptions {
  id: SymbolId
  layoutBounds: LayoutBound
  theme: Theme
}

abstract class SymbolBase {
  constructor(options: SymbolBaseOptions) { ... }

  getLayoutBounds(): LayoutBound
  abstract toSVG(): string
  abstract getConnectionPoint(from: Point): Point
}
```

### Containerシンボル

```typescript
interface ContainerSymbol extends SymbolBase {
  readonly container: ContainerBounds
}

class DiagramSymbol extends SymbolBase implements ContainerSymbol {
  readonly container = layout.variables.createBound(`${this.id}.container`, "container")

  constructor(options: DiagramSymbolOptions, layout: LayoutContext) {
    super(options)
    this.registerContainerConstraints()
  }
}
```

### メリット

1. **依存性の逆転**: Symbol/Relationship は `layoutContext` を直接参照せず options に依存
2. **責任の分離**: レイアウト変数と制約登録のロジックが明確に分離
3. **拡張性**: padding/header などの container 固有制約を symbol 内で完結
4. **型安全性**: construction-time にテーマを含めることで描画スタイルも型チェック


## 制約の追跡

各制約には一意なIDが付与され、デバッグや削除が可能です。

```typescript
// 制約ID形式
"constraints/\${serial}"                    // 通常の制約
"constraints/\${symbolId}/\${serial}"        // Symbol固有の制約

// 制約の削除（将来実装予定）
layoutContext.constraints.remove("constraints/user/0")
```

---

## まとめ

### 完了した機能

- ✅ **LayoutContext**: Variables/Constraints のファサード化
- ✅ **オンライン制約適用**: ヒント呼び出し時に即座に制約追加
- ✅ **LayoutBound**: インターフェース化、派生変数の事前作成
- ✅ **Container Symbol Interface**: Container symbols expose `container: ContainerBounds` and register `containerInbounds` constraints without a shared base
- ✅ **DiagramSymbol**: 図全体の統一的な管理
- ✅ **制約の追跡**: 制約IDによる管理

### 今後の拡張

- [ ] Theme と LayoutOptions の分離
- [ ] 制約の動的削除・更新
- [ ] カスタム制約 API の公開
- [ ] パフォーマンス最適化

---

## 関連ドキュメント

- **[Layout Hints API](./layout-hints.md)** - ユーザー向けレイアウトヒントAPI
- **[Namespace-based DSL](./namespace-dsl.md)** - DSL設計とAPI使い方
- **[Plugin System](./plugin-system.md)** - プラグイン作成ガイド
- **[Theme System](./theme-system.md)** - テーマシステムの設計

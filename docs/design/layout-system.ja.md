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
    resolveSymbol: (id: SymbolId | ContainerSymbolId) => SymbolBase | undefined
  )
  
  solve(): void
  solveAndApply(symbols: SymbolBase[]): void
  valueOf(variable: LayoutVar): number
  getSolver(): LayoutSolver
  expressionFromBounds(bounds: Bounds, terms: BoundsTerm[], constant?: number): kiwi.Expression
  applyMinSize(
    symbol: SymbolBase,
    size: { width: number; height: number },
    strength?: LayoutConstraintStrength
  ): void
  anchorToOrigin(symbol: SymbolBase, strength?: LayoutConstraintStrength): void
}

`LayoutContext` は `expressionFromBounds` による Bounds からの式生成や、`applyMinSize` / `anchorToOrigin` のような頻出制約をラップするヘルパーも公開しており、プラグインや DiagramSymbol が共通の制約パターンを簡単に組み立てられるようになっています。
```

#### LayoutVariables（変数管理）

kiwi の Variable/Constraint 生成を担う薄い層。

```typescript
export class LayoutVariables {
  constructor(solver?: LayoutSolver)
  createVar(name: string): LayoutVar
  createBound(prefix: string, type?: BoundsType): Bounds
  createBoundsSet<T extends Record<string, BoundsType>>(
    set: T
  ): { [K in keyof T]: BoundsMap[T[K]] }
  valueOf(variable: LayoutVar): number
  getSolver(): LayoutSolver | undefined
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

---

## Bounds とレイアウト変数

### Bounds の定義

Bounds はインターフェースとして定義され、すべてのプロパティが事前に作成されます。

```typescript
export interface Bounds {
  readonly type: BoundsType  // "layout" | "container" | "item"
  readonly x: LayoutVar
  readonly y: LayoutVar
  readonly width: LayoutVar
  readonly height: LayoutVar
  readonly right: LayoutVar    // 派生変数: x + width
  readonly bottom: LayoutVar   // 派生変数: y + height
  readonly centerX: LayoutVar  // 派生変数: x + width * 0.5
  readonly centerY: LayoutVar  // 派生変数: y + height * 0.5
}
```

### 派生変数の実装

`LayoutVariables.createBound()` は solver を使って派生変数を生成し、派生変数の定義式をまとめて登録します。

```typescript
createBound<Type extends BoundsType = "layout">(
  prefix: string,
  type: Type = "layout" as Type
): BoundsMap[Type] {
  const solver = this.getSolver()
  if (!solver) {
    throw new Error("LayoutVariables: solver is not injected. Cannot create bound with constraints.")
  }

  const x = this.createVar(`${prefix}.x`)
  const y = this.createVar(`${prefix}.y`)
  const width = this.createVar(`${prefix}.width`)
  const height = this.createVar(`${prefix}.height`)

  const right = this.createVar(`${prefix}.right`)
  solver.addConstraint(
    right,
    Operator.Eq,
    solver.expression([{ variable: x }, { variable: width }])
  )

  const bottom = this.createVar(`${prefix}.bottom`)
  solver.addConstraint(
    bottom,
    Operator.Eq,
    solver.expression([{ variable: y }, { variable: height }])
  )

  const centerX = this.createVar(`${prefix}.centerX`)
  solver.addConstraint(
    centerX,
    Operator.Eq,
    solver.expression([{ variable: x }, { variable: width, coefficient: 0.5 }])
  )

  const centerY = this.createVar(`${prefix}.centerY`)
  solver.addConstraint(
    centerY,
    Operator.Eq,
    solver.expression([{ variable: y }, { variable: height, coefficient: 0.5 }])
  )

  return {
    type,
    x,
    y,
    width,
    height,
    right,
    bottom,
    centerX,
    centerY,
  } as BoundsMap[Type]
}
```

**設計ポイント:**
- **Solver 依存**: `LayoutVariables.createBound` は注入された solver にアクセスして制約を登録するため LayoutContext 経由で solver を渡す。
- **派生変数の一貫性**: 計算済み変数は常に生成され、`solver.addConstraint` で定義される。
- **型付き Bounds**: `BoundsMap` を使うことで `type` に応じた Bounds 型を返す。

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

DiagramSymbol は構築時に `LayoutContext.constraints.withSymbol` を呼び出し、`LayoutConstraintBuilder` を通じて制約を登録します。たとえば `containerInbounds` 制約の登録は次のようになります。

```typescript
context.constraints.withSymbol(this.id, 'containerInbounds', (builder) => {
  this.ensureLayoutBounds(builder)
})
```

`ensureLayoutBounds` は `buildContainerConstraints` と最小サイズ制約の両方を追加し、以下のような制約を `LayoutConstraintStrength.Strong` / `Weak` で登録します。

```typescript
builder.eq(
  this.container.x,
  this.expressionFromBounds(builder, bounds, 'x', padding.left),
  LayoutConstraintStrength.Strong
)
builder.eq(
  this.container.y,
  this.expressionFromBounds(builder, bounds, 'y', padding.top + header),
  LayoutConstraintStrength.Strong
)
builder.eq(
  this.container.width,
  this.expressionFromBounds(builder, bounds, 'width', -horizontalPadding),
  LayoutConstraintStrength.Strong
)
builder.eq(
  this.container.height,
  this.expressionFromBounds(builder, bounds, 'height', -verticalPadding),
  LayoutConstraintStrength.Strong
)
```

さらに `ensureLayoutBounds` は初回呼び出し時に図そのものの `bounds.x` / `bounds.y` を 0 に固定し（`Strong`）、`bounds.width` / `bounds.height` に `200` / `150` の `Weak` 制約を与えて最小サイズを保証します。これにより DiagramSymbol は原点に固定されたコンテナとして機能します。

ユーザシンボルの追加時には `enclose` 系制約が図全体に自動適用されるため、すべてのシンボルが DiagramSymbol 内の領域に収まり、図全体のサイズも自動的に追従します。

---

## 制約の実装詳細

### LayoutConstraintBuilder

`LayoutConstraints.withSymbol` は `LayoutConstraintBuilder` を生成し、`eq` / `ge` / `expression` で `kiwi.Constraint` を蓄積します。

```typescript
class LayoutConstraintBuilder {
  private readonly raws: kiwi.Constraint[] = []

  constructor(private readonly solver: LayoutSolver) {}

  expression(terms?: LayoutTerm[], constant = 0) {
    return this.solver.expression(terms, constant)
  }

  eq(left: LayoutExpressionInput, right: LayoutExpressionInput, strength = LayoutConstraintStrength.Strong) {
    this.raws.push(this.solver.addConstraint(left, LayoutConstraintOperator.Eq, right, strength))
    return this
  }

  ge(left: LayoutExpressionInput, right: LayoutExpressionInput, strength = LayoutConstraintStrength.Weak) {
    this.raws.push(this.solver.addConstraint(left, LayoutConstraintOperator.Ge, right, strength))
    return this
  }

  getRawConstraints() {
    return this.raws
  }
}
```

`LayoutConstraints.record` は生成された `kiwi.Constraint` を `LayoutConstraint` オブジェクトと ID で管理します。

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

`LayoutConstraints.arrangeHorizontal` / `arrangeVertical` は各シンボルペアに対して `LayoutSolver.addConstraint` を直接呼び出し、Gap を加えた等間隔の制約を構築します。実際の制約生成は `createArrangeHorizontalConstraints` / `createArrangeVerticalConstraints` に委譲され、最終的に `record` されます。

```typescript
private createArrangeHorizontalConstraints(
  symbolIds: LayoutSymbolId[],
  gap?: number
): kiwi.Constraint[] {
  const actualGap = gap ?? this.theme.defaultStyleSet.horizontalGap
  const raws: kiwi.Constraint[] = []

  for (let i = 0; i < symbolIds.length - 1; i++) {
    const current = this.resolveSymbolById(symbolIds[i])
    const next = this.resolveSymbolById(symbolIds[i + 1])
    if (!current || !next) continue

    const currentBounds = current.layout
    const nextBounds = next.layout

    raws.push(
      this.solver.addConstraint(
        nextBounds.x,
        LayoutConstraintOperator.Eq,
        this.solver.expression([{ variable: currentBounds.x }, { variable: currentBounds.width }], actualGap),
        LayoutConstraintStrength.Strong
      )
    )
  }

  return raws
}
```

`arrangeVertical` は同様に `y` / `height` を使って縦方向の等間隔制約を生成します。

### Align（整列）の実装

整列系のヒントは `createAlignCenterXConstraints` や `createAlignRightConstraints` などのヘルパーを使い、参照シンボルとの `right` / `bottom` / `centerX` / `centerY` の派生変数を利用して制約を追加します。

```typescript
private createAlignCenterXConstraints(symbolIds: LayoutSymbolId[]): kiwi.Constraint[] {
  const raws: kiwi.Constraint[] = []
  if (symbolIds.length < 2) return raws

  const first = this.resolveSymbolById(symbolIds[0])
  if (!first) return raws
  const firstBounds = first.layout

  for (let i = 1; i < symbolIds.length; i++) {
    const current = this.resolveSymbolById(symbolIds[i])
    if (!current) continue
    const currentBounds = current.layout

    raws.push(
      this.solver.addConstraint(
        this.solver.expression([
          { variable: currentBounds.x },
          { variable: currentBounds.width, coefficient: 0.5 },
        ]),
        LayoutConstraintOperator.Eq,
        this.solver.expression([
          { variable: firstBounds.x },
          { variable: firstBounds.width, coefficient: 0.5 },
        ]),
        LayoutConstraintStrength.Strong
      )
    )
  }

  return raws
}
```

`alignWidth` / `alignHeight` は派生変数を使わず単純に幅・高さを等しくする制約を加えます。

### Enclose（包含）の実装

`enclose` 系のメソッドは、`resolveSymbolById` でコンテナと子を取得し、`LayoutSolver.addConstraint` で `Ge` 制約を追加します。

- `enclose` は各子の `x`/`y` をコンテナの `x`/`y` 以上にし、コンテナの右/下を子の右/下以上にする。
- `encloseGrid` / `encloseFigure` は `enclose` の上に `createArrangeHorizontalConstraints` / `createArrangeVerticalConstraints` を組み合わせ、行列・行ごとの配置制約を追加する。

各メソッドは `record` を呼んで `LayoutConstraint` を記録するため、デバッグ時には制約 ID で追跡できます。


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
hint.arrangeHorizontal(a, b, c)  // → context.constraints.arrangeHorizontal([a,b,c])
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
    const bound = context.variables.createBound(symbolId)
    const circle = new CircleSymbol(symbolId, label, bound)

    context.constraints.withSymbol(symbolId, 'symbolBounds', (builder) => {
      circle.ensureLayoutBounds(builder)
    })

    return circle
  })
  return symbol.id
}
```

---

## 命名規則

* `LayoutContext` インスタンスは `context` と呼ぶ
* `LayoutConstraints` は `constraints`
* `LayoutVariables` は `variables`

## LayoutBound Injection

### 概要

SymbolBase および ContainerSymbolBase は、LayoutBound をコンストラクタで注入し、immutable として保持します。
これにより、layoutContext への直接依存を排除し、シンボル側で固有の制約を追加できるようになります。

### SymbolBase の構造

```typescript
export abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  protected readonly layoutBounds: LayoutBound
  // 後方互換性のため残されているが、layoutBounds を使用することを推奨
  bounds?: { x: number; y: number; width: number; height: number }

  constructor(id: SymbolId, label: string, layoutBounds: LayoutBound) {
    this.id = id
    this.label = label
    this.layoutBounds = layoutBounds
  }

  getLayoutBounds(): LayoutBound {
    return this.layoutBounds
  }

  // toSVG や getConnectionPoint 内で layoutBounds を使用
  abstract toSVG(): string
  abstract getConnectionPoint(from: Point): Point
}
```

### LayoutBound の使用例

```typescript
export class CircleSymbol extends SymbolBase {
  toSVG(): string {
    const bounds = this.getLayoutBounds()
    const x = bounds.x.value()
    const y = bounds.y.value()
    const width = bounds.width.value()
    const height = bounds.height.value()
    
    const cx = x + width / 2
    const cy = y + height / 2
    const r = Math.min(width, height) / 2
    
    return \`<circle cx="\${cx}" cy="\${cy}" r="\${r}" ... />\`
  }
}
```

### メリット

1. **依存性の逆転**: シンボルは layoutContext に依存しない
2. **責任の分離**: レイアウト変数の生成と制約の定義が分離
3. **拡張性**: 将来的なカスタム制約の追加が容易
4. **型安全性**: コンパイル時に型チェック

---

## 制約の追跡

各制約には一意なIDが付与され、デバッグや削除が可能です。

```typescript
// 制約ID形式
"constraints/${serial}"                    // 通常の制約
"constraints/${symbolId}/${serial}"        // Symbol固有の制約
```

現在は制約の削除 API を公開していませんが、`LayoutConstraints.list()` で記録済みの制約と ID を確認できます。将来的には `LayoutContext.constraints.remove()` のような API で ID を指定して削除できる設計も検討しています。

---

## まとめ

### 完了した機能

- ✅ **LayoutContext**: Variables/Constraints のファサード化
- ✅ **オンライン制約適用**: ヒント呼び出し時に即座に制約追加
- ✅ **LayoutBound**: インターフェース化、派生変数の事前作成
- ✅ **Container Symbol Interface**: `container: ContainerBounds` を保持し `containerInbounds` 制約を登録するシンプルなインターフェース
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

# SymbolBaseのスリム化

現在SymbolBaseのコンストラクタにlabelがあるが、
ラベルはサブクラスが必要に応じて持てばよく、
その基底であるSymbolBaseが保持する必要はない。

Symbolのコンストラクタはオブジェクトで与え、サブクラスは `SymbolBaseOptions` を継承した `options` を用意します。

```ts
interface SymbolBaseOptions {
  id: SymbolId
  layoutBounds: Bounds
  theme: Theme
}

abstract class SymbolBase {
  constructor(options: SymbolBaseOptions) { ... }

  abstract ensureLayoutBounds(builder: LayoutConstraintBuilder): Bounds
  abstract toSVG(): string
  abstract getConnectionPoint(from: Point): Point
}
```

Container系のシンボルは `ContainerSymbol` インターフェースを実装し、`container: ContainerBounds` を自前で保持します。

```ts
interface ContainerSymbol extends SymbolBase {
  readonly container: ContainerBounds
}

interface DiagramSymbolOptions extends SymbolBaseOptions {
  info: DiagramInfo
}

class DiagramSymbol extends SymbolBase implements ContainerSymbol {
  readonly container = layout.variables.createBound(`${this.id}.container`, "container")

  constructor(options: DiagramSymbolOptions, private readonly layout: LayoutContext) {
    super(options)
    this.registerContainerConstraints()
  }
}
```

これによりラベルなどの固有状態は各サブクラスで管理でき、`SymbolBase` 側は `id`/`layoutBounds`/`theme` だけに集中できます。

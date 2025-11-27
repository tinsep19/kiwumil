# ContainerSymbolBaseについて

`ContainerSymbolBase` は廃止し、代わりに `SymbolBase` を継承し `container: Bounds` を持つ単純なコンテナシンボルインターフェース (`ContainerSymbol`) を導入します。

コンテナシンボルの実装は次のような構成になります。

```ts
class MyContainerSymbol extends SymbolBase implements ContainerSymbol {
  readonly container = layout.variables.createBound(`${this.id}.container`, "container")

  constructor(options: SymbolBaseOptions, private readonly layout: LayoutContext) {
    super(options)
    this.registerContainerConstraints()
  }

  private registerContainerConstraints() {
    this.layout.constraints.withSymbol(this.id, "containerInbounds", (builder) => {
      this.ensureLayoutBounds(builder)
      // container と layout Bounds 間のパディング等を登録
    })
  }
}
```

この形により、`DiagramSymbol` や `SystemBoundarySymbol` はそれぞれ自前の `container` Bounds を持ち、
`layout.constraints.withSymbol(symbolId, ...)` を使って `containerInbounds` 制約を登録します。
また `ensureLayoutBounds(builder)` を明示的に呼ぶことで、シンボル固有の制約 (padding, header 等) が builder の中で確実に追加されます。

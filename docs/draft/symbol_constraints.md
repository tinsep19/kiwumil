# Symbol内部の制約

以下のように `SymbolBaseOptions` を受け取る `options` オブジェクトで統一したコンストラクタパターンを採用し、
`ensureLayoutBounds(builder)` を使って Symbol 側で固有制約を追加する流れを推奨します。

```
function mySymbol(label: string): SymbolId {
  const symbol = symbols.register(plugin, "MySymbol", (symbolId) => {
    const bound = layout.variables.createBound(symbolId)
    const mySymbol = new MySymbol({
      id: symbolId,
      layoutBounds: bound,
      label,
    })

    context.hints.withSymbol(mySymbol.id, "symbolBounds", (builder) => {
      mySymbol.ensureLayoutBounds(builder)
      builder.ge(/* ... */)
    })

    return mySymbol
  })
  return symbol.id
}
```

これにより `SymbolBase` のコンストラクタには `layoutBounds`、`id`、`theme` が渡され、
`LayoutContext` を直接渡す必要はありません。

`DiagramSymbol` では `DiagramSymbolOptions`（`info` プロパティ）からタイトルや作成者情報を保持しながら、`LayoutContext` はレイアウト用のインスタンスとして外部から注入されます。
シンボル固有のプロパティ（たとえば `label`）は、`SymbolBaseOptions` を継承した `options` 型にまとめて定義します。

```ts
interface MySymbolOptions extends SymbolBaseOptions {
  label: string
}

class MySymbol extends SymbolBase {
  readonly label: string

  constructor(options: MySymbolOptions) {
    super(options)
    this.label = options.label
  }

  protected override buildLayoutConstraints(builder: LayoutConstraintBuilder): void {
    // ここで Symbol 固有の制約を登録
  }
}
```

この方針により、カスタムシンボルへの引数は `options` に一元化されて扱いやすくなり、
`ensureLayoutBounds(builder)` での制約追加と `LayoutConstraints.withSymbol(symbolId, ...)` の連携を整理できます。
コンテナシンボルは `ContainerSymbol` を実装し、`container: ContainerBounds` を保持した上で `containerInbounds`
の制約を `LayoutContext.hints.withSymbol(symbolId, ...)` 内部で登録し、同じ builder 内で
`ensureLayoutBounds(builder)` を呼び出すことを忘れないでください。
新しい `withSymbol` は `symbolId` を受け取り、ビルダ内で `symbol.ensureLayoutBounds(builder)` を呼び出すことで制約を追加することを想定しています。

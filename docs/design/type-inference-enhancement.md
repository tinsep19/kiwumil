# Type Inference Enhancement for namespace-dsl

## 概要

`namespace-dsl` を使用してカスタムプラグインを作成する際、拡張した `ISymbolCharacs<T>` 型を正しく推論できるよう型システムを改善しました。

## 背景

以前は、カスタムプラグインで拡張したシンボル特性（`ISymbolCharacs<T>`）を使用する際、明示的な型キャストが必要でした：

```typescript
const node = el.custom.node('Test Node')
const typedNode = node as TestSymbolCharacs  // 型キャストが必要だった
typedNode.item  // これで拡張プロパティにアクセス可能
```

これは、`DiagramPlugin` の型定義が `ISymbolCharacs` のジェネリック型パラメータを保持していなかったためです。

## 解決策

### 変更箇所

1. **src/dsl/diagram_plugin.ts**
   - `SymbolFactoryMap` の定義を更新し、ジェネリック型パラメータを保持

2. **src/dsl/namespace_types.ts**
   - `SymbolEnabledPlugins` の型定義を更新し、`ISymbolCharacs<any>` を使用

### 実装詳細

```typescript
// diagram_plugin.ts
type SymbolFactoryMap = Record<string, (...args: any[]) => ISymbolCharacs<any>>

// namespace_types.ts
type SymbolEnabledPlugins<TPlugins extends readonly DiagramPlugin[]> = Extract<
  TPlugins[number],
  {
    createSymbolFactory: (
      symbols: Symbols,
      theme: Theme,
      icons: Record<string, () => IconMeta>
    ) => Record<string, (...args: any[]) => ISymbolCharacs<any>>
  }
>
```

## 結果

型キャストなしで拡張プロパティに直接アクセス可能になりました：

```typescript
const node = el.custom.node('Test Node')
// 型キャスト不要！
expectType<LayoutBounds>(node.item)
expectType<Variable>(node.v)
```

## 互換性

- 既存のプラグイン（UMLPlugin、CorePlugin等）はすべて正常に動作
- すべてのテストが成功（175 tests pass）
- ビルドが正常に完了

## テスト

型推論の動作は `tsd/namespace-dsl.test-d.ts` で検証されています。

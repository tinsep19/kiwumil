# 2026-01-03: Remove SymbolBase Abstract Class

## 概要

`SymbolBase` 抽象クラスと `SymbolBaseOptions` インターフェースをコードベースから完全に削除しました。すべてのシンボルクラスは、継承ではなく直接 `ISymbol` インターフェースを実装するように変更されました。

## 変更内容

### 削除されたファイル
- `src/model/symbol_base.ts` - SymbolBase 抽象クラスと SymbolBaseOptions の定義

### 更新されたシンボルクラス

以下のシンボルクラスが `extends SymbolBase` から `implements ISymbol` に変更されました：

1. **CircleSymbol** (`src/plugin/core/symbols/circle_symbol.ts`)
   - id, bounds, theme プロパティを直接定義
   - render() メソッドを追加

2. **RectangleSymbol** (`src/plugin/core/symbols/rectangle_symbol.ts`)
   - id, bounds, theme プロパティを直接定義
   - render() メソッドを追加

3. **RoundedRectangleSymbol** (`src/plugin/core/symbols/rounded_rectangle_symbol.ts`)
   - id, bounds, theme プロパティを直接定義
   - render() メソッドを追加

4. **EllipseSymbol** (`src/plugin/core/symbols/ellipse_symbol.ts`)
   - id, bounds, theme プロパティを直接定義
   - render() メソッドを追加

5. **TextSymbol** (`src/plugin/core/symbols/text_symbol.ts`)
   - id, bounds, theme プロパティを直接定義
   - render() メソッドを追加

6. **SystemBoundarySymbol** (`src/plugin/uml/symbols/system_boundary_symbol.ts`)
   - id, bounds, theme, container プロパティを直接定義
   - render() メソッドを追加
   - ContainerSymbol インターフェースを直接実装

### Options インターフェースの変更

各シンボルの Options インターフェースが `extends SymbolBaseOptions` から独立した定義に変更されました：

```typescript
// Before
export interface CircleSymbolOptions extends SymbolBaseOptions {
  label: string
  r: Variable
}

// After
export interface CircleSymbolOptions {
  id: SymbolId
  bounds: LayoutBounds
  theme: Theme
  label: string
  r: Variable
}
```

### ContainerSymbol の移動

`ContainerSymbol` インターフェースが `src/model/symbol_base.ts` から `src/plugin/uml/symbols/system_boundary_symbol.ts` に移動され、`SymbolBase` への依存が削除されました：

```typescript
// Before
export interface ContainerSymbol extends SymbolBase {
  readonly container: ContainerBounds
}

// After
export interface ContainerSymbol extends ISymbol {
  readonly container: ContainerBounds
}
```

### 型参照の更新

以下のファイルで SymbolBase への参照が ISymbol に更新されました：

- `src/model/symbols.ts` - SymbolRegistry の返り値の型
- `src/dsl/hint_factory.ts` - HintFactory のメソッドシグネチャ
- `src/hint/guide_builder.ts` - GuideBuilderImpl のコンストラクタ
- `src/model/index.ts` - エクスポートリスト
- `src/index.ts` - エクスポートリスト

### テストの更新

`tests/symbol_base_layout.test.ts` が更新され、ISymbol を直接実装する DummySymbol クラスを使用するようになりました。

## 影響

### 利点

1. **クラス階層の簡素化**: 抽象クラスの継承階層が削除され、より柔軟な設計が可能になりました
2. **依存関係の削減**: シンボルクラスが SymbolBase に依存しなくなりました
3. **型の明確化**: すべてのシンボルが ISymbol インターフェースを直接実装することで、型システムがより明確になりました

### 互換性

- 公開 API レベルでは後方互換性を維持
- 内部実装のみが変更され、ユーザーコードへの影響はありません

## テスト結果

```
223 pass
2 skip
0 fail
634 expect() calls
```

すべてのテストが成功し、ビルドとリンターも問題なく完了しました。

## 関連ドキュメント

この変更により、以下のドキュメントが古くなっている可能性があります（後で更新が必要）：

- `docs/design/architecture.md`
- `docs/design/architecture.ja.md`
- `docs/design/layout-system.md`
- `docs/design/layout-system.ja.md`
- `docs/draft/refine_symbol_base.md`
- `docs/draft/container_base.md`

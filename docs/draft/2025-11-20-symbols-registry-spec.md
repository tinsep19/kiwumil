# SymbolsRegistry と BoundsBuilder の仕様

**作成日**: 2025-11-20  
**ステータス**: Draft（実装前の設計検討）

## 概要

現在の Kiwumil では、各プラグインが独自に `createIdGenerator` を使用してシンボルの ID を生成し、`userSymbols.push()` で配列に追加しています。この方式では以下の問題があります：

1. プラグイン実装者が `userSymbols.push()` を忘れるリスクがある
2. ID 生成ルールがプラグインごとに分散している
3. Bounds や LayoutVar に一意の ID が付与されていない（デバッグが困難）

本仕様では、中央集約型の **SymbolsRegistry** を導入し、これらの問題を解決します。

## 目標

1. **シンボル登録の一元管理**: Registry が register メソッドでシンボルを管理
2. **ID 生成の統一**: `${plugin}:${symbolName}/${index}` 形式に統一
3. **Bounds/LayoutVar への ID 付与**: デバッグ性の向上
4. **BoundsBuilder の導入**: Bounds 作成時に自動的に ID を割り当てる

## 新しい ID フォーマット

### SymbolId

現在: `${plugin}:${symbolName}-${counter}`  
例: `"core:rectangle-0"`, `"uml:actor-1"`

新規: `${plugin}:${symbolName}/${index}`  
例: `"core:rectangle/0"`, `"uml:actor/1"`

index は registry に登録された総数に基づくグローバルカウンタ。

### Bounds ID

新規: `${symbolId}#${propertyKey}`  
例: 
- `"core:rectangle/0#layout"` (メインの layout bounds)
- `"core:rectangle/0#header"` (カスタムプロパティの bounds)

### LayoutVar ID

新規: `${boundsId}.${property}`  
例:
- `"core:rectangle/0#layout.x"`
- `"core:rectangle/0#layout.y"`
- `"core:rectangle/0#layout.width"`
- `"core:rectangle/0#layout.height"`

## SymbolsRegistry API

### クラス定義

```typescript
export class SymbolsRegistry {
  private symbols: SymbolBase[] = []
  private symbolCounter: number = 0

  /**
   * シンボルを登録
   * @param owner - プラグイン名（例: "core", "uml"）
   * @param name - シンボル種別（例: "rectangle", "actor"）
   * @param factory - シンボルを生成する関数
   * @returns 登録されたシンボル
   */
  register<T extends SymbolBase>(
    owner: string,
    name: string,
    factory: (symbolId: SymbolId, boundsBuilder: BoundsBuilder) => T
  ): T

  /**
   * ID でシンボルを取得
   */
  get(id: SymbolId): SymbolBase | undefined

  /**
   * すべてのシンボルを取得
   */
  list(): SymbolBase[]

  /**
   * シンボルを削除
   */
  remove(id: SymbolId): boolean

  /**
   * 登録済みシンボル数を取得
   */
  count(): number
}
```

### 使用例

```typescript
const registry = new SymbolsRegistry(layoutContext)

// プラグインからの使用
const symbol = registry.register('core', 'rectangle', (id, bounds) => {
  const layoutBounds = bounds.createBase('layout')
  return new RectangleSymbol(id, 'My Rectangle', layoutBounds)
})

console.log(symbol.id) // "core:rectangle/0"
```

## BoundsBuilder API

### インターフェース定義

```typescript
export interface BoundsBuilder {
  /**
   * 基本的な Bounds を作成（x, y, width, height の4つの LayoutVar）
   * @param propertyKey - bounds のプロパティ名（省略時は ID なし）
   */
  createBase(propertyKey?: string): {
    x: LayoutVar
    y: LayoutVar
    width: LayoutVar
    height: LayoutVar
  }

  /**
   * LayoutBounds を作成
   */
  createLayoutBound(propertyKey?: string): LayoutBounds

  /**
   * ContainerBounds を作成（将来の拡張用）
   */
  createContainerBound(propertyKey?: string): LayoutBounds

  /**
   * 複数の Bounds をまとめて作成
   * @param spec - key と Bounds の仕様のマップ
   */
  createSet(spec: Record<string, 'base' | 'layout' | 'container'>): Record<string, LayoutBounds>
}
```

### 実装クラス

```typescript
export class DefaultBoundsBuilder implements BoundsBuilder {
  constructor(
    private readonly symbolId: SymbolId,
    private readonly layoutContext: LayoutVariables
  ) {}

  createBase(propertyKey?: string) {
    const baseId = propertyKey ? `${this.symbolId}#${propertyKey}` : this.symbolId
    return {
      x: new LayoutVar(`${baseId}.x`, this.layoutContext),
      y: new LayoutVar(`${baseId}.y`, this.layoutContext),
      width: new LayoutVar(`${baseId}.width`, this.layoutContext),
      height: new LayoutVar(`${baseId}.height`, this.layoutContext)
    }
  }

  // ... 他のメソッド実装
}
```

## LayoutVar の変更

現在の LayoutVar は kiwi.Variable のラッパーですが、ID プロパティがありません。

### 変更内容

```typescript
// 現在
export type LayoutVar = kiwi.Variable & { readonly [LAYOUT_VAR_BRAND]: true }

// 新規
export type LayoutVar = kiwi.Variable & { 
  readonly [LAYOUT_VAR_BRAND]: true
  readonly varId: string  // ID を格納するプロパティ（kiwi の id() メソッドとは別）
}

// LayoutVariables.createVar の実装
createVar(name: string): LayoutVar {
  const variable = new kiwi.Variable(name)
  Object.defineProperty(variable, LAYOUT_VAR_BRAND, { ... })
  Object.defineProperty(variable, 'varId', {
    value: name,  // 変数名を varId として保存
    enumerable: false,
    configurable: false,
    writable: false
  })
  return variable as LayoutVar
}
```

**注意**: kiwi.Variable には `id()` メソッド（数値を返す）が既に存在するため、新しいプロパティ名として `varId` を使用します。

## プラグイン API の変更

### 現在

```typescript
createSymbolFactory(userSymbols: SymbolBase[], layout: LayoutContext): SymbolFactoryMap
```

### 新規

```typescript
createSymbolFactory(registry: SymbolsRegistry, layout: LayoutContext): SymbolFactoryMap
```

### プラグイン実装の変更例

```typescript
// 現在
export const CorePlugin = {
  name: 'core',
  createSymbolFactory(userSymbols: SymbolBase[], layout: LayoutContext) {
    const idGen = createIdGenerator(this.name)
    return {
      rectangle(label: string): SymbolId {
        const id = idGen.generateSymbolId('rectangle')
        const symbol = new RectangleSymbol(id, label, layout.vars)
        layout.applyFixedSize(symbol)
        userSymbols.push(symbol) // ← push を忘れるリスク
        return id
      }
    }
  }
}

// 新規
export const CorePlugin = {
  name: 'core',
  createSymbolFactory(registry: SymbolsRegistry, layout: LayoutContext) {
    return {
      rectangle(label: string): SymbolId {
        const symbol = registry.register('core', 'rectangle', (id, bounds) => {
          const layoutBounds = bounds.createLayoutBound('layout')
          const symbol = new RectangleSymbol(id, label, layoutBounds)
          layout.applyFixedSize(symbol)
          return symbol
        })
        return symbol.id
      }
    }
  }
}
```

## マイグレーション手順

1. **LayoutVar クラスの作成と更新**
   - 新しい LayoutVar クラスを実装
   - id プロパティを追加

2. **BoundsBuilder の実装**
   - DefaultBoundsBuilder クラスを作成
   - createBase, createLayoutBound メソッドを実装

3. **SymbolsRegistry の実装**
   - register メソッドで ID 生成と factory 呼び出し
   - 内部配列での管理

4. **DiagramPlugin インターフェースの更新**
   - createSymbolFactory の signature を変更

5. **各プラグインの更新**
   - CorePlugin, UMLPlugin の実装を変更
   - createIdGenerator の使用を廃止

6. **DiagramBuilder / NamespaceBuilder の更新**
   - registry インスタンスを作成して渡す
   - userSymbols 配列を registry.list() に置換

7. **テストの追加と更新**
   - symbols_registry.test.ts を追加
   - 既存のテストを新しい API に対応

## 残課題・将来の拡張

- createIdGenerator の削除または deprecate（今回は非使用化のみ）
- プラグイン別カウンタへの拡張（必要に応じて）
- ContainerBounds の詳細仕様

## 影響範囲

### 破壊的変更

- DiagramPlugin.createSymbolFactory の signature 変更
- SymbolId のフォーマット変更

### 非破壊的変更

- LayoutVar クラスへの id 追加（内部実装）
- Bounds への ID 付与（内部実装）

### 影響を受けるファイル

- `src/dsl/diagram_plugin.ts`
- `src/dsl/namespace_builder.ts`
- `src/dsl/diagram_builder.ts`
- `src/plugin/core/plugin.ts`
- `src/plugin/uml/plugin.ts`
- `src/layout/layout_variables.ts`
- `src/model/symbol_base.ts`（軽微な変更の可能性）

## 検証方法

1. すべてのユニットテストが通ること
2. ID フォーマットが期待通りであること（"plugin:name/index"）
3. Bounds と LayoutVar に正しい ID が付与されていること
4. solve 後の値取得が正常に動作すること

## まとめ

この仕様により、以下が実現されます：

- ✅ プラグイン実装者が push を忘れるリスクの排除
- ✅ ID 生成の一元管理と統一
- ✅ デバッグ性の向上（すべての変数に追跡可能な ID）
- ✅ 型安全性の維持

次のステップは、この仕様に基づいた実装とテストの作成です。

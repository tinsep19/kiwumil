# SymbolsRegistry と BoundsBuilder の実装ログ

**実装日**: 2025-11-20  
**ブランチ**: refine_symbol_factory_architechture

## 実施内容

### 1. LayoutVar への varId 追加

**ファイル**: `src/layout/layout_variables.ts`

- `LayoutVar` 型に `varId: string` プロパティを追加
- `LayoutVariables.createVar()` で変数作成時に `varId` を設定
- **注意**: kiwi.Variable には既に `id()` メソッド（数値を返す）が存在するため、プロパティ名を `varId` にした

```typescript
export type LayoutVar = kiwi.Variable & { 
  readonly [LAYOUT_VAR_BRAND]: true
  readonly varId: string  // 新規追加
}
```

### 2. BoundsBuilder の実装

**ファイル**: `src/layout/bounds_builder.ts` (新規作成)

- `BoundsBuilder` インターフェースを定義
- `DefaultBoundsBuilder` クラスを実装
  - `createBase(propertyKey?)`: 基本的な4つの LayoutVar を作成
  - `createLayoutBound(propertyKey?)`: LayoutBounds インスタンスを作成
  - `createContainerBound(propertyKey?)`: Container 用の bounds を作成
  - `createSet(spec)`: 複数の bounds を一度に作成

**ID フォーマット**:
- Bounds ID: `${symbolId}#${propertyKey}` 例: `"core:rectangle/0#layout"`
- LayoutVar ID: `${boundsId}.${property}` 例: `"core:rectangle/0#layout.x"`

### 3. SymbolsRegistry の実装

**ファイル**: `src/symbols/registry.ts` (新規作成)

- シンボルの登録と管理を一元化
- グローバルカウンタによる ID 生成 (`${owner}:${name}/${index}`)
- `register()`: factory を呼び出してシンボルを生成・登録
- `get()`, `list()`, `remove()`, `count()`: シンボル管理機能
- `clear()`: テスト用にレジストリをクリア

**ID フォーマット変更**:
- 旧: `${namespace}:${symbolName}-${counter}` 例: `"core:rectangle-0"`
- 新: `${owner}:${name}/${index}` 例: `"core:rectangle/0"`

### 4. DiagramPlugin インターフェースの更新

**ファイル**: `src/dsl/diagram_plugin.ts`

- `createSymbolFactory` の signature を変更
  - 旧: `(userSymbols: SymbolBase[], layout: LayoutContext)`
  - 新: `(registry: SymbolsRegistry, layout: LayoutContext)`

### 5. NamespaceBuilder の更新

**ファイル**: `src/dsl/namespace_builder.ts`

- `buildElementNamespace` が `SymbolsRegistry` を受け取るように変更
- プラグインに registry を渡すように修正

### 6. DiagramBuilder の更新

**ファイル**: `src/dsl/diagram_builder.ts`

- `SymbolsRegistry` のインスタンスを生成
- `userSymbols` 配列の代わりに `symbolsRegistry.list()` を使用
- LayoutContext のシンボル検索を registry から取得するように変更

### 7. CorePlugin の更新

**ファイル**: `src/plugin/core/plugin.ts`

- `createSymbolFactory` を registry ベースに書き換え
- `createIdGenerator` の使用を削除
- 各メソッドで `registry.register()` を呼び出し
- `userSymbols.push()` を削除（registry が自動的に管理）

変更例:
```typescript
// 旧
circle(label: string): SymbolId {
  const id = idGen.generateSymbolId('circle')
  const symbol = new CircleSymbol(id, label, layout.vars)
  layout.applyFixedSize(symbol)
  userSymbols.push(symbol)  // ← push 忘れのリスク
  return id
}

// 新
circle(label: string): SymbolId {
  const symbol = registry.register('core', 'circle', (id, _boundsBuilder) => {
    const symbol = new CircleSymbol(id, label, layout.vars)
    layout.applyFixedSize(symbol)
    return symbol
  })
  return symbol.id
}
```

### 8. UMLPlugin の更新

**ファイル**: `src/plugin/uml/plugin.ts`

- CorePlugin と同様に `createSymbolFactory` を registry ベースに書き換え
- シンボル作成メソッドは registry.register を使用
- リレーションシップ作成メソッドは従来通り（createIdGenerator を使用）

### 9. テストの更新

**ファイル**: `tests/namespace_dsl.test.ts`

- ID フォーマットの変更に対応（`-` → `/`）
- 正規表現を更新: `/^core:circle-\d+$/` → `/^core:circle\/\d+$/`
- 期待値を更新: `"uml:actor-0"` → `"uml:actor/0"`

### 10. 新規テストの追加

**ファイル**: `tests/symbols_registry.test.ts` (新規作成)

以下の機能をテスト:
- ✅ ID フォーマット生成の検証
- ✅ グローバルカウンタのインクリメント
- ✅ BoundsBuilder による LayoutVar ID の付与
- ✅ createSet による複数 bounds の作成
- ✅ get/list/remove/count/clear メソッドの動作

### 11. ドキュメントの作成

**ファイル**: `docs/draft/2025-11-20-symbols-registry-spec.md` (新規作成)

- 仕様の詳細を記載
- ID フォーマット規約
- API 使用例
- マイグレーション手順

## テスト結果

### ビルド

```bash
$ bun run build
✅ 成功
```

### テスト実行

```bash
$ bun test
✅ 79 tests passed (277 assertions)
```

**追加されたテスト**:
- SymbolsRegistry: 13 tests
- 既存テスト: 66 tests（すべて pass）

## 変更の影響

### 破壊的変更

1. **ID フォーマットの変更**
   - SymbolId: `${plugin}:${name}-${n}` → `${plugin}:${name}/${n}`
   - 既存のテストを更新（3ファイル）

2. **DiagramPlugin API の変更**
   - `createSymbolFactory(userSymbols, layout)` → `createSymbolFactory(registry, layout)`
   - すべてのプラグインの更新が必要（CorePlugin, UMLPlugin）

### 非破壊的変更

1. **LayoutVar への varId 追加**
   - 既存コードとの互換性あり（追加のみ）

2. **内部実装の改善**
   - シンボル登録の一元化
   - push 忘れのリスク排除

## 残課題

1. **createIdGenerator の扱い**
   - 現在: リレーションシップ ID 生成で使用中
   - 今後: Relationship 用の Registry を作成するか検討

2. **プラグイン別カウンタ**
   - 現在: グローバルカウンタ（全プラグイン共通）
   - 将来: 必要に応じてプラグイン別カウンタに拡張可能

3. **ContainerBounds の詳細仕様**
   - 現在: createLayoutBound と同じ実装
   - 将来: Container 専用の拡張が必要な場合は実装

## 学んだこと・注意点

1. **kiwi.Variable の id() メソッド**
   - kiwi.Variable には既に `id()` メソッドが存在（数値を返す）
   - 新しいプロパティ名として `varId` を使用

2. **TypeScript の循環参照**
   - LayoutContext 作成時に symbolsRegistry を参照する必要があったため、
   - 一時変数 `let symbolsRegistry: SymbolsRegistry | undefined` を使用

3. **BoundsBuilder の柔軟性**
   - factory 関数に BoundsBuilder を渡すことで、
   - 将来的に異なる bounds 作成戦略を実装可能

## 次のステップ

1. ✅ すべてのテストが通ることを確認 → 完了
2. ✅ lint / build の確認 → 完了
3. ⏭️ README の更新（必要に応じて）
4. ⏭️ PR の作成と説明の記載
5. ⏭️ docs/draft を削除し、docs/design に最終仕様を配置

## まとめ

今回の実装により、以下が実現されました:

- ✅ シンボル登録の中央管理（SymbolsRegistry）
- ✅ ID 生成の統一（`${plugin}:${name}/${index}` 形式）
- ✅ Bounds/LayoutVar への ID 付与（デバッグ性向上）
- ✅ プラグイン実装の簡素化（push 忘れの防止）
- ✅ すべてのテストが通過（79 tests）

破壊的変更を含むが、リリース前のため許容範囲内。

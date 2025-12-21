# IconLoader リファクタリング - 2025-12-21

## 概要

`IconLoader` クラスを責務分離の原則に基づいてリファクタリングし、保守性を向上させた。最終的に`registerIcons` APIを削除し、`createIconFactory` APIのみをサポートする形に簡素化した。

## 背景

元の `IconLoader` クラスは複数の責務を持っていた：
1. アイコン名とファイルパスのレジストリ管理
2. 登録済みアイコンのリスト表示
3. ファイルの読み込み
4. SVGメタデータのパース

この構造では、クラスが大きくなりすぎて保守が困難になる可能性があった。

## 実装内容（最終版）

### 新しいアーキテクチャ

#### `LoaderFactory` クラス
- **責務**: IconLoaderインスタンスの作成・キャッシュと自動登録
- **主要メソッド**:
  - `cacheLoader(relPath: string)`: アイコンのローダー関数を返す（キャッシュ付き）
  - 読み込み時に自動的に`IconRegistry`に登録

#### `IconLoader` クラス（リファクタ後）
- **責務**: 単一ファイルの読み込みとパース
- **主要メソッド**:
  - `load_sync(): IconMeta`: ファイルを読み込んでメタデータを返す
- **変更点**:
  - コンストラクタが `(plugin, name, baseUrl, relPath)` の4引数に変更
  - `load_sync()` が引数不要に変更（コンストラクタで指定済みのアイコンを読み込む）

#### `IconRegistry` クラス
- **責務**: ランタイムでのシンボル管理
- 実際に使用されたアイコンのみを収集し、SVGの`<defs>`セクションを生成

### 削除されたクラス・API

1. **`IconSet` クラス** - 削除
   - `registerIcons` APIのためだけに存在していたため不要に
   
2. **`registerIcons` API** - 削除
   - `DiagramPlugin.registerIcons` メソッド
   - `Icons`, `IconRegistrar`, `IconRegistrarCallback` 型
   - すべて `createIconFactory` APIに置き換え

### 新しいプラグインAPI

```typescript
// プラグインでの実装例
export const MyPlugin = {
  name: 'myplugin',

  createIconFactory(register: IconRegister) {
    const loaderFactory = register.createLoaderFactory(import.meta)
    return {
      icon1: loaderFactory.cacheLoader('icons/icon1.svg'),
      icon2: loaderFactory.cacheLoader('icons/icon2.svg'),
    }
  },

  createSymbolFactory(symbols, theme, icons) {
    return {
      mySymbol(label: string) {
        const iconMeta = icons.icon1() // 自動キャッシュ・登録
        // ...
      }
    }
  }
}
```

### 更新されたファイル

1. **削除**:
   - `src/icon/icon_set.ts`: IconSet クラス
   - `tests/icon_loader.test.ts`: 旧IconLoaderテスト
   - `tests/icon_set.test.ts`: IconSetテスト

2. **更新**:
   - `src/icon/icon_loader.ts`: IconLoader の責務を単一ファイル操作のみに限定
   - `src/icon/loader_factory.ts`: LoaderFactory を追加（キャッシングと自動登録）
   - `src/icon/index.ts`: IconSet のエクスポートを削除
   - `src/dsl/diagram_plugin.ts`: registerIcons API と関連型を削除
   - `src/dsl/diagram_builder.ts`: createIconFactory のみをサポート
   - `src/dsl/namespace_builder.ts`: buildIconNamespace メソッドを削除
   - `src/dsl/namespace_types.ts`: createIconFactory ベースの型に更新
   - `src/dsl/index.ts`: 削除された型のエクスポートを削除
   - `src/plugin/uml/plugin.ts`: registerIcons を削除、createIconFactory のみに
   - `tests/loader_factory.test.ts`: LoaderFactory の包括的なテスト
   - `docs/design/icon-system.md`: 新しいアーキテクチャを反映
   - `docs/design/icon-system.ja.md`: 新しいアーキテクチャを反映

## テスト

テストを大幅に簡素化：
- LoaderFactory のテスト（5テスト）
- IconRegistry のテスト（既存）
- 全テスト（169件）がパス

## 後方互換性

**破壊的変更**: `registerIcons` APIは完全に削除され、`createIconFactory` APIのみがサポートされます。

移行方法：
```typescript
// Before (削除されたAPI)
registerIcons(icons: Icons) {
  icons.createRegistrar("uml", import.meta, (registrar) => {
    registrar.register("actor", "icons/actor.svg")
  })
}

// After (新しいAPI)
createIconFactory(register: IconRegister) {
  const loaderFactory = register.createLoaderFactory(import.meta)
  return {
    actor: loaderFactory.cacheLoader("icons/actor.svg"),
  }
}
```

## 得られた知見

1. **シンプルさの重要性**: 2つのAPIパスを維持するよりも、1つの明確なAPIに集約することでコードが大幅に簡潔になった
2. **自動化の利点**: LoaderFactoryが自動的にIconRegistryに登録することで、手動登録のコードを削除できた
3. **段階的なリファクタリング**: まず両方のAPIをサポートし、その後レガシーAPIを削除する段階的アプローチが効果的だった

## 次のステップ

- 実際のプロジェクトでの使用例をドキュメントに追加
- パフォーマンステストの実施（大量のアイコン読み込み時）
- 非同期読み込みのサポート検討（将来的な拡張）

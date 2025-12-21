[English](plugin-system.md) | 日本語

# Kiwumil プラグインシステム

## 目次

1. 概要
2. DiagramPlugin インターフェース
3. アイコン対応
4. 実装ノートとサンプル
5. ID 命名規則
6. ベストプラクティス
7. テスト

---

## 概要

Kiwumil のプラグインシステムは、Symbol と Relationship をモジュール的に拡張するための仕組みです。プラグインは DSL の `el` / `rel` 名前空間を提供します。

## DiagramPlugin インターフェース

主な要点:

- `name`: `el.{name}` / `rel.{name}` に使われる名前空間
- 任意のファクトリ: `createSymbolFactory`, `createRelationshipFactory`
- 任意で `registerIcons(icons)` を実装してアイコンを提供可能

簡易な型スケッチ:

```typescript
interface DiagramPlugin {
  name: string
  createSymbolFactory?: (symbols: Symbols, theme: Theme, icons: PluginIcons) => Record<string, (...args:any[]) => SymbolId>
  createRelationshipFactory?: (relationships: Relationships, theme: Theme, icons: PluginIcons) => Record<string, (...args:any[]) => RelationshipId>
  registerIcons?: (icons: Icons) => void
}
```

## アイコン対応

プラグインは `registerIcons` で SVG アイコンを登録できます。システムは `icon.{plugin}.{name}` 名前空間を構築し、使用されたアイコンのみを `IconRegistry` が `<defs>` に集約して `<use>` で再利用します。

アイコンシステムのアーキテクチャについての詳細は[アイコンシステム](icon-system.ja.md)を参照してください。

セキュリティ/実装上の注意点:
- プラグインは安全な SVG を登録すること。プロダクションではスクリプトや外部リソースを除去する（SVGO 等）。
- `IconSet` がアイコン登録を管理し、`IconLoader` がファイル読み込みを処理し、`IconRegistry` がシンボル出力の責務を持ちます。
- DSL は各プラグインの `PluginIcons` をファクトリに渡すため、ファクトリ内でアイコンを使用できます。

## 実装ノートとサンプル

プラグインは `name` と少なくとも1つのファクトリを実装します。ファクトリ内では `symbols.register(plugin, name, builder)` / `relationships.register(...)` を使って要素を生成します。

例（骨格）:

```typescript
export const MyPlugin: DiagramPlugin = {
  name: 'myplugin',
  createSymbolFactory(symbols, theme, icons) {
    return {
      mySymbol(label: string) {
        const symbol = symbols.register('myplugin', 'mySymbol', (symbolId, r) => {
          // bounds, instance, characs, constraints を設定
          return r.build()
        })
        return symbol.id
      }
    }
  }
}
```

UMLPlugin は `actor`, `usecase`, `systemBoundary` などのファクトリと `associate`, `include` 等の関係を提供します。実装例はソースを参照してください。

## ID 命名規則

ID は `${namespace}:${name}/${index}` 形式です（例: `uml:actor/0`）。`Symbols` / `Relationships` が自動生成します。

## ベストプラクティス

- ファクトリは型安全に保つ。`any` の濫用を避ける。
- `symbols.register` / `relationships.register` を使う。
- LayoutBound はビルダー側で生成し、シンボルに注入する。
- アイコンは `registerIcons` で登録し、`PluginIcons` を利用する。
- `name` はユニークにする（`core` を避ける）。

## テスト

- `TypeDiagram().use(MyPlugin).build(...)` を使ったユニットテストで動作確認。
- `tsd` による型テストで DSL の型推論を検証。

---

プラグインに関する詳細な API 例や追加実装は別ドキュメント（design 内の該当ファイル）へ分割してください。

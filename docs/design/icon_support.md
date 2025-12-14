[日本語](icon_support.ja.md) | English

# アイコン対応（設計）

このドキュメントは `docs/design/plugin-system.ja.md` の上に乗る形で、プラグインが SVG アイコンを提供し、DSL 側がそれを安全に参照・描画するための設計をまとめたものです。実装済みのモジュール群（`src/icon/*` / `src/dsl/*`）を踏まえ、アーキテクチャと今後の作業をクリアにします。

## 1. ゴール

- プラグインが `registerIcons` を通じて自前のアイコンセットを登録できる。
- DSL の `icon` 名前空間から各プラグイン・アイコンを型安全に参照できるようにし、Symbol/Relationship の `create*Factory` に渡す。
- 実行時には `IconRegistry` が使用されたアイコンのみを `<defs>` に集約し、`<use>` で再利用する。
- 名前衝突や非同期の依存が起きないように、アイコン構成を `NamespaceBuilder` → `DiagramBuilder` の流れで一貫してハンドリングする。
- SVG のセキュリティ要件（外部リソース排除、プレーン SVG）に適合したレンダリングを維持する。

## 2. アーキテクチャ

### 2.1 プラグインからのアイコン登録

- `DiagramPlugin` インターフェースは現在オプションの `registerIcons` を持ち、`createLoader(plugin, importMeta, cb)` を通じて `IconLoader` にアイコンを登録する。
- `IconLoader`（`src/icon/icon_loader.ts`）は `register(name, relPath)` でファイルパスを保持し、`load_sync(name)` で同期的に `IconMeta`（`width` / `height` / `viewBox` / `href` / `raw`）を返す。`href` は `plugin-name` 形式の `symbolId` に対応する。
- `NamespaceBuilder.buildIconNamespace()` が各プラグインの `registerIcons` を呼び出し、`PluginIcons`（`Record<string, () => IconMeta | null>`）という map を生成する。これにより `icon.${plugin}.${name}` 形式の名前空間が DSL 上に構築される。

### 2.2 DSL 側のアイコン名前空間

- `DiagramBuilder.build` は `NamespaceBuilder` に `Symbol`/`Relationship` とは別にアイコン名前空間を先に構築させる。返ってきた `icon` オブジェクトは `Record<string, PluginIcons>` で、ビルダーのコールバック引数 `{ el, rel, hint, icon }` に含まれる。
- そのコールバックをさらに `el` や `rel` へ渡すとき、各 plugin factory（`createSymbolFactory`/`createRelationshipFactory`）には該当プラグインの `PluginIcons` オブジェクトが `icons` 引数として渡る。これにより Symbol や Relationship が必要に応じて `IconMeta` を取得できる。
- 型テスト（`tsd/icon_namespace.test-d.ts`）はこのオブジェクト構造を保証し、`PluginIcons` が外部からアクセス可能であることを検証している。

### 2.3 アイコンの描画パイプライン

- `IconRegistry`（`src/icon/icon_registry.ts`）は `register(plugin, name, svgContent)` で `<symbol>` への変換を保持し、`mark_usage` で使用が明示されたアイコンを追跡する。
- `normalize_id(plugin, name)` は `plugin-name` 形式へ正規化し、大文字や記号を `-` に替換。先頭が数字の場合は `i-` を付与することで `<symbol id>` の安全性を担保する。
- `IconRegistry.emit_symbols()` は集めたシンボルを `<defs>` にまとめ、`SvgGenerator.emit_document(body)`（`src/icon/svg_generator.ts`）がそれを最終 SVG 文書に差し込む。レンダラーは `<use href="#symbolId">` を使って再利用する。
- 将来的に `DiagramBuilder` のレンダラーパスへ `IconRegistry` を組み込み、アイコン使用が `Symbols`/`Relationships` の描画タイミングと同期するようにしたい。

### 2.4 ID 命名・メタデータ

- `IconMeta` は `width`/`height`/`viewBox`/`href`/`raw` を含む構造で、DSL のヒントや `layout` に渡せる。`href` は `IconLoader` が `plugin-name` 形式で生成する `symbolId` を指す。
- `normalize_id` のルール（小文字化・無効文字は `-` 置換・数字先頭に `i-`）は `IconRegistry` だけでなく `IconLoader` が命名規則を守るための指針にもなる。
- `icon.${plugin}` 内では `PluginIcons` により同期 API を提供し、`IconMeta | null` を返す関数を扱う。これは `IconLoader.load_sync` が簡易実装を提供することで一致する。

## 3. セキュリティ / 最適化

- `IconLoader` は仮の実装であるが、プロダクションでは SVG を読み込む際に `<script>` や外部リソース（`<image>`/`href` 等）の除去、SVGO 等による不要属性の削除を行うべきである。
- `IconRegistry` と `SvgGenerator` はすべてのアイコンをインラインの `<symbol>` として DOM に埋め込み、`<use href="#symbolId">` のみで再利用することでクロスドメイン参照を禁止する。
- セキュリティフラグ（例: `trusted`）を将来的に `IconRegistry` に追加する余地はあるが、現状は `register` の段階で安全な SVG を渡すことが前提。

## 4. 実装状況と今後のタスク

1. `IconLoader` / `IconRegistry` / `SvgGenerator` を `src/icon/*` に実装済みなので、レンダリングパイプラインやテスト（`tests/*`）で期待される挙動を明確にする。
2. DSL の `icon` 名前空間の型 (`PluginIcons` / `BuildIconNamespace`) を `src/dsl/*` で整備し、テスト `tsd/icon_namespace.test-d.ts` でも保証済み。
3. `docs/draft/icon-support.md` の草案はこのドキュメントに統合し、詳細な API 例やアイコンモジュールの責務を `docs/design` にリンクする。
4. 今後の作業:
   1. 実装済みアイコン API の利用例を `docs/design/plugin-system.ja.md` に追記し、DSL との連携を図示。
   2. `IconLoader.load_sync` の実際のファイル読み込み / 最適化処理を追加し、`IconMeta.raw` に含める SVG を検証する。
   3. `SvgGenerator` から `DiagramBuilder` のレンダリングパスへの統合と、実際の `<defs>` 出力の単体テスト強化。
   4. セキュリティチェックリスト（`docs/design/security.md` など）にアイコンの検証項目を加える。

この設計を基に、プラグインシステムとアイコン名前空間の整合性を維持しながら今後の拡張を進めてください。

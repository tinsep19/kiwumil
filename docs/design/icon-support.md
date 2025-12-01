# アイコン対応（設計）

このドキュメントは、`docs/design/plugin-system.ja.md` に基づいてプラグインが SVG アイコンを提供・利用するための設計を示す。
`DiagramPlugin` ベースの名前空間・登録フローに沿って `icon` API を導入し、描画・メタデータ・セキュリティ要件を満たす仕様とする。

## 1. ゴール

- SVG アイコンはプラグインによりファイルとして提供され、DSL の `icon` 名前空間から参照できる。
- 実行時に使用されたアイコンだけを `<symbol>` にまとめて `<use>` で再利用する。
- プラグイン命名規則 (`DiagramPlugin.name`) や既存の ID フォーマットと衝突しない形で管理される。
- セキュリティ的に SVG インジェクションや外部参照を排除する。

## 2. 構成要素

### 2.1 プラグイン構成

- すべてのプラグインは `icons/` フォルダを持ち、その配下に `.svg` をプラグイン固有ファイル名で配置する（例: `plugin/icons/actors.svg`）。
- `DiagramPlugin` に `createIconFactory?` を追加することで、アイコンを公開する DSL として `icon.${plugin}.${name}()` を提供する。
- アイコンファイルは `icon-loader` により読み込み・バリデーションされ、`IconMeta` を生成する。

### 2.2 DSL 側

- `TypeDiagram().use(...)` でプラグインが登録されるとき、`icon` 名前空間にも自動的にエントリを追加する。
- `icon` は `el`/`rel` と同様に plugin name をキーとし `icon.${plugin}` を提供、`icon.${plugin}.${iconName}()` で次を返す（同期、`IconMeta`）:
  - `usageId: IconUsageId`（`icon:${plugin}.${iconName}/${serial}` 型、内部管理用）
  - `symbolId: string`（SVG `<symbol id="...">` で使う描画ID）
  - `metadata: IconMeta`（`width`, `height`, `viewBox` などの制約/ヒント）
  - `rawSvg: string`（`icon-registry` が `<symbol>` に組み込む内容。最適化済み）

- DSL の `build` コールバックはオブジェクト形式で受け取る（例: `build(({ el, rel, hint, icon }) => { ... })`）。`icon` は上記の `icon` 名前空間を指す。
- `icon` 呼び出しは `Symbol` の生成時 (たとえば `new IconSym(symbolId, meta)`) の引数として利用でき、シンボルがサイズ制約を持つ場合の参照先となる。
- DSL の `hint` や `layout` が `icon` から供給された `metadata` を参照することで、サイズやアスペクト比に応じたレイアウトができるようサポートする。

### 2.3 アイコン登録・描画

- `icon-registry` は `usageId` をキーに使用アイコンを集約し、`svg-generator` が `<defs>` 内に `<symbol id="{symbolId}">...</symbol>` を出力する。
- 未使用のアイコンは `icon-registry` に記録されず出力に含まれない。
- アプリケーション側のレンダリングロジックは `<use href="#{symbolId}">` を用いて再利用する。
- `<symbol>` の `id`（描画 ID）は `${plugin}-${iconName}` 等のシンプルな形式とし、一次的な変換処理ではプレフィックスに `plugin` を使って名前衝突を防ぐ。

## 3. ID 命名と管理

- **描画 ID (`symbolId`)**: SVG 内で `<symbol>` を定義/参照するための ID。`icon.${plugin}.${iconName}` のように小文字でハイフン結合し、先頭数字なら `i-` を付与。`<use>` はこの ID を `href="#..."` で呼び出す。
- **管理 ID (`IconUsageId`)**: 内部処理（ロギング・使用集計）用のユニーク ID。`icon:${plugin}.${iconName}/${index}` の形式とし、`Icons` レジストリが `registerUsage` で連番を割り当てることで、`Symbols` と同様に使用履歴を追跡する。
- 描画 ID は `icon-registry.emitSymbols()` 時に `symbolId` を `href` 参照先へそのまま埋め込む一方、DSL 側では `usageId` を `IconHint` などに渡して `svg-generator` へ取り込む。

## 4. セキュリティ / 最適化

- SVG ファイルは `icon-loader` でプレーン SVG であること（`<script>` 不在、外部リソース不使用）を検査し、最適化ツール（SVGO など）で不要属性を排除する。
- `icon-registry` には `trusted` フラグを導入し、未検証アイコンはレンダリング前に警告または排除できるようにする。
- 外部 `<use>` 参照は禁止。すべてのアイコンはインライン `<symbol>` として `svg-generator` が解決することで CORS を回避し、`<use>` の `href` は常に `#symbolId`（同一ドキュメント）に限定する。

## 5. タスクと次の設計作業

1. `DiagramPlugin` インターフェースに `createIconFactory?(icons: Icons): Record<string, () => IconReference>` を追加し、`use` 時に `icon` namespace を登録するフローを記述。
2. `Icons` レジストリの設計：`register(plugin, iconName, svgContent)`、`markUsage(plugin, iconName)` など。`metadata` を保持して `layout` に伝播する。
3. DSL ドキュメントで `icon.${plugin}.${name}()` の戻り値・使い方を具体的に示す（`hint.icon` / `layout` 配下のサポート）。
4. `icon-loader` / `icon-registry` / `svg-generator` モジュールの責務とテストケース（ID重複、未使用排除、メタデータ反映）を整理。
5. セキュリティ要件（SVGインジェクション防止、外部参照禁止）を含むレビュー項目を `docs/design/security.md` などにまとめる。

この設計を元に `docs/draft/icon-support.md` の草案を `docs/design/icon-support.md` に統合し、プラグインシステムの設計ドキュメント群へのリンクと整合性を確認してください。*** End Patch****** End Patch** 

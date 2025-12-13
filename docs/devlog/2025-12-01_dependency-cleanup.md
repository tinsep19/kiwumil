## 2025-12-01 Dependency Cleanup Log

### Summary

- 依存整理計画（`docs/design/dependency-cleanup-plan.md`）に基づき、まず `src/` 内のディレクトリ構成と現在の import/export の状態を把握するステップを開始。
- 主なゴールはディレクトリエントリ（`index.ts`）による再エクスポートを整備し、ファイル単位の直接 import をなくすこと。

### Current Inventory

- `src/` 以下の主要ディレクトリ: `dsl`, `layout`, `model`, `plugin`, `render`, `theme`, `utils`。うち `theme` には既存の `index.ts` があるが、他は未整備。
- `plugin` 以下に `core`/`uml` ディレクトリがあり、それぞれ `plugin.ts` や `symbols`/`relationships` を含むが index にまとめていないため、外部で個別ファイルを参照しやすい構成。
- `dsl` フォルダは `diagram_builder`, `namespace_builder`, `symbols`, `relationships` など多くのファイルを含み、外部の `src/index.ts` は `./dsl/*` の個別ファイルを直接参照している。
- `layout`、`model`、`render`、`utils` はそれぞれ `index.ts` を欠いているため、各ファイルの型/クラスが直接 import されている。

### Next Steps

1. 各ディレクトリに対して `index.ts` を作成/整備し、再エクスポートリストを定める（次のステップ2に該当）。
2. `src/index.ts` や他モジュールが新しいディレクトリエントリを利用するようにリファクタリング。
3. 進捗を随時この devlog に追記し、発見した依存上の課題や疑問点を記録。

### Step 2: Index Consolidation

- `src/dsl`, `src/kiwi`, `src/model`, `src/plugin`, `src/render`, `src/utils` に `index.ts` を追加し、サブモジュールをまとめて再エクスポートするよう整理。
- `layout/hint`、`plugin/core/symbols`、`plugin/uml/symbols`、`plugin/uml/relationships` などサブディレクトリにもエントリを追加して外部からの参照パターンが安定するようにした。
- `src/index.ts` をディレクトリインポートに切り替え、`dsl`/`plugin`/`model`/`layout` の公開 API をまとめて参照するように変更。
- `dsl/hint_factory.ts` も `layout/hint` の index を経由するよう更新し、直接ファイルを import しない形で依存を整えた。

### Step 3: Directory-Level Imports

- ディレクトリ間の依存関係（`dsl`→`layout`/`model`/`plugin`/`render`/`utils` など）を `index.ts` 経由に統一するため、個別ファイル指定だった import をディレクトリエントリに置き換え。
- `dsl/diagram_builder.ts`、`dsl/hint_factory.ts`、`plugin/core`・`plugin/uml` 系、`layout/hint` などの主要モジュールで `../layout`・`../model`・`../plugin` を使い、内部ファイルへの直接参照を排除。
- `layout/hint/grid_builder.ts` は `../../dsl` の新しい index から `isRectMatrix`/`toSymbolId`/`SymbolOrId` を取得し、`Model`・`Layout` の型を整理した。
- ESLint に `local/require-directory-index-import` というカスタムルールを導入し、ディレクトリを跨ぐ import が対象ファイルを直接参照する場合に警告・エラーを出すよう lint チェックを強化。

### Step 4: TS Path Alias

- `tsconfig.json` と `tsconfig.tsd.json` に `compilerOptions.baseUrl` を `.`、`paths["@/*"] = ["src/*"]` を追加し、`@/foo` 形式で `src` 直下を指せるようにした。
- ESLint カスタムルール `eslint-rules/directory-entry-import.js` を拡張して alias を解決し、`@/layout/utils` などの alias 参照についてもディレクトリエントリ単位での依存チェックが行われるように対応。
- 上記により `@/layout` のような alias を使いつつ、実体ファイル（`layout/bounds.ts` など）への直接 import を防止するガードが効いた。
- `tests/` と `tsd/` の import 文を alias に書き換え、`@/`/`@tinsep19/kiwumil` を使って `src` や `dist` への参照を短くしつつ、Lint で alias 経由のチェックが効くようにした。

### Verification

- `npm run lint` を実行（`@typescript-eslint/no-explicit-any` の既存警告が `src/dsl/namespace_types.ts:16` および `:27` にありますが、エラーではなく継続して警告が出るだけです）。

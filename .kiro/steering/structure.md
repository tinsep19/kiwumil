# 構造指針（Structure Steering）

## リポジトリ構成（Repository Shape）
- `src/` はアーキテクチャ層ごとのライブラリ実装を配置する。
- `tests/` はユーザー向け挙動に対応したランタイムテストを配置する。
- `tsd/` は DSL とプラグイン IntelliSense 契約の型アサーションテストを配置する。
- `docs/design/` と `docs/guidelines/` は設計根拠と開発規約を記述する。
- `examples/` は標準的な利用パターンと想定 SVG 出力を示す。

## レイヤー構成パターン（Layer Organization Pattern）
- `src/dsl`: ユーザー向けエントリーポイントと fluent なオーケストレーション。
- `src/plugin`, `src/render`: ドメインプラグインの接続とレンダリング。
- `src/model`, `src/hint`: ドメインエンティティとレイアウト意図ビルダー。
- `src/core`, `src/kiwi`, `src/theme`, `src/icon`, `src/item`, `src/utils`: 共有プリミティブと実装。

## 依存方向（Dependency Direction）
- 上位レイヤーは下位レイヤーへ依存してよい。
- 下位レイヤーは上位レイヤーへ依存してはならない。
- 新規モジュールは責務で配置し、同一レイヤーの `index.ts` 経由で公開する。

## 拡張パターン（Extension Pattern）
- 新しいドメイン対応は、以下を公開するプラグインとして追加する。
  - icon factory（任意）
  - symbol factory
  - relationship factory
- プラグイン factory は namespace-based DSL に統合し、`el.<name>` と `rel.<name>` の一貫性を保つ。

## 命名と API 公開（Naming and API Exposure）
- ファイル名・シンボル名は役割がわかる命名（`*_symbol`, `*_builder`, `*_registry`）を使う。
- 各ディレクトリの `index.ts` とトップレベルエントリーポイントで公開を集約する。
- 公開面（public surface）は最小かつ意図的に保ち、内部専用型の露出を避ける。

## 命名・import 規約（Naming and Import Conventions）
- `src/` 配下のファイル命名は主に `snake_case.ts` とする。
- 型名・クラス名は PascalCase、関数名・変数名は camelCase を使う。
- import はディレクトリエントリ（例: `../model`）を基本とし、直接ファイル import は循環回避の明示的例外時のみ許可する。

## 更新判断ルール（Change Heuristics / Drift Guard）
- 新規コードが既存のレイヤー境界と plugin/DSL パターンに従う場合、steering 更新は不要とする。
- steering は、新しい設計パターン・依存方向変更・拡張方式変更が入るときに更新する。

## メタデータ（Metadata）
- updated_at: 2026-02-15
- sync_note: lint 設定に沿った命名/import 規約と例外ポリシーを明文化済み。

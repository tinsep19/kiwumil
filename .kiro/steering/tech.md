# 技術指針（Tech Steering）

## 言語とランタイム（Language and Runtime）
- TypeScript（ES modules）をライブラリ実装と公開 API の正本（source of truth）とする。
- Bun を scripts/examples/test/build の既定ランタイムとして利用する。

## ビルドと配布（Build and Distribution）
- `src/index.ts` を起点に `dist/` へビルド出力する。
- 型定義（declaration）を生成し、ランタイム JS と合わせて配布する。
- パッケージは明示的 `exports` を持つ ESM-first ライブラリとして公開する。

## テストと品質ゲート（Testing and Quality Gates）
- `tests/` の Bun テストでランタイム挙動を検証する。
- `tsd/` の型テストで API 契約と推論品質を検証する。
- ESLint + TypeScript plugin + ローカルカスタムルールで import 規約を強制する。

## アーキテクチャ上の決定（Architectural Decisions）
- 循環依存を防ぐため、レイヤードアーキテクチャを基本とする。
  - DSL
  - Plugin/Render
  - Model/Hint
  - Core/Kiwi/Theme/Icon/Item/Utils
- 共有インターフェース／型は Core に集約し、具象実装は下位モジュールに置く。
- solver/context の構成は、可能な範囲で依存性注入（Dependency Injection）を優先する。

## 規約（Conventions）
- ディレクトリエントリ import（`../module` + `index.ts`）を、deep import より優先する。
- 直接ファイル import は、循環回避が必要な明示的例外時のみ許容する。
- 公開 API はトップレベル `src/index.ts` と各モジュール `index.ts` で集約する。

## ツール運用メモ（Tooling Notes）
- フォーマットは Prettier を使用する。
- TypeScript strict mode と追加安全フラグで API 整合性を守る。

## 開発環境（Development Environment）
- 必須ツール:
  - Bun（build/test/examples/postinstall の主ランタイム）
- 共通コマンド:
  - Dev: `bun run dev`
  - Build: `bun run build`
  - Test: `bun run test`
  - Lint: `bun run lint`

## 既知のトレードオフ（Known Tradeoffs）
- 一部の `any` は、汎用 DSL の型配管（type plumbing）やテスト補助で意図的に残す。API 境界の厳格性は lint と `tsd` で担保する。

## メタデータ（Metadata）
- updated_at: 2026-02-15
- sync_note: postinstall を Bun 実行へ統一し、実行環境要件を Bun 前提に更新済み。

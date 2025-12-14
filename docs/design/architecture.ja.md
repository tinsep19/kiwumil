[English](architecture.md) | 日本語

# アーキテクチャ概要

Kiwumil は循環依存を避けるためにレイヤー構成を採用しています。

- DSL 層 (dsl/) — ビルダーとプラグインの公開 API
- Model 層 (model/) — シンボル／関係のコアクラス
- Solver 層 (kiwi/) — 制約ソルバ連携
- Render 層 (render/) — SVG レンダリング

詳細は各設計ドキュメントを参照してください。

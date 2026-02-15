# copilot_prompt.txt の棚卸しと削除

**日付**: 2026-02-15  
**担当**: Codex

## 概要

リポジトリ直下の `copilot_prompt.txt` を確認し、現在の運用では参照されていない過去の作業指示ファイルであるため削除した。

## 確認結果

- `copilot_prompt.txt` は、Namespace DSL 移行時の方針メモであり、内容の多くは既存の設計資料と devlog に反映済み。
- リポジトリ内検索で `copilot_prompt.txt` を参照する記述は見つからず（自己参照のみ）。
- ビルド・テスト・公開 API に関わる設定ファイルからも参照されていない。

## 実施内容

1. 本記録を `docs/devlog` に追加。
2. 不要化した `copilot_prompt.txt` を削除。

## 補足

同種の一時指示ファイルを作成した場合は、完了後に要点を `docs/devlog` または `docs/design` に移し、ルート直下へ残置しない。

# 2025-12-13 kiwi_type_rename 作業開始

この devlog はブランチ `kiwi_type_rename` での作業開始を記録するためのものです。

目的:
- docs/draft/kiwi_type_rename.md に記載のリファクタリング計画を実施する。

予定タスク:
1. KiwiSolver.createHandle の引数を ILayoutVariable に変更（runtime で isLayoutVariable によるチェックを追加）
2. SuggestHandleImpl のプロパティ label を strength に変更
3. layout_solver.ts を kiwi_solver.ts にリネームし、参照元を更新
4. 型名のリネーム（LayoutVariable→KiwiVariable 等、docs/draft に従う）
5. suggest_handle.ts を新規作成して型を移動

このコミットは作業ログの追加のみで、コードのリネームは別コミットで行います。
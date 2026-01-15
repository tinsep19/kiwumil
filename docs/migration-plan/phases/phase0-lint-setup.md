# Phase 0: Lint 設定の更新

**期間**: 2日  
**開始予定**: 2026-01-15  
**ブランチ**: `refactor/phase0-lint-setup`  
**担当**: tinsep19

---

## 🎯 目標

新しいレイヤー構造（Clean Architecture）に対応した Lint 設定を整備し、Phase 1 以降の実装がスムーズに進むようにします。

### 成功基準

- [ ] 新しいディレクトリ（`src/infra/`, `src/domain/`, `src/application/`）で lint が通る
- [ ] レイヤー間の依存関係が制御されている
- [ ] CI の lint チェックが通る
- [ ] 既存コードの lint エラーが増えていない

---

## 📋 背景

Phase 1 の実装中に既存の lint チェックが失敗することが判明しました。

**問題点**:
- 新しいディレクトリ構造が既存の lint 設定に対応していない
- レイヤー間の依存関係を制御する仕組みがない

**解決策**:
Phase 0 として Lint 設定を更新し、Phase 1 の前に実施します。

---

## 📋 詳細タスク

### Day 1: ESLint 設定

#### タスク 1: ESLint 設定ファイルの更新

**ファイル**: `.eslintrc.js` または `eslint.config.js`

- [ ] 新しいディレクトリパターンに対応
- [ ] Infrastructure 層のルール設定
- [ ] Domain 層のルール設定
- [ ] Application 層のルール設定

**見積もり**: 2時間

---

#### タスク 2: Import Linter の設定

**ルール**: `eslint-plugin-import` または `@typescript-eslint/eslint-plugin`

- [ ] Domain → Infrastructure の import を禁止
- [ ] Domain → Application の import を禁止
- [ ] Application → Infrastructure の直接 import を禁止（DI 経由のみ）

**見積もり**: 1時間

---

### Day 2: TypeScript 設定とテスト

#### タスク 3: TypeScript 設定の確認

**ファイル**: `tsconfig.json`

- [ ] パスエイリアスの追加（必要に応じて）
- [ ] 型チェックが通ることを確認

**見積もり**: 30分

---

#### タスク 4: CI の確認

**ファイル**: `.github/workflows/*.yml`

- [ ] Lint チェックが新しいディレクトリを含むことを確認
- [ ] CI が通ることを確認

**見積もり**: 30分

---

#### タスク 5: テストと検証

- [ ] `bun run lint` が通る
- [ ] `bun run typecheck` が通る
- [ ] 既存コードで新たなエラーが出ていない

**見積もり**: 1時間

---

#### タスク 6: ドキュメント作成

**ファイル**: `docs/devlog/2026-01-15-phase0-lint-setup.md`

- [ ] 実施内容の記録
- [ ] 設定変更の説明
- [ ] Phase 1 への引き継ぎ事項

**見積もり**: 30分

---

## 📊 タスク一覧（チェックリスト）

### Day 1
- [ ] ESLint 設定ファイル更新 (2h)
- [ ] Import Linter 設定 (1h)

**Day 1 合計**: 3時間

### Day 2
- [ ] TypeScript 設定確認 (0.5h)
- [ ] CI 確認 (0.5h)
- [ ] テスト・検証 (1h)
- [ ] ドキュメント作成 (0.5h)

**Day 2 合計**: 2.5時間

**Phase 0 総見積もり**: 5.5時間（1日 + バッファ 0.5日）

---

## ⚠️ リスク評価

| リスク | 影響度 | 発生確率 | 対策 |
|---|---|---|---|
| 既存コードで lint エラー大量発生 | 中 | 中 | 一時的に警告に変更、段階的修正 |
| Import linter が複雑化 | 低 | 低 | 必要最小限のルールのみ |
| CI の設定変更が必要 | 低 | 低 | 既存設定を確認して対応 |

---

## 📦 成果物

### 更新ファイル

- [ ] `.eslintrc.js` / `eslint.config.js`
- [ ] `tsconfig.json` (必要に応じて)
- [ ] `.github/workflows/*.yml` (必要に応じて)

### ドキュメント

- [ ] `docs/devlog/2026-01-15-phase0-lint-setup.md`
- [ ] `docs/migration-plan/phases/phase0-completion.md` (完了時)

---

## ✅ Definition of Done

- [ ] すべてのタスクが完了
- [ ] `bun run lint` が通る
- [ ] `bun run typecheck` が通る
- [ ] CI が通る
- [ ] 既存コードに新たなエラーなし
- [ ] devlog 作成完了
- [ ] PR マージ完了

---

## 🔧 実装例

### ESLint 設定例

```javascript
// eslint.config.js (Flat Config の場合)
export default [
  {
    files: ['src/infra/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // kiwi との型変換で必要
    }
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: ['**/infra/**', '**/presentation/**']
      }]
    }
  }
]
```

### Import Linter 設定例

```javascript
{
  files: ['src/domain/**/*.ts'],
  rules: {
    'import/no-restricted-paths': ['error', {
      zones: [
        {
          target: './src/domain',
          from: './src/infra',
          message: 'Domain layer should not import from Infrastructure layer'
        }
      ]
    }]
  }
}
```

### TypeScript パスエイリアス例

```json
{
  "compilerOptions": {
    "paths": {
      "@/infra/*": ["src/infra/*"],
      "@/domain/*": ["src/domain/*"],
      "@/application/*": ["src/application/*"]
    }
  }
}
```

---

## 📝 コミット＆PR

```bash
git add .eslintrc.js eslint.config.js tsconfig.json .github/workflows/
git commit -m "chore: update lint configuration for clean architecture layers

- Add layer-specific ESLint rules (infra, domain, application)
- Configure import linter for dependency control
- Prevent Domain layer from importing Infrastructure
- Update TypeScript paths for new directory structure
- Verify CI includes new directories

Preparation for Phase 1 (Infrastructure layer setup).
This ensures lint checks pass for the new layer structure."

git push origin refactor/phase0-lint-setup

gh pr create \
  --base main \
  --head refactor/phase0-lint-setup \
  --title "chore: Lint 設定の更新（Clean Architecture 対応）"
```

---

## 🧪 テスト

```bash
# すべてのチェックが通ることを確認
bun run lint
bun run typecheck
bun test
```

---

**作成日**: 2026-01-15  
**最終更新**: 2026-01-15

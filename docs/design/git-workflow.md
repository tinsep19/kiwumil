# Git Workflow

## ブランチ戦略

このプロジェクトでは、`main` ブランチへの直接 push を禁止しています。

### ワークフロー

1. **機能ブランチを作成**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   # or
   git checkout -b docs/your-doc-update
   ```

2. **変更をコミット**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. **ブランチをプッシュ**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **PR を作成**
   ```bash
   gh pr create --base main --head feature/your-feature-name
   ```

5. **マージ後、ローカルの main を更新**
   ```bash
   git checkout main
   git pull origin main
   ```

## ブランチ命名規則

- `feature/*` - 新機能
- `fix/*` - バグ修正
- `docs/*` - ドキュメント更新
- `refactor/*` - リファクタリング
- `test/*` - テスト追加・修正

## 保護設定

### Git Hook

`.git/hooks/pre-push` により、main ブランチへの直接 push が防止されています。

もし誤って main で作業してしまった場合：
```bash
# 現在の変更を新しいブランチに移動
git checkout -b feature/my-feature
git push origin feature/my-feature
```

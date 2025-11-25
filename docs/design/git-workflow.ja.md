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

## 自動公開

### GitHub Packages への自動公開

main ブランチへのマージ時に、GitHub Actions が自動的に GitHub Package Registry へパッケージを公開します。

**ワークフロー**: `.github/workflows/publish.yml`

- **トリガー**: main ブランチへの push
- **権限**: contents:read, packages:write
- **処理内容**:
  1. Bun のセットアップ（GitHub Package Registry 向けに認証設定）
  2. 依存関係のインストール
  3. ビルド（`prepublishOnly` スクリプトで自動実行）
  4. GitHub Packages への公開

**パッケージ情報**:
- パッケージ名: `@tinsep19/kiwumil`
- レジストリ: `https://npm.pkg.github.com/`
- アクセス: public

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

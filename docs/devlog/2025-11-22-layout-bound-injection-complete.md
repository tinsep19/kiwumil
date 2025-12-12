# 2025-11-22: LayoutBound Injection リファクタリング完了

## 概要
SymbolBase と ContainerSymbolBase における LayoutBound の immutable 注入と LayoutConstraintBuilder の統合を完了しました。

## 実施内容

### 主な変更
**src/kiwi/layout_constraints.ts**
- `LayoutConstraints.withSymbol` メソッドを修正
- シンボルオブジェクトが渡された場合に `symbol.ensureLayoutBounds(builder)` を呼び出すように変更
- これにより、シンボル側で `buildLayoutConstraints(builder)` をオーバーライドして固有の制約を追加可能に

### 既存実装の確認
以下の実装は既にコードベースに存在していることを確認：

1. **SymbolBase**
   - layoutBounds を constructor で注入（immutable）
   - ensureLayoutBounds/buildLayoutConstraints メソッド実装済み
   - type-only import で LayoutConstraintBuilder を使用

2. **ContainerSymbolBase**
   - constructor で layout.variables.createBound(id) を実行
   - super() で LayoutBound を渡す
   - getContentLayoutBounds() 提供

3. **Plugin (core/uml)**
   - すべてのファクトリで layout.variables.createBound(symbolId) を実行
   - シンボルコンストラクタに bound を渡す

## 動作フロー
1. `LayoutConstraints.withSymbol(symbol, type, build)` 呼び出し
2. `LayoutConstraintBuilder` 生成
3. ユーザー定義の `build(builder)` 実行
4. **新機能**: `symbol.ensureLayoutBounds(builder)` 呼び出し
5. シンボル側で `buildLayoutConstraints(builder)` 実行
6. すべての制約を一括記録

## 影響範囲
以下の既存呼び出しが自動的に `ensureLayoutBounds(builder)` を実行：
- `LayoutContext.applyMinSize`
- `LayoutContext.anchorToOrigin`
- `ContainerSymbolBase.applyContainerConstraints`

## テスト結果
- ✅ TypeScript 型チェック: エラーなし
- ✅ ビルド: 成功
- ✅ Linter: 成功（既存警告のみ）
- ✅ CodeQL セキュリティチェック: 問題なし

## 後方互換性
- 既存コードは変更なしで動作
- 新機能は opt-in（buildLayoutConstraints オーバーライド時のみ）
- 型定義変更なし

## 次のステップ
- サブクラスで buildLayoutConstraints をオーバーライドして、シンボル固有の制約を追加可能
- 必要に応じてドキュメントを更新

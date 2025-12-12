# 2025-11-19 Grid/Figure Builder 実装

## 実装内容

hint APIにGrid/Figure Builderを追加しました。ユーザーの直感に基づく fluent-style API です。

### 追加したAPI

```typescript
// Grid: 矩形配置
hint.grid(container)
  .enclose([[a, b], [c, d]] as const)
  .gap(10)
  .layout()

// Figure: 非矩形配置  
hint.figure(container)
  .enclose([[a, b], [c]] as const)
  .gap(10)
  .align('center')
  .layout()
```

### 実装したファイル

1. **src/dsl/matrix_utils.ts** - 矩形検証ユーティリティ
   - `isRectMatrix()` 関数
   - TypeScript型レベルの矩形検証

2. **src/dsl/grid_builder.ts** - GridBuilder クラス
   - 矩形行列（N×M）の配置をサポート
   - `.enclose()` / `.gap()` / `.padding()` / `.layout()` メソッド

3. **src/dsl/figure_builder.ts** - FigureBuilder クラス
   - 非矩形配置をサポート
   - `.enclose()` / `.gap()` / `.align()` / `.padding()` / `.layout()` メソッド

4. **src/dsl/hint_factory.ts** - HintFactory 拡張
   - `hint.grid()` メソッド追加
   - `hint.figure()` メソッド追加
   - `getLayoutContext()` / `getSymbols()` ヘルパー追加

5. **src/kiwi/layout_constraints.ts** - LayoutConstraints 拡張
   - `encloseGrid()` メソッド: Grid配置の制約生成
   - `encloseFigure()` メソッド: Figure配置の制約生成
   - プライベートヘルパー:
     - `createArrangeHorizontalConstraints()`
     - `createArrangeVerticalConstraints()`
     - `createAlignCenterXConstraints()`
     - `createAlignRightConstraints()`

6. **tests/grid_figure_builder.test.ts** - テストスイート
   - Matrix Utils テスト (5件)
   - Grid Builder テスト (5件)
   - Figure Builder テスト (6件)
   - 合計16テスト、全て通過 ✅

### Guide API との一貫性

```typescript
// Guide API パターン
hint.createGuideY()
  .alignBottom(user, admin)
  .alignTop(screen, server)
  .arrange()

// Grid/Figure Builder パターン
hint.grid(container)
  .enclose([[a, b], [c, d]])
  .gap(10)
  .layout()
```

**共通**: 型指定 → 対象指定 → オプション → 適用

### 設計の特徴

| 観点 | Grid Builder | Figure Builder |
|------|--------------|----------------|
| 用途 | 矩形行列（N×M） | 非矩形配置 |
| gap設定 | row/col 別々 | row のみ |
| alignment | なし | left/center/right |
| 検証 | 矩形検証あり | なし |

### テスト結果

```
✓ 66 tests pass (all existing + 16 new)
✓ 0 tests fail
✓ TypeScript compilation success
✓ Type tests pass
```

### 次のステップ

- [ ] ドキュメント更新
- [ ] example 追加
- [ ] padding サポートの実装（将来）

## 設計ドキュメント

詳細は以下を参照:
- `docs/draft/2025-11-19-hint_grid_figure_builder.md`
- `docs/draft/2025-11-19-theme-layout-separation.md` (将来の拡張)

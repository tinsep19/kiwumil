[日本語](hint-factory-placement.ja.md) | English

# HintFactory の配置と layout hint の拡張性に関する設計メモ

目的
- HintFactory（src/dsl/hint_factory.ts）の現在の配置と、layout hint（layout/hint 以下）の拡張性に関する設計判断を明文化する。
- 将来の変更（移動、拡張）時の判断基準と実務的手順を残す。

結論（要旨）
- 現状は src/dsl/hint_factory.ts に置くのが妥当。理由は DSL 層の API（ユーザーが hint を記述する窓口）としての責務が明確であり、既存のインポート／テスト構成や循環依存回避策と整合しているため。
- layout/hint 以下（src/kiwi/hint）にはヒントの具象 Builder 実装（GridBuilder, FigureBuilder, GuideBuilderImpl 等）を置くのが妥当。
- ただし将来的な拡張要件に備えて、小さくて互換性を壊さない拡張ポイント（metadata や handler registry の余地）を残すことを推奨する。

現状コード参照（代表）
- HintFactory: src/dsl/hint_factory.ts
  - https://github.com/tinsep19/kiwumil/blob/8207ee5d694964ca96e54646308b04302c6c424a/src/dsl/hint_factory.ts
- GridBuilder: src/kiwi/hint/grid_builder.ts
  - https://github.com/tinsep19/kiwumil/blob/8207ee5d694964ca96e54646308b04302c6c424a/src/kiwi/hint/grid_builder.ts
- FigureBuilder: src/kiwi/hint/figure_builder.ts
  - https://github.com/tinsep19/kiwumil/blob/8207ee5d694964ca96e54646308b04302c6c424a/src/kiwi/hint/figure_builder.ts

設計理由（詳細）
- 層の責務分離
  - HintFactory は LayoutContext と Symbols を受け取り、DSL から呼ばれる「hint API」を提供するファサード的役割を果たしている。これは DSL 層に属する責務であり、src/dsl に置くことで責務分離が明確になる。
- 既存のインポート／テストとの整合
  - テストや他の DSL コードが src/dsl/hint_factory を直接参照しているため、移動は参照の一括更新を伴う。現状のままにしておくことで互換性を保てる。
- 循環依存の回避
  - layout/hint/* の方は HintFactory を型のみ参照（`import type { HintFactory }`）しており、実行時循環を避ける設計になっている。HintFactory を layout 側に移すと import の向きや値/型インポートを見直す必要があり、注意が必要。

拡張性に関する方針（平衡的な案）
- 当面は非拡張（固定メソッド群）でシンプルに保つ。
- 将来に備えた小さな拡張ポイントを追加する（互換性を壊さない範囲で）：
  1. LayoutHint オブジェクトに optional metadata?: Record<string, unknown> を追加（既存コードは無視して動くようにする）。
  2. LayoutContext に optional handler registry を用意し、将来プラグインが handler を登録できるようにする（未登録の hint は無害スキップ）。
  3. 未知の kind を安全に無視し、開発時には警告を出すロギングを入れる。
- これらは大きな API 変更を伴わず段階的に導入可能。

いつ移動を検討するか（トリガー）
- 外部プラグイン／テーマで独自 hint を追加する予定が生じたとき
- 要素種別ごとに大量の専用ヒントが必要になり、ヒントの集合が肥大化してきたとき
- リファクタで DSL と layout 層の境界を再定義する大きな作業を行うと判断したとき

移行（ファイル移動）チェックリスト
1. 影響調査
   - リポジトリ全体で `hint_factory` を参照している箇所を列挙する（例: rg/git grep）。
2. 一時ブランチ作成
   - git checkout -b feat/move-hint-factory
3. ファイル移動
   - mkdir -p src/kiwi/hint (移動先)
   - git mv src/dsl/hint_factory.ts src/kiwi/hint/hint_factory.ts
4. インポート更新
   - 参照しているファイルの import を更新（型のみ import の箇所は `import type` のまま維持）。
5. バレル／再エクスポート（互換性）
   - 必要なら src/dsl/index.ts に旧パスをエクスポートする薄いラッパーを置き、一時互換を保つ。
6. ビルド・テスト・リンタ実行
   - pnpm/yarn/npm run build
   - pnpm/yarn/npm test
   - eslint/tsc の警告・エラーを解消
7. 循環依存チェック
   - madge や depcruise によるサイクル検査
8. CI 実行・PR 作成
   - CI が通ることを確認してから Pull Request を作成

短いコード例（拡張ポイント）
- metadata を受ける hint の形（擬似）
```ts
type LayoutHint = {
  kind: string
  params?: Record<string, unknown>
  metadata?: Record<string, unknown> // 拡張ポイント
}
```

- handler registry の形（擬似）
```ts
class LayoutContext {
  private hintHandlers = new Map<string, (hint: LayoutHint) => void>()

  registerHintHandler(kind: string, handler: (hint: LayoutHint) => void) {
    this.hintHandlers.set(kind, handler)
  }

  applyHint(hint: LayoutHint) {
    const handler = this.hintHandlers.get(hint.kind)
    if (handler) {
      handler(hint)
    } else {
      // 未知の kind は無視（または警告ログ）
      console.warn(`Unknown hint kind: ${hint.kind}`)
    }
  }
}
```

まとめ
- 現在の配置（HintFactory → src/dsl, Builders → src/kiwi/hint）は合理的で問題ない。
- 拡張性は非拡張（固定）を基本としつつ、小さな拡張ポイント（metadata, handler registry）を段階的に追加する方針が推奨される。
- 移動が必要になった場合は、上記チェックリストに従って慎重に作業すること。

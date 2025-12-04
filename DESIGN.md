# DESIGN: Hints / Symbols / HintFactory の設計（草案）

日付: 2025-12-04  
作成者: tinsep19 チーム向け草案

## 背景と目的
Guide を作成する際に、Guide 側で LayoutVariable を直接扱いたい（制約を直接作成できるようにしたい）という要望がありました。これに合わせて以下の設計方針を採用します：

- LayoutSolver の既存 API を変更しない（新メソッドは追加しない）。
- Hints は内部的に既存の LayoutSolver API を使って LayoutVariable（＝ソルバが管理する変数）を生成するが、生成された変数を Symbols に自動登録しない。
- HintFactory は LayoutContext を保持せず Hints を保持する。Guide は Hints を経由して変数を得て、その変数と既存 Symbols が管理する Symbol との間で制約を作る。
- Symbols は旧 LayoutVariables と Variables の責務を一つに併合する（別ハンドル型は定義しない）。

この設計は、Guide が変数を直接操作できる柔軟性を確保しつつ、既存のソルバ API 互換性を保持して影響範囲を限定することをねらいとします。

---

## 主要コンポーネントと責務

### LayoutSolver
- 既存の変数作成・制約作成・解法 API をそのまま使う（変更は行わない）。
- 変数（LayoutVariable）と制約（Constraint）の実体を管理する（所有者）。
- Constraint に creator/tag 等のメタ情報を付与できると望ましい（管理・削除が容易になる）。

### Symbols（旧: LayoutVariables + Variables の併合）
- Symbol 名、Bounds、関連する既存 Symbol に関するユーティリティ（align, pin, setMin/Max 等）を管理する。
- Symbols は solver が管理する変数への参照を持つことはあるが、Hints が作った変数を自動的に登録・管理はしない。
- Symbols は Symbol 間の補助的な制約生成メソッドを提供する（ただし Hints の変数は登録対象外）。

### Hints
- Hints.createHintVariable(...) などの API で内部的に既存 LayoutSolver の API を呼んで LayoutVariable を生成する。
- 生成された変数は Hints のスコープ（その Hint の生成物）として保持する。Symbols へは登録しない。
- Hint 固有の制約は solver に登録し、その制約 ID 等を Hints が保持する。
- Hint の破棄（Hints.disposeHintVariable(...)）では、Hints が管理する制約を solver から削除する責務を持つ。

### HintFactory
- HintFactory は LayoutContext を保持しない。代わりに Hints インスタンスを注入して保持する。
- Guide からのリクエストを受け、Hints を使って LayoutVariable を作成し、その変数オブジェクトを Guide に渡す。
- Guide は受け取った変数を使って、必要な制約を自ら生成（solver API を呼ぶ）して Symbols が管理する Symbol とつなぐ。

### Guide（利用者側の振る舞い）
- HintFactory から渡された LayoutVariable（オブジェクト参照）を受け取り、必要に応じて Symbols の Symbol（名前で取得）と制約を作成する。
- Guide が作成した制約のライフサイクル管理（削除タイミング）は Guide 側が明確に持つ。

---

## 生成・接続フロー（例）
1. Guide が HintFactory に対してヒント（例:「アンカー変数が欲しい」）を要求する。
2. HintFactory が Hints.createHintVariable を呼ぶ。
3. Hints は既存の LayoutSolver API を呼び、必要な LayoutVariable を生成する。必要なら Hint 固有の補助制約を solver に登録する。
4. Hints は生成した LayoutVariable を Guide に返す（Symbols には登録しない）。
5. Guide は Symbols.get("symbolX") で既存 Symbol を参照し、solver の制約作成 API を呼んで Symbol と Hints が作った LayoutVariable を結ぶ制約を作る。
6. Guide の不要化時に、Guide は自分が作成した制約を削除し、Hints.disposeHintVariable を呼んで Hints 側のクリーンアップを行う。

---

## API 注意点（設計上の約束）
- LayoutSolver の API 変更は行わない。Hints は既存 API をそのまま利用する。
- Constraint の生成 API は「変数オブジェクト参照」を受け入れることが前提。もし現実装が名前ベースのみであれば、ラッパーを用意する必要あり。
- Constraint に creator/tag 情報を付加するオプションがあると管理が容易（どの Hint/Guide が生成したか追跡可能）。

---

## 命名・スコープポリシー
- Hints が生成する変数に名前付けする場合は自動プレフィックスを付与する（例: hint:anchor_x_1234）。
- Symbols が管理する変数名と衝突しないように注意する。
- Guide が作成する制約には、作成元を示すメタデータ（creator/tag）を付与することを推奨する。

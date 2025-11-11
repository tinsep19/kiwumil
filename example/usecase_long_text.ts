import { Diagram, UMLPlugin } from "../src/index"

Diagram
  .use(UMLPlugin)
  .build("Long Text Usecase Test", (element, relation, hint) => {
    // 非常に長いテキストのユースケース
    element.usecase("これは非常に長いテキストを含むユースケース名でテキストの折り返しやはみ出しをテストするためのものです")
    
    // 長い英語テキスト
    element.usecase("This is a very long usecase name with English text to test text wrapping and overflow behavior in the diagram")
    
    // 通常の長さのユースケース（比較用）
    element.usecase("Normal Usecase")
    
    // 中程度の長さ
    element.usecase("ユーザー認証システムにログインする")
    
    // 極端に長いテキスト
    element.usecase("極端に長いテキストのケース：このユースケースはシステム内で複数の処理を実行し、データベースへのアクセス、外部APIとの連携、そして最終的な結果の表示までを含む複雑な処理フローを表現しています")
  })
  .render("example/usecase_long_text.svg")

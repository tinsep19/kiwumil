// example/web_rendering_test.ts
// このファイルは import.meta を使った自動パス生成のテスト用です

import { TypedDiagram, UMLPlugin } from "../src/index"

TypedDiagram("Web Rendering Test")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    const user = el.uml.actor("User")
    const system = el.uml.actor("System")
    
    hint.arrangeHorizontal(user, system)
  })
  .render(import.meta)  // 自動的に example/web_rendering_test.svg に保存

import { TypeDiagram } from "../src/index.ts"

TypeDiagram("Grid of arrange")
.build((el, rel, hint) => {
  const [ k, i1, w, u, m, i2, l]
    = ["k","i","w","u","m","i","l"].map(c => el.core.circle(c))
  hint.arrangeHorizontal(k, i1, w, u, m, i2, l)
  hint.alignCenterY(k, i1, w, i2)
  hint.alignBottom(u, m, l)
  // uを下段に配置するため、kの下に配置
  hint.arrangeVertical(k, u)
  
}).render(import.meta)

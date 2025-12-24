import { TypeDiagram } from "../src/index"

TypeDiagram("Guide builder sample")
  .build(({ el, rel: _rel, hint }) => {
    const [k, i1, w, u, m, i2, l] = ["k", "i", "w", "u", "m", "i", "l"].map(c =>
      el.core.circle(c)
    )

    hint
      .guideY()
      .alignBottom(k, i1, w)
      .alignTop(u, m)
      .alignBottom(i2)
      .alignTop(l)
      .arrange()
  })
  .render(import.meta)

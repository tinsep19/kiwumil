import { IconRegistry, SvgGenerator } from "../src/icon"

describe("SvgGenerator", () => {
  test("emit document includes defs and body", () => {
    const reg = new IconRegistry()
    reg.register("pl", "i1", '<path d="M1"/>')
    const gen = new SvgGenerator(reg)
    const doc = gen.emit_document("<g></g>")
    expect(doc).toContain("<svg")
    expect(doc).toContain("<defs>")
    expect(doc).toContain("<g></g>")
  })
})

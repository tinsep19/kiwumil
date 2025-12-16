import { IconRegistry } from "../src/icon/icon_registry"

describe("IconRegistry", () => {
  test("register and emit symbols", () => {
    const reg = new IconRegistry()
    reg.register("p", "ic", '<path d="M0"/>')
    const out = reg.emit_symbols()
    expect(out).toContain("<defs>")
    expect(out).toContain('<symbol id="p-ic">')
    expect(out).toContain('<path d="M0"/>')
  })

  test("mark_usage ensures symbol exists", () => {
    const reg = new IconRegistry()
    const id = reg.mark_usage("p", "missing")
    expect(id).toBe("p-missing")
    const out = reg.emit_symbols()
    expect(out).toContain("p-missing")
  })
})

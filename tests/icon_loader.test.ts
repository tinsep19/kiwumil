import { IconSet } from "../src/icon"

describe("IconLoader (stub)", () => {
  test("register and list", () => {
    const iconSet = new IconSet("myplugin", import.meta.url)
    iconSet.register("icon1", "icons/icon1.svg")
    iconSet.register("icon2", "icons/icon2.svg")
    const list = iconSet.list()
    expect(list).toContain("icon1")
    expect(list).toContain("icon2")
  })

  test("register returns list for registered icon", () => {
    const iconSet = new IconSet("pkg", import.meta.url)
    iconSet.register("a", "icons/a.svg")
    const list = iconSet.list()
    expect(list).toContain("a")
  })
})

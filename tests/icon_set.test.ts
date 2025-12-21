import { describe, test, expect } from "bun:test"
import { IconSet } from "../src/icon/icon_set"
import { IconLoader } from "../src/icon/icon_loader"

describe("IconSet", () => {
  describe("register", () => {
    test("should register an icon", () => {
      const iconSet = new IconSet("myplugin", import.meta.url)
      iconSet.register("icon1", "icons/icon1.svg")
      const list = iconSet.list()
      expect(list).toContain("icon1")
    })

    test("should register multiple icons", () => {
      const iconSet = new IconSet("myplugin", import.meta.url)
      iconSet.register("icon1", "icons/icon1.svg")
      iconSet.register("icon2", "icons/icon2.svg")
      iconSet.register("icon3", "icons/icon3.svg")
      const list = iconSet.list()
      expect(list).toHaveLength(3)
      expect(list).toContain("icon1")
      expect(list).toContain("icon2")
      expect(list).toContain("icon3")
    })

    test("should throw error on duplicate registration", () => {
      const iconSet = new IconSet("myplugin", import.meta.url)
      iconSet.register("icon1", "icons/icon1.svg")
      expect(() => {
        iconSet.register("icon1", "icons/icon1-duplicate.svg")
      }).toThrow('Icon "icon1" is already registered in plugin "myplugin"')
    })
  })

  describe("list", () => {
    test("should return empty array for no registrations", () => {
      const iconSet = new IconSet("myplugin", import.meta.url)
      expect(iconSet.list()).toEqual([])
    })

    test("should return all registered icon names", () => {
      const iconSet = new IconSet("pkg", import.meta.url)
      iconSet.register("a", "icons/a.svg")
      iconSet.register("b", "icons/b.svg")
      const list = iconSet.list()
      expect(list).toHaveLength(2)
      expect(list).toContain("a")
      expect(list).toContain("b")
    })
  })

  describe("createLoader", () => {
    test("should create IconLoader for registered icon", () => {
      const iconSet = new IconSet("myplugin", import.meta.url)
      iconSet.register("icon1", "icons/icon1.svg")
      const loader = iconSet.createLoader("icon1")
      expect(loader).toBeInstanceOf(IconLoader)
    })

    test("should throw error for unregistered icon", () => {
      const iconSet = new IconSet("myplugin", import.meta.url)
      expect(() => {
        iconSet.createLoader("nonexistent")
      }).toThrow('Icon "nonexistent" is not registered in plugin "myplugin"')
    })

    test("should create different loaders for different icons", () => {
      const iconSet = new IconSet("myplugin", import.meta.url)
      iconSet.register("icon1", "icons/icon1.svg")
      iconSet.register("icon2", "icons/icon2.svg")
      const loader1 = iconSet.createLoader("icon1")
      const loader2 = iconSet.createLoader("icon2")
      expect(loader1).toBeInstanceOf(IconLoader)
      expect(loader2).toBeInstanceOf(IconLoader)
      expect(loader1).not.toBe(loader2)
    })
  })
})

describe("IconLoader (refactored)", () => {
  test("should be instantiated with plugin, name, baseUrl, and relPath", () => {
    const loader = new IconLoader("myplugin", "icon1", import.meta.url, "icons/icon1.svg")
    expect(loader).toBeInstanceOf(IconLoader)
  })

  test("should have load_sync method", () => {
    const loader = new IconLoader("myplugin", "icon1", import.meta.url, "icons/icon1.svg")
    expect(typeof loader.load_sync).toBe("function")
  })
})

describe("IconSet + IconLoader integration", () => {
  test("should work together to register and create loaders", () => {
    const iconSet = new IconSet("testplugin", import.meta.url)
    iconSet.register("test1", "icons/test1.svg")
    iconSet.register("test2", "icons/test2.svg")
    
    const list = iconSet.list()
    expect(list).toHaveLength(2)
    
    const loader1 = iconSet.createLoader("test1")
    const loader2 = iconSet.createLoader("test2")
    
    expect(loader1).toBeInstanceOf(IconLoader)
    expect(loader2).toBeInstanceOf(IconLoader)
  })

  test("should maintain separate registries for different plugins", () => {
    const iconSet1 = new IconSet("plugin1", import.meta.url)
    const iconSet2 = new IconSet("plugin2", import.meta.url)
    
    iconSet1.register("icon", "icons/plugin1-icon.svg")
    iconSet2.register("icon", "icons/plugin2-icon.svg")
    
    expect(iconSet1.list()).toContain("icon")
    expect(iconSet2.list()).toContain("icon")
    
    // Both should create loaders without conflict
    const loader1 = iconSet1.createLoader("icon")
    const loader2 = iconSet2.createLoader("icon")
    
    expect(loader1).toBeInstanceOf(IconLoader)
    expect(loader2).toBeInstanceOf(IconLoader)
  })
})

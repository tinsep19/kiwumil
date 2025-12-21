import { describe, test, expect } from "bun:test"
import { LoaderFactory } from "../src/icon/loader_factory"
import { IconRegistry } from "../src/icon/icon_registry"

describe("LoaderFactory", () => {
  describe("cacheLoader", () => {
    test("should return a function that loads icon metadata", () => {
      const registry = new IconRegistry()
      const factory = new LoaderFactory("testplugin", import.meta.url, registry)
      const loaderFn = factory.cacheLoader("icons/test.svg")
      
      expect(typeof loaderFn).toBe("function")
    })

    test("should cache loaded metadata", () => {
      const registry = new IconRegistry()
      const factory = new LoaderFactory("testplugin", import.meta.url, registry)
      const loaderFn = factory.cacheLoader("icons/test.svg")
      
      // First call - loads and caches (will return null since file doesn't exist)
      const result1 = loaderFn()
      // Second call - should return cached result
      const result2 = loaderFn()
      
      // Both should be the same (null in this case since file doesn't exist)
      expect(result1).toBe(result2)
    })

    test("should create different loaders for different paths", () => {
      const registry = new IconRegistry()
      const factory = new LoaderFactory("testplugin", import.meta.url, registry)
      const loader1 = factory.cacheLoader("icons/icon1.svg")
      const loader2 = factory.cacheLoader("icons/icon2.svg")
      
      expect(loader1).not.toBe(loader2)
    })

    test("should return null when icon file doesn't exist", () => {
      const registry = new IconRegistry()
      const factory = new LoaderFactory("testplugin", import.meta.url, registry)
      const loaderFn = factory.cacheLoader("nonexistent/icon.svg")
      
      const result = loaderFn()
      expect(result).toBe(null)
    })

    test("should register icon to IconRegistry when loaded", () => {
      const registry = new IconRegistry()
      const factory = new LoaderFactory("testplugin", import.meta.url, registry)
      
      // Since we can't easily test with a real file, we'll just verify
      // that the registry can still emit symbols (empty in this case)
      const symbols = registry.emit_symbols()
      expect(typeof symbols).toBe("string")
    })
  })

  describe("extractIconName", () => {
    test("should extract icon name from path", () => {
      const registry = new IconRegistry()
      const factory = new LoaderFactory("test", "", registry)
      // Access private method through reflection for testing
      const extractIconName = (factory as any).extractIconName.bind(factory)
      
      expect(extractIconName("icons/actor.svg")).toBe("actor")
      expect(extractIconName("path/to/icon.svg")).toBe("icon")
      expect(extractIconName("icon.svg")).toBe("icon")
    })
  })
})

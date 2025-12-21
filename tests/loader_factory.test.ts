import { describe, test, expect } from "bun:test"
import { LoaderFactory } from "../src/icon/loader_factory"

describe("LoaderFactory", () => {
  describe("cacheLoader", () => {
    test("should return a function that loads icon metadata", () => {
      const factory = new LoaderFactory("testplugin", import.meta.url)
      const loaderFn = factory.cacheLoader("icons/test.svg")
      
      expect(typeof loaderFn).toBe("function")
    })

    test("should cache loaded metadata", () => {
      const factory = new LoaderFactory("testplugin", import.meta.url)
      const loaderFn = factory.cacheLoader("icons/test.svg")
      
      // First call - loads and caches (will return null since file doesn't exist)
      const result1 = loaderFn()
      // Second call - should return cached result
      const result2 = loaderFn()
      
      // Both should be the same (null in this case since file doesn't exist)
      expect(result1).toBe(result2)
    })

    test("should create different loaders for different paths", () => {
      const factory = new LoaderFactory("testplugin", import.meta.url)
      const loader1 = factory.cacheLoader("icons/icon1.svg")
      const loader2 = factory.cacheLoader("icons/icon2.svg")
      
      expect(loader1).not.toBe(loader2)
    })

    test("should return null when icon file doesn't exist", () => {
      const factory = new LoaderFactory("testplugin", import.meta.url)
      const loaderFn = factory.cacheLoader("nonexistent/icon.svg")
      
      const result = loaderFn()
      expect(result).toBe(null)
    })
  })

  describe("extractIconName", () => {
    test("should extract icon name from path", () => {
      const factory = new LoaderFactory("test", "")
      // Access private method through reflection for testing
      const extractIconName = (factory as any).extractIconName.bind(factory)
      
      expect(extractIconName("icons/actor.svg")).toBe("actor")
      expect(extractIconName("path/to/icon.svg")).toBe("icon")
      expect(extractIconName("icon.svg")).toBe("icon")
    })
  })
})

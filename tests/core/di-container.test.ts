import { describe, it, expect, beforeEach } from "vitest"
import { DiContainer } from "../../src/core/di-container"

describe("DiContainer", () => {
  let container: DiContainer

  beforeEach(() => {
    container = new DiContainer()
  })

  describe("registerSingleton", () => {
    it("should register and resolve singleton service", () => {
      const service = { name: "TestService" }
      container.registerSingleton("test", service)

      const resolved = container.resolve("test")
      expect(resolved).toBe(service)
    })

    it("should throw error when registering duplicate singleton", () => {
      container.registerSingleton("test", {})

      expect(() => {
        container.registerSingleton("test", {})
      }).toThrow("Service 'test' is already registered")
    })

    it("should return same instance on multiple resolve calls", () => {
      const service = { name: "TestService" }
      container.registerSingleton("test", service)

      const resolved1 = container.resolve("test")
      const resolved2 = container.resolve("test")

      expect(resolved1).toBe(resolved2)
      expect(resolved1).toBe(service)
    })
  })

  describe("registerFactory", () => {
    it("should register and resolve factory service", () => {
      let callCount = 0
      container.registerFactory("test", () => {
        callCount++
        return { name: "FactoryService", callCount }
      })

      const resolved = container.resolve<{ name: string; callCount: number }>("test")
      expect(resolved.name).toBe("FactoryService")
      expect(callCount).toBe(1)
    })

    it("should throw error when registering duplicate factory", () => {
      container.registerFactory("test", () => ({}))

      expect(() => {
        container.registerFactory("test", () => ({}))
      }).toThrow("Factory 'test' is already registered")
    })

    it("should cache factory result (call factory only once)", () => {
      let callCount = 0
      container.registerFactory("test", () => {
        callCount++
        return { callCount }
      })

      const resolved1 = container.resolve("test")
      const resolved2 = container.resolve("test")

      expect(resolved1).toBe(resolved2)
      expect(callCount).toBe(1) // Factory は1回だけ呼ばれる
    })
  })

  describe("resolve", () => {
    it("should throw error when resolving unregistered service", () => {
      expect(() => {
        container.resolve("nonexistent")
      }).toThrow("Service 'nonexistent' is not registered")
    })
  })

  describe("has", () => {
    it("should return true for registered singleton", () => {
      container.registerSingleton("test", {})
      expect(container.has("test")).toBe(true)
    })

    it("should return true for registered factory", () => {
      container.registerFactory("test", () => ({}))
      expect(container.has("test")).toBe(true)
    })

    it("should return false for unregistered service", () => {
      expect(container.has("nonexistent")).toBe(false)
    })
  })

  describe("clear", () => {
    it("should clear all services", () => {
      container.registerSingleton("singleton", {})
      container.registerFactory("factory", () => ({}))

      container.clear()

      expect(container.has("singleton")).toBe(false)
      expect(container.has("factory")).toBe(false)
    })
  })

  describe("dependency resolution", () => {
    it("should resolve dependencies between services", () => {
      // Base service
      container.registerSingleton("database", { name: "DB" })

      // Dependent service
      container.registerFactory("repository", () => {
        const db = container.resolve<{ name: string }>("database")
        return { db, name: "Repository" }
      })

      const repo = container.resolve<{ db: { name: string }; name: string }>("repository")
      expect(repo.name).toBe("Repository")
      expect(repo.db.name).toBe("DB")
    })
  })
})

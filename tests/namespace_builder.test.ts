// tests/namespace_builder.test.ts
import { NamespaceBuilder } from "@/dsl/namespace_builder"
import { IconRegistry } from "@/icon"
import type { DiagramPlugin } from "@/dsl/diagram_plugin"
import type { PluginIcons } from "@/dsl/namespace_types"

describe("NamespaceBuilder", () => {
  describe("buildIconNamespace", () => {
    test("should build icon namespace from plugins with createIconFactory", () => {
      const mockPlugin: DiagramPlugin = {
        name: "testplugin",
        createIconFactory(registry: IconRegistry): PluginIcons {
          const loaderFactory = registry.createLoaderFactory(this.name, import.meta)
          return {
            testIcon: () => ({ symbolId: "test-icon", width: 100, height: 100 }),
          }
        },
      }

      const registry = new IconRegistry()
      const builder = new NamespaceBuilder([mockPlugin])
      const iconNamespace = builder.buildIconNamespace(registry)

      expect(iconNamespace).toBeDefined()
      expect(iconNamespace.testplugin).toBeDefined()
      expect(iconNamespace.testplugin.testIcon).toBeDefined()
      expect(typeof iconNamespace.testplugin.testIcon).toBe("function")
    })

    test("should handle multiple plugins with createIconFactory", () => {
      const plugin1: DiagramPlugin = {
        name: "plugin1",
        createIconFactory(registry: IconRegistry): PluginIcons {
          return {
            icon1: () => ({ symbolId: "plugin1-icon1", width: 50, height: 50 }),
          }
        },
      }

      const plugin2: DiagramPlugin = {
        name: "plugin2",
        createIconFactory(registry: IconRegistry): PluginIcons {
          return {
            icon2: () => ({ symbolId: "plugin2-icon2", width: 75, height: 75 }),
          }
        },
      }

      const registry = new IconRegistry()
      const builder = new NamespaceBuilder([plugin1, plugin2])
      const iconNamespace = builder.buildIconNamespace(registry)

      expect(iconNamespace.plugin1).toBeDefined()
      expect(iconNamespace.plugin1.icon1).toBeDefined()
      expect(iconNamespace.plugin2).toBeDefined()
      expect(iconNamespace.plugin2.icon2).toBeDefined()
    })

    test("should handle plugins without createIconFactory", () => {
      const pluginWithIcon: DiagramPlugin = {
        name: "withIcon",
        createIconFactory(registry: IconRegistry): PluginIcons {
          return {
            myIcon: () => ({ symbolId: "my-icon", width: 100, height: 100 }),
          }
        },
      }

      const pluginWithoutIcon: DiagramPlugin = {
        name: "withoutIcon",
        // No createIconFactory
      }

      const registry = new IconRegistry()
      const builder = new NamespaceBuilder([pluginWithIcon, pluginWithoutIcon])
      const iconNamespace = builder.buildIconNamespace(registry)

      expect(iconNamespace.withIcon).toBeDefined()
      expect(iconNamespace.withIcon.myIcon).toBeDefined()
      // Plugin without createIconFactory should not be in the namespace
      expect(iconNamespace.withoutIcon).toBeUndefined()
    })

    test("should pass IconRegistry to plugin createIconFactory", () => {
      const registry = new IconRegistry()
      let receivedRegistry: IconRegistry | undefined

      const mockPlugin: DiagramPlugin = {
        name: "testplugin",
        createIconFactory(reg: IconRegistry): PluginIcons {
          receivedRegistry = reg
          return {}
        },
      }

      const builder = new NamespaceBuilder([mockPlugin])
      builder.buildIconNamespace(registry)

      expect(receivedRegistry).toBe(registry)
    })

    test("should return empty namespace for empty plugin list", () => {
      const registry = new IconRegistry()
      const builder = new NamespaceBuilder([])
      const iconNamespace = builder.buildIconNamespace(registry)

      expect(iconNamespace).toBeDefined()
      expect(Object.keys(iconNamespace)).toHaveLength(0)
    })
  })
})

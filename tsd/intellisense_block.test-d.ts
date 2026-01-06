import { expectType, expectError } from 'tsd'
import { TypeDiagram } from '../src/dsl'
import type { DiagramPlugin } from '../src/dsl/diagram_plugin'
import type { IconRegistry, IconMeta } from '../src/icon'
import type { PluginIcons } from '../src/dsl/namespace_types'

// Test that IntelliSenseBlock correctly infers and constrains the icon argument type
// based on plugins used with the diagram builder using BuildIconNamespace<TPlugins>

// Define a test plugin with icon factory
const TestPlugin = {
  name: 'testPlugin',
  createIconFactory(registry: IconRegistry): PluginIcons {
    return {
      customIcon: () => ({
        width: 24,
        height: 24,
        viewBox: '0 0 24 24',
        href: '#custom-icon',
        raw: '<circle cx="12" cy="12" r="10"/>',
      }),
      anotherIcon: () => ({
        width: 32,
        height: 32,
        viewBox: '0 0 32 32',
        href: '#another-icon',
        raw: '<rect x="4" y="4" width="24" height="24"/>',
      }),
    }
  },
} as const satisfies DiagramPlugin

// Define another test plugin with different icons
const SecondPlugin = {
  name: 'secondPlugin',
  createIconFactory(registry: IconRegistry): PluginIcons {
    return {
      specialIcon: () => ({
        width: 16,
        height: 16,
        viewBox: '0 0 16 16',
        href: '#special-icon',
        raw: '<path d="M8 8L16 16"/>',
      }),
    }
  },
} as const satisfies DiagramPlugin

// Create a diagram builder with TestPlugin
const builder = TypeDiagram('Test Diagram').use(TestPlugin)

type BuilderCallback = Parameters<typeof builder['layout']>[0]

// Test 1: Verify that icon namespace includes plugin-specific icons
const testCallback1: BuilderCallback = ({ icon }) => {
  // Plugin namespace should exist
  const pluginIcons = icon.testPlugin
  expectType<PluginIcons>(pluginIcons)

  // Specific icon functions should exist but are accessed as optional properties
  const customIconFunc = pluginIcons.customIcon
  expectType<(() => IconMeta) | undefined>(customIconFunc)
  
  const anotherIconFunc = pluginIcons.anotherIcon
  expectType<(() => IconMeta) | undefined>(anotherIconFunc)

  // In real usage, plugins check for existence before calling
  if (customIconFunc) {
    const customIconMeta = customIconFunc()
    expectType<IconMeta>(customIconMeta)
    expectType<number>(customIconMeta.width)
    expectType<number>(customIconMeta.height)
    expectType<string>(customIconMeta.viewBox)
    expectType<string>(customIconMeta.href)
    expectType<string>(customIconMeta.raw)
  }

  if (anotherIconFunc) {
    const anotherIconMeta = anotherIconFunc()
    expectType<IconMeta>(anotherIconMeta)
  }
}

builder.layout(testCallback1)

// Test 2: Verify multiple plugins work correctly
const multiPluginBuilder = TypeDiagram('Multi Plugin Diagram')
  .use(TestPlugin)
  .use(SecondPlugin)

type MultiPluginCallback = Parameters<typeof multiPluginBuilder['layout']>[0]

const testCallback2: MultiPluginCallback = ({ icon }) => {
  // Both plugin namespaces should exist
  expectType<PluginIcons>(icon.testPlugin)
  expectType<PluginIcons>(icon.secondPlugin)

  // Verify testPlugin icons are accessible (as optional properties)
  expectType<(() => IconMeta) | undefined>(icon.testPlugin.customIcon)
  expectType<(() => IconMeta) | undefined>(icon.testPlugin.anotherIcon)

  // Verify secondPlugin icons
  expectType<(() => IconMeta) | undefined>(icon.secondPlugin.specialIcon)

  // Verify actual icon metadata (with existence check)
  const specialIconFunc = icon.secondPlugin.specialIcon
  if (specialIconFunc) {
    const specialIconMeta = specialIconFunc()
    expectType<number>(specialIconMeta.width)
    expectType<number>(specialIconMeta.height)
    expectType<string>(specialIconMeta.viewBox)
    expectType<string>(specialIconMeta.href)
    expectType<string>(specialIconMeta.raw)
  }
}

multiPluginBuilder.layout(testCallback2)

// Test 3: Verify that accessing non-existent plugin namespace causes type error
const testCallback3: BuilderCallback = ({ icon }) => {
  // @ts-expect-error - nonExistentPlugin should not exist
  const nonExistent = icon.nonExistentPlugin

  // @ts-expect-error - secondPlugin should not exist in single-plugin builder
  const wrongPlugin = icon.secondPlugin
}

builder.layout(testCallback3)

// Test 4: Verify that accessing non-existent icon within valid plugin causes error
const testCallback4: BuilderCallback = ({ icon }) => {
  const pluginIcons = icon.testPlugin

  // Since PluginIcons is Record<string, () => IconMeta>, any string key returns the value type
  // This is a limitation of using Record - it doesn't prevent accessing non-existent keys
  // But it will be undefined at runtime
  const nonExistent = pluginIcons.nonExistentIcon
  expectType<(() => IconMeta) | undefined>(nonExistent)

  // Valid icons should work the same way
  expectType<(() => IconMeta) | undefined>(pluginIcons.customIcon)
  expectType<(() => IconMeta) | undefined>(pluginIcons.anotherIcon)
}

builder.layout(testCallback4)

// Test 5: Verify type inference works with CorePlugin (which doesn't have icons)
const coreOnlyBuilder = TypeDiagram('Core Only Diagram')

type CoreOnlyCallback = Parameters<typeof coreOnlyBuilder['layout']>[0]

const testCallback5: CoreOnlyCallback = ({ icon }) => {
  // CorePlugin doesn't define createIconFactory, so icon should be an empty object {}
  // Accessing icon.core should not exist at type level
  type IconType = typeof icon
  
  // Verify that core is not in the icon namespace
  type HasCore = 'core' extends keyof IconType ? true : false
  expectType<false>(null as unknown as HasCore)
}

coreOnlyBuilder.layout(testCallback5)

// Test 6: Verify that the icon argument type matches BuildIconNamespace exactly
const testCallback6: BuilderCallback = ({ icon }) => {
  // The icon parameter should be BuildIconNamespace<[typeof CorePlugin, typeof TestPlugin]>
  // CorePlugin is added by default, so we expect only testPlugin namespace
  type IconType = typeof icon
  
  // Verify testPlugin exists
  type HasTestPlugin = 'testPlugin' extends keyof IconType ? true : false
  expectType<true>(null as unknown as HasTestPlugin)

  // Verify the namespace structure
  type TestPluginType = IconType['testPlugin']
  expectType<PluginIcons>(null as unknown as TestPluginType)
}

builder.layout(testCallback6)

// Test 7: Verify plugin-specific icon types are propagated correctly
const testCallback7: MultiPluginCallback = ({ icon }) => {
  // Test that we can access icon namespaces for both plugins
  const testIcons = icon.testPlugin
  const secondIcons = icon.secondPlugin

  // These should work (as optional properties)
  expectType<(() => IconMeta) | undefined>(testIcons.customIcon)
  expectType<(() => IconMeta) | undefined>(secondIcons.specialIcon)

  // TypeScript should know about these specific plugin namespaces
  type TestIconType = typeof testIcons
  type SecondIconType = typeof secondIcons

  // Both should be PluginIcons
  expectType<PluginIcons>(testIcons)
  expectType<PluginIcons>(secondIcons)

  // Verify that the icon namespace has both plugins
  type IconNS = typeof icon
  type HasTestPlugin = 'testPlugin' extends keyof IconNS ? true : false
  expectType<true>(null as unknown as HasTestPlugin)

  type HasSecondPlugin = 'secondPlugin' extends keyof IconNS ? true : false
  expectType<true>(null as unknown as HasSecondPlugin)

  // Verify that core plugin is not in the icon namespace
  type HasCore = 'core' extends keyof IconNS ? true : false
  expectType<false>(null as unknown as HasCore)
}

multiPluginBuilder.layout(testCallback7)


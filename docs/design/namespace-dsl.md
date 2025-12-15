[日本語](namespace-dsl.ja.md) | English

# Namespace-Based DSL Architecture

## Overview

kiwumil creates diagrams using a type-safe DSL with namespaces for each plugin. Each plugin provides its own Symbols and Relationships, realizing an intuitive API complemented by IntelliSense.

## What is Namespace-Based DSL?

In traditional approaches, when multiple plugins provide Symbols or Relationships with the same name, name collisions could occur. In a namespace-based DSL, each plugin has its own namespace and provides Symbols and Relationships under it.

### Structure

```
el (Element Namespace)
├── core (CorePlugin)
│   ├── circle()
│   ├── rectangle()
│   └── ...
├── uml (UMLPlugin)
│   ├── actor()
│   ├── usecase()
│   └── ...
└── [plugin] (Other plugins)
    └── ...

rel (Relationship Namespace)
├── core (CorePlugin)
│   ├── arrow()
│   ├── line()
│   └── ...
├── uml (UMLPlugin)
│   ├── associate()
│   ├── extend()
│   └── ...
└── [plugin] (Other plugins)
    └── ...

icon (Icon Namespace)
├── core (CorePlugin)
│   └── [icons]
├── uml (UMLPlugin)
│   └── [icons]
└── [plugin] (Other plugins)
    └── [icons]
```

## Usage Examples

### Basic Usage

```typescript
import { TypeDiagram, UMLPlugin } from 'kiwumil'

TypeDiagram("Use Case Diagram")
  .use(UMLPlugin)
  .build(({ el, rel, hint, icon }) => {
    // Use UML Plugin namespace
    const user = el.uml.actor("User")
    const login = el.uml.usecase("Login")
    const register = el.uml.usecase("Register")
    
    rel.uml.associate(user, login)
    rel.uml.associate(user, register)
    
    hint.arrangeHorizontal(login, register)
  })
  .render("output.svg")
```

### Using CorePlugin Only

```typescript
import { TypeDiagram } from 'kiwumil'

// CorePlugin is applied by default
TypeDiagram("Simple Diagram")
  .build(({ el, rel, hint, icon }) => {
    const circle = el.core.circle("Circle")
    const rect = el.core.rectangle("Rectangle")
    
    rel.core.arrow(circle, rect)
    
    hint.arrangeHorizontal(circle, rect)
  })
  .render("output.svg")
```

### Using Multiple Plugins

```typescript
import { TypeDiagram, UMLPlugin, SequencePlugin } from 'kiwumil'

TypeDiagram("Mixed Diagram")
  .use(UMLPlugin, SequencePlugin)
  .build(({ el, rel, hint, icon }) => {
    // CorePlugin namespace (available by default)
    const circle = el.core.circle("Circle")
    
    // UMLPlugin namespace
    const actor = el.uml.actor("Actor")
    
    // SequencePlugin namespace
    const lifeline = el.sequence.lifeline("Service")
    
    // Relationships from each namespace
    rel.core.arrow(circle, actor)
    rel.uml.associate(actor, lifeline)
  })
  .render("output.svg")
```

## Architecture Features

### Complete Type Safety

The TypeScript type system is fully leveraged to achieve:

- **Access only to registered plugins**: When typing `el.`, only the namespaces of registered plugins appear in completion candidates
- **Method completion**: When typing `el.uml.`, all methods provided by the UML plugin are displayed
- **Early detection of type errors**: Non-existent methods or incorrect argument types are detected as errors at compile time
- **Type safety with SymbolId / RelationshipId**: Symbols and Relationships are identified by unique IDs and distinguished at the type level

## Plugin Interface

The Namespace-based DSL is constructed by composing namespaces provided by plugins that implement `DiagramPlugin`. Here we cover only the mechanism; details on creating plugins are consolidated in the [Plugin System documentation](./plugin-system.md).

- Each plugin has a unique `name` and is referenced as `el.{name}` / `rel.{name}`.
- Both `createSymbolFactory` and `createRelationshipFactory` are optional; only the needed one can be implemented.
- Both factories receive `Symbols` / `Relationships` instances, `Theme`, and `PluginIcons`.
- Symbol / Relationship registration uses the `Symbols.register()` / `Relationships.register()` methods.
- LayoutBounds are generated using `r.createBounds()` within the callback of `symbols.register()`.

### Reference Materials

- Complete type definition of the DiagramPlugin interface
- Implementation examples such as UMLPlugin
- Centralized management pattern using Symbols / Relationships classes

➡ All of these are explained in detail in the [Plugin System documentation](./plugin-system.md). _namespace-dsl.md_ focuses on how el/rel namespaces are assembled as a result of adding plugins.

## Namespace System Implementation

### Namespace Object Construction

`el` and `rel` are "composite namespace objects" dynamically constructed from registered plugins:

```typescript
/**
 * Namespace Builder
 * 
 * Constructs el and rel from plugin array
 */
class NamespaceBuilder<TPlugins extends readonly DiagramPlugin[]> {
  private plugins: TPlugins

  constructor(plugins: TPlugins) {
    this.plugins = plugins
  }

  buildElementNamespace(
    symbols: Symbols,
    theme: Theme,
    icons: BuildIconNamespace<TPlugins>
  ): BuildElementNamespace<TPlugins> {
    const namespace = {} as any
    for (const plugin of this.plugins) {
      if (plugin.createSymbolFactory) {
        const pluginIcons = icons[plugin.name] || {}
        namespace[plugin.name] = plugin.createSymbolFactory(symbols, theme, pluginIcons)
      }
    }
    return namespace
  }

  buildRelationshipNamespace(
    relationships: Relationships,
    theme: Theme,
    icons: BuildIconNamespace<TPlugins>
  ): BuildRelationshipNamespace<TPlugins> {
    const namespace = {} as any
    for (const plugin of this.plugins) {
      if (plugin.createRelationshipFactory) {
        const pluginIcons = icons[plugin.name] || {}
        namespace[plugin.name] = plugin.createRelationshipFactory(relationships, theme, pluginIcons)
      }
    }
    return namespace
  }
}
```

### Type Utilities

Automatically generate namespace types from plugin arrays:

```typescript
/**
 * Generate ElementNamespace type from plugin array
 */
type BuildElementNamespace<TPlugins extends readonly DiagramPlugin[]> = {
  [K in TPlugins[number]['name']]: ReturnType<
    Extract<TPlugins[number], { name: K }>['createSymbolFactory']
  >
}

/**
 * Generate RelationshipNamespace type from plugin array
 */
type BuildRelationshipNamespace<TPlugins extends readonly DiagramPlugin[]> = {
  [K in TPlugins[number]['name']]: ReturnType<
    Extract<TPlugins[number], { name: K }>['createRelationshipFactory']
  >
}
```

**Example of resulting types**:
```typescript
// When UMLPlugin and CorePlugin are registered
type ElementNamespace = {
  uml: {
    actor: (label: string) => SymbolId
    usecase: (label: string) => SymbolId
    systemBoundary: (label: string) => SymbolId
  }
  core: {
    rectangle: (label: string) => SymbolId
    ellipse: (label: string) => SymbolId
    text: (label: string) => SymbolId
  }
}

type RelationshipNamespace = {
  uml: {
    associate: (from: SymbolId, to: SymbolId) => RelationshipId
    include: (from: SymbolId, to: SymbolId) => RelationshipId
    extend: (from: SymbolId, to: SymbolId) => RelationshipId
    generalize: (from: SymbolId, to: SymbolId) => RelationshipId
  }
  core: {
    arrow: (from: SymbolId, to: SymbolId) => RelationshipId
  }
}
```

## TypeDiagram API

### Entry Point

`TypeDiagram` is the entry point for starting diagram creation. Since CorePlugin is applied by default, basic shapes (circle, rectangle, ellipse, etc.) are immediately available.

**Usage with method chaining**:
```typescript
TypeDiagram(titleOrInfo: string | DiagramInfo)
  .use(...plugins: DiagramPlugin[])     // Add plugins
  .theme(theme: Theme)                   // Set theme (optional)
  .build(({ el, rel, hint, icon }) => { ... })    // Define diagram
  .render(outputPath: string)            // Output SVG file
```

### Internal Processing Flow

Inside `TypeDiagram` and `DiagramBuilder`, the following processes occur:

1. **Initialization (`TypeDiagram()`)**
   - Create DiagramBuilder instance
   - CorePlugin is automatically registered by default

2. **Add plugins (`.use()`)**
   - Register additional plugins
   - Plugins are accumulated as an array

3. **Set theme (`.theme()`)** - Optional
   - Set custom theme

4. **Build (`.build(callback)`)**
   - Create `Symbols` and `Relationships` instances
   - Generate layout-specific `LayoutContext`
   - Generate ID for DiagramSymbol (special Symbol representing the entire diagram)
   - Use `NamespaceBuilder` to construct `icon` namespace (calling each plugin's `registerIcons`)
   - Use `NamespaceBuilder` to construct `el` and `rel`, passing `symbols`/`relationships` instances, `layout`, and `icons` to each plugin's `createSymbolFactory/RelationshipFactory`
   - Plugin-specific factories register elements via `Symbols` / `Relationships`
   - Execute user-provided callback function
   - Calls like `el.uml.actor()` or `icon.uml.iconName()` add Symbol/Relationship to Symbols/Relationships
   - Actually create DiagramSymbol and add it to the beginning of the array
   - Return renderable object

5. **Rendering (`.render()`)**
   - Apply theme: Apply theme to all Symbols and Relationships
   - Layout calculation: LayoutContext resolves constraints to determine position and size of each Symbol
   - SVG generation: Output all Symbols and Relationships as SVG
   - Output:
     - If string: Save SVG to file path
     - If `import.meta`: Automatically save to corresponding .svg path
     - If DOM Element: Set SVG to innerHTML (browser environment)

## Extensibility

Namespace DSL is extended by registering any `DiagramPlugin` in addition to the default shapes from CorePlugin. For how to create plugins themselves (class structure, ID design, TypeScript patterns, etc.), detailed procedures are available in the [Plugin System documentation](./plugin-system.md), so here we only summarize the key points of the mechanism.

- `TypeDiagram().use(MyPlugin)` adds namespaces as `el.myplugin` / `rel.myplugin` / `icon.myplugin`
- Each plugin registers Symbol/Relationship via `Symbols` / `Relationships`
- Registering icons through `registerIcons` makes them available as `icon.myplugin.iconName()`
- IDs are automatically generated within `Symbols.register()` / `Relationships.register()`
- Layout variables (`LayoutBound`) are generated with `layout.variables.createBound()` and injected into constructors
- Plugin-specific hints and size adjustments can also be applied through the same LayoutContext

**For plugin implementation methods (procedures, code examples, TypeScript techniques), please refer to [plugin-system.md](./plugin-system.md).**

## Summary

The Namespace-Based DSL Architecture achieves the following:

- ✅ **Powerful type inference**: Complete completion support with IntelliSense
- ✅ **Plugin-based**: Extensible architecture
- ✅ **Type safety**: Type-level identification with `SymbolId` / `RelationshipId` / `IconMeta`
- ✅ **Readability**: Debuggable ID naming conventions
- ✅ **Maintainability**: Clear responsibilities through namespaces
- ✅ **Extensibility**: Easy addition of new plugins
- ✅ **Intuitive API**: Natural notation like `el.namespace.method()` / `icon.namespace.iconName()`
- ✅ **Icon support**: Type-safe icon references through plugin-specific icon namespaces

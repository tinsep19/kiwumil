[日本語](plugin-system.ja.md) | English

# Plugin system

## Contents

1. Overview
2. DiagramPlugin interface
3. Icon support
4. Implementation notes & examples
5. ID naming
6. Best practices
7. Testing

---

## Overview

Kiwumil's plugin system lets you extend symbols and relationships in a modular, type-safe way. Plugins provide factories that populate the `el` / `rel` namespaces used in the DSL.

## DiagramPlugin interface

All plugins implement `DiagramPlugin`. Key points:

- `name`: plugin namespace used as `el.{name}` and `rel.{name}`.
- Optional factories: `createSymbolFactory`, `createRelationshipFactory`.
- Optional `registerIcons(icons)` for providing SVG icons to the DSL.

Example (type sketch):

```typescript
interface DiagramPlugin {
  name: string
  createSymbolFactory?: (symbols: Symbols, theme: Theme, icons: PluginIcons) => Record<string, (...args:any[]) => SymbolId>
  createRelationshipFactory?: (relationships: Relationships, theme: Theme, icons: PluginIcons) => Record<string, (...args:any[]) => RelationshipId>
  registerIcons?: (icons: Icons) => void
}
```

## Icon support

Plugins may register SVG icons via `registerIcons`. The system builds an `icon` namespace (e.g. `icon.{plugin}.{name}`) that the DSL exposes to builders. Runtime rendering collects used icons into an `IconRegistry` which emits `<symbol>` elements into `<defs>` and reuses them via `<use>`.

For detailed information about the icon system architecture, see [Icon System](icon-system.md).

Security/implementation notes:
- Plugins should register sanitized SVG; production should remove scripts/external references (SVGO or equivalent).
- `IconSet` manages icon registrations, `IconLoader` handles file loading, and `IconRegistry` emits symbols.
- The DSL passes plugin-specific `PluginIcons` into symbol/relationship factories so icons can be used when creating elements.

## Implementation notes & examples

A minimal plugin implements `name` and one or both factories; factories should call `symbols.register(plugin, name, builder)` / `relationships.register(plugin, name, builder)` and return the created id.

Example skeleton:

```typescript
export const MyPlugin: DiagramPlugin = {
  name: 'myplugin',
  createSymbolFactory(symbols, theme, icons) {
    return {
      mySymbol(label: string) {
        const symbol = symbols.register('myplugin', 'mySymbol', (symbolId, r) => {
          // create bounds, instance, characs, constraints
          return r.build()
        })
        return symbol.id
      }
    }
  }
}
```

Concrete plugin example: UMLPlugin provides `actor`, `usecase`, `systemBoundary` factories and relationships such as `associate`, `include`, etc. See plugin source for full examples.

## ID naming

IDs follow `${namespace}:${name}/${index}` (e.g. `uml:actor/0`). `Symbols` / `Relationships` generate these automatically when registering.

## Best practices

- Keep plugin factories type-safe; prefer explicit parameter types to `any` where possible.
- Use `symbols.register` / `relationships.register` rather than manual id management.
- Inject LayoutBounds/variables from builder context; avoid accessing LayoutContext directly inside symbol constructors.
- Use `registerIcons` to provide icons and consume `PluginIcons` in factories.
- Choose unique plugin `name` values (avoid `core`).

## Testing

- Unit test plugin factories by constructing `TypeDiagram().use(MyPlugin).build(...)` and assert returned ids and behavior.
- Use `tsd` tests to verify DSL type inference and namespace typing.

---

If you need the Japanese version updated to match structure, run the provided update script or request now.

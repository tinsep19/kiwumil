[日本語](icon-system.ja.md) | English

# Icon System

## Overview

The icon system provides a way for plugins to register and use SVG icons in diagrams. The system is designed with separation of concerns, where `IconSet` manages icon registrations and `IconLoader` handles single file operations.

## Architecture

### IconSet

**Purpose**: Manages icon name and path registrations for a plugin.

**Responsibilities**:
- Register icon names and their file paths
- Prevent duplicate registrations
- List all registered icon names
- Create `IconLoader` instances for specific icons

**Key Methods**:
```typescript
class IconSet {
  constructor(plugin: string, baseUrl: string)
  register(name: string, relPath: string): void
  list(): string[]
  createLoader(name: string): IconLoader
}
```

**Error Handling**:
- Throws error on duplicate icon registration
- Throws error when creating loader for unregistered icon

### IconLoader

**Purpose**: Handles single file loading and metadata parsing operations.

**Responsibilities**:
- Load SVG file content from disk
- Parse SVG metadata (viewBox, etc.)
- Return structured metadata (`IconMeta`)

**Key Methods**:
```typescript
class IconLoader {
  constructor(plugin: string, name: string, baseUrl: string, relPath: string)
  load_sync(): IconMeta
}
```

**Error Handling**:
- Throws descriptive errors for missing files
- Handles file system errors gracefully

### IconRegistry

**Purpose**: Runtime registry for collecting and emitting SVG symbols.

**Responsibilities**:
- Register icon SVG content
- Normalize symbol IDs
- Emit `<defs>` section with `<symbol>` elements

This class is separate from `IconSet`/`IconLoader` and handles runtime rendering concerns.

## Usage Flow

1. **Plugin Registration Phase**:
   ```typescript
   // Plugin registers icons during initialization
   registerIcons(icons) {
     icons.createRegistrar('myplugin', import.meta, (iconSet) => {
       iconSet.register('icon1', 'icons/icon1.svg')
       iconSet.register('icon2', 'icons/icon2.svg')
     })
   }
   ```

2. **Build Phase**:
   ```typescript
   // System creates loaders for each icon
   const iconSet = new IconSet('myplugin', baseUrl)
   iconSet.register('icon1', 'icons/icon1.svg')
   
   // Create loader for specific icon
   const loader = iconSet.createLoader('icon1')
   const meta = loader.load_sync()
   ```

3. **Render Phase**:
   ```typescript
   // IconRegistry collects all used icons
   const registry = new IconRegistry()
   registry.register('myplugin', 'icon1', svgContent)
   
   // Emit symbols in SVG output
   const defs = registry.emit_symbols()
   ```

## Design Benefits

**Separation of Concerns**:
- `IconSet`: Registry management (what icons exist)
- `IconLoader`: File operations (how to load icons)
- `IconRegistry`: Runtime symbol management (how to render icons)

**Error Prevention**:
- Duplicate registration detection
- Type-safe icon references
- Clear error messages for missing icons

**Testability**:
- Each class can be tested independently
- Integration tests verify the complete flow
- Mock file system operations easily

**Maintainability**:
- Single responsibility for each class
- Clear boundaries between concerns
- Easy to extend with new features

## Security Considerations

Plugins should register sanitized SVG content. Production deployments should:
- Remove scripts and external references (use SVGO or equivalent)
- Validate SVG structure before registration
- Sanitize file paths to prevent directory traversal

## Type Safety

The system provides full TypeScript support:
```typescript
// Type-safe icon namespace
icon.myplugin.icon1() // Returns IconMeta | null

// Type-safe registration
iconSet.register('name', 'path') // Enforces string types
```

## Migration from Old API

**Before** (single class with multiple responsibilities):
```typescript
const loader = new IconLoader('plugin', baseUrl)
loader.register('icon1', 'path1.svg')
loader.register('icon2', 'path2.svg')
const list = loader.list()
const meta = loader.load_sync('icon1')
```

**After** (separated responsibilities):
```typescript
const iconSet = new IconSet('plugin', baseUrl)
iconSet.register('icon1', 'path1.svg')
iconSet.register('icon2', 'path2.svg')
const list = iconSet.list()
const loader = iconSet.createLoader('icon1')
const meta = loader.load_sync()
```

## Testing

The icon system includes comprehensive tests:
- Unit tests for `IconSet` (registration, listing, error cases)
- Unit tests for `IconLoader` (file loading, metadata parsing)
- Integration tests (IconSet + IconLoader working together)
- Tests for duplicate registration prevention
- Tests for multiple plugin isolation

---

For Japanese documentation: [icon-system.ja.md](icon-system.ja.md)

[日本語](icon-system.ja.md) | English

# Icon System

## Overview

The icon system provides a way for plugins to register and use SVG icons in diagrams. The system uses `LoaderFactory` for efficient icon loading with caching, and automatically registers icons to `IconRegistry` for SVG symbol generation.

## Architecture

### LoaderFactory

**Purpose**: Creates and caches IconLoader instances, automatically registering loaded icons.

**Responsibilities**:
- Create IconLoader instances for specific icon files
- Cache loaded metadata to avoid redundant file reads
- Automatically register icons to IconRegistry when loaded

**Key Methods**:
```typescript
class LoaderFactory {
  constructor(plugin: string, baseUrl: string, iconRegistry: IconRegistry)
  cacheLoader(relPath: string): () => IconMeta | null
}
```

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

This class handles runtime rendering concerns and ensures only used icons are included in the final SVG output.

## Usage Flow

1. **Plugin Registration Phase**:
   ```typescript
   // Plugin defines icon factory
   createIconFactory(register: IconRegister) {
     const loaderFactory = register.createLoaderFactory(import.meta)
     return {
       icon1: loaderFactory.cacheLoader('icons/icon1.svg'),
       icon2: loaderFactory.cacheLoader('icons/icon2.svg'),
     }
   }
   ```

2. **Build Phase**:
   ```typescript
   // System creates LoaderFactory with IconRegistry
   const iconsRegistry = new IconRegistry()
   const loaderFactory = new LoaderFactory('myplugin', baseUrl, iconsRegistry)
   
   // cacheLoader returns a function that loads and caches
   const iconFn = loaderFactory.cacheLoader('icons/icon1.svg')
   const meta = iconFn() // Loads and auto-registers to IconRegistry
   ```

3. **Render Phase**:
   ```typescript
   // IconRegistry emits symbols for all registered icons
   const defs = iconsRegistry.emit_symbols()
   ```

## Design Benefits

**Automatic Registration**:
- Icons are automatically registered to IconRegistry when loaded
- No manual registration needed in diagram builder
- Only actually used icons are registered

**Efficient Caching**:
- LoaderFactory caches both IconLoader instances and loaded metadata
- Eliminates redundant file reads
- Fast repeated access to the same icon

**Separation of Concerns**:
- LoaderFactory: Caching and registration coordination
- IconLoader: File operations (how to load icons)
- IconRegistry: Runtime symbol management (how to render icons)

**Error Prevention**:
- Type-safe icon references
- Clear error messages for missing icons
- Graceful handling of load failures (returns null)

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

// Type-safe factory definition
createIconFactory(register: IconRegister): IconFactoryMap
```

## API Example

**Plugin implementation**:
```typescript
export const MyPlugin = {
  name: 'myplugin',

  createIconFactory(register: IconRegister) {
    const loaderFactory = register.createLoaderFactory(import.meta)
    return {
      icon1: loaderFactory.cacheLoader('icons/icon1.svg'),
      icon2: loaderFactory.cacheLoader('icons/icon2.svg'),
    }
  },

  createSymbolFactory(symbols, theme, icons) {
    return {
      mySymbol(label: string) {
        const iconMeta = icons.icon1() // Load icon (cached)
        // ... use iconMeta in symbol creation
      }
    }
  }
}
```

## Testing

The icon system includes comprehensive tests:
- Unit tests for `LoaderFactory` (caching, registration)
- Unit tests for `IconLoader` (file loading, metadata parsing)
- Tests for IconRegistry integration
- Tests for error cases and edge conditions

---

For Japanese documentation: [icon-system.ja.md](icon-system.ja.md)

# AI Coding Agent Instructions

## Project Overview

**Smart PDF Reader** is a pure static React + TypeScript app for interactive PDF reading with real-time word definitions. It's a **zero npm dependency** application that loads PDF.js and Tailwind from CDN.

### Core Architecture

The application follows a **state-driven component model** with clear data flow:

```
App (state manager)
  ├─ PdfViewer (PDF rendering + word detection)
  │   └─ Canvas + Text Layer (PDF.js via CDN)
  ├─ DefinitionPopup (word definitions)
  └─ UploadZone, Header, InfoSection (UI)
```

**Key Design Decision**: All state lives in `App.tsx`. Components are passed callbacks to update parent state. No context API or global state needed.

## Critical Technical Patterns

### 1. PDF.js CDN Integration (`lib/pdfLoaderCdn.ts`)

**Why this matters**: PDF.js is loaded from CDN, not npm. The application **waits** for `window.pdfjsLib` to be available.

- **Runtime Detection**: `waitForPdfJs()` polls for the global library
- **Worker Configuration**: Worker source must point to CDN URL, not relative path
- **Scale = 1**: Both canvas and text layer use `viewport({ scale: 1 })` to ensure perfect alignment
- **High-DPI Rendering**: Canvas size is multiplied by `devicePixelRatio`, context is scaled accordingly

### 2. Word Detection Strategy

**Note**: `pdfTextExtractor.ts` exists but is NOT currently used. The application instead relies on browser's native text selection API.

- **Selection-Based**: Users click/tap to select text, `window.getSelection()` extracts it
- **First Word Extraction**: Selected text split by `/[\s\p{P}]+/u` to get individual words
- **Normalization**: `normalizeWord()` removes non-alpha characters, lowercases, validates (min 2 chars)
- The `pdfTextExtractor.ts` module with coordinate transforms is preserved for potential future use

### 3. Dictionary API Caching (`lib/dictionaryApi.ts`)

**Session-based caching** prevents redundant API calls for the same word.

- **Normalization**: `normalizeWord()` removes punctuation, lowercases, validates (min 2 chars, letters only)
- **Cache Strategy**: Only cache successful lookups (404s are cached as "not found"), network errors are not cached
- **API Endpoint**: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}` returns rich phonetic/definition/example data

### 4. Word Selection & Definition Flow

**State Update Sequence** in [App.tsx](App.tsx):

1. User selects text on PDF (via click or touch)
2. `handleTextLayerClick()` / `handleTextLayerTouch()` extracts selection via `window.getSelection()`
3. First word extracted, normalized via `normalizeWord()`
4. `onWordClick(word, x, y)` → Show popup immediately with `loading: true`
5. Call `fetchDefinition(word)` asynchronously
6. Update popup with `data` when complete, or `error` on failure
7. Invalid words prevented from reaching popup

## Component-Specific Patterns

### PdfViewer.tsx (604 lines)

**Complexity**: Most complex component. Handles PDF loading, rendering, text layer setup, and text selection detection.

**Key Methods**:
- `renderPage(pageNum)`: Manages entire render lifecycle with render tokens for stale render prevention
- `renderTextLayer(page, viewport)`: Uses PDF.js `renderTextLayer()` API to create selectable text overlay
- `handleTextLayerClick()` / `handleTextLayerTouch()`: Extract selected text via `window.getSelection()`, call `onWordClick` with first word
- `cleanup()`: Cancels render tasks, cleans up PDF page object - **critical for preventing memory leaks**
- Render tokens (`renderTokenRef`) prevent stale renders from completing when page rapidly changes

**State**:
```typescript
currentPage: number          // 1-indexed, current page being viewed
numPages: number            // Total pages in PDF
renderingPage: boolean      // Prevents navigation while rendering
hasTextLayer: boolean       // Text layer successfully rendered
noTextForPage: boolean      // Current page has no extractable text (scanned PDF)
rendered: boolean           // Initial page render complete
```

**Word Detection**: Uses browser's native `window.getSelection()` to extract selected text. First word extracted via `.split(/[\s\p{P}]+/)` and normalized via `normalizeWord()`.

### DefinitionPopup.tsx (149 lines)

**Floating popup** with smart viewport edge detection. Initially positioned at `(x + 16, y + 16)` but adjusts if it would exceed viewport bounds. Shows definition, phonetic, example, or loading/error states. Includes:
- Click-outside and Escape key handlers to close
- Gradient header with word and close button
- Loading spinner, definition display, or error message

### UploadZone.tsx (78 lines)

**Native drag-and-drop** (no react-dropzone). Handles:
- Click to browse via hidden file input
- Drag-and-drop with visual feedback (`isDragging` state)
- File type validation (PDF only)
- Calls `onFileSelect(file)` on successful selection
- Hidden input with `accept="application/pdf,.pdf"`

## Developer Workflow

### No Build Required

This app runs directly from source - use a static server:
```bash
npx serve .
# or
python -m http.server 8000
```

Vite/webpack are NOT used. The `App.tsx` is loaded by HTML `<script type="module">`.

### Debugging

- **Console Logging**: All modules use `[ModuleName]` prefix for log filtering
- **TextExtractor**: Set `DEBUG = true` to see coordinate transforms and word detection
- **Browser DevTools**: Use Console to filter `[TextExtractor]` or `[Dictionary]` logs
- **PDF Rendering**: Inspect canvas dimensions vs style dimensions if text misalignment occurs

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Text layer invisible or not selectable | `renderTextLayer()` failed or not called | Check console for render errors, verify PDF has extractable text |
| Words not selectable | Text layer not rendered (scanned PDF) | App shows warning "Interactive text unavailable for this page" |
| Word popup won't appear | Invalid word (punctuation-only or <2 chars) | `normalizeWord()` filters these; check DevTools console |
| PDF.js CDN fails | Worker source wrong or network issue | Verify worker URL points to CDN, check network tab |
| Render stalls on page change | Stale render token not incremented | Check `renderTokenRef` is updated before new render |
| Text layer misaligned | viewport scale !== 1 or canvas dimensions wrong | Ensure both use `scale: 1`, verify `devicePixelRatio` scaling |

## UI Component Usage

Pre-built shadcn/ui components are available in `components/ui/`. **Always use these instead of creating new ones.**

Common imports:
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
```

See `components/ui/CLAUDE.md` for full component catalog and examples.

## File Organization Reference

```
App.tsx                    # State root, component orchestration
components/
  PdfViewer.tsx           # Complex: PDF rendering + click detection
  DefinitionPopup.tsx     # Floating definition display
  UploadZone.tsx          # Native drag-drop upload
  Header.tsx, InfoSection.tsx, UploadZone.tsx  # Simple UI
  ui/                     # Pre-built shadcn components
lib/
  pdfLoaderCdn.ts         # PDF.js CDN waiter + worker config
  pdfTextExtractor.ts     # Coordinate mapping + word detection
  dictionaryApi.ts        # API calls + session caching
  utils.ts                # General utilities
types/
  pdf.ts                  # WordRect, DefinitionData, PopupState
  global.d.ts             # Window extensions (pdfjsLib, baseUrl)
```

## Conventions

- **Naming**: Components in PascalCase, utilities in camelCase
- **Imports**: Use `@/` alias for workspace paths
- **Logging**: Prefix with `[ComponentName]` for easy filtering
- **Type Safety**: All props and state have explicit interfaces
- **Styling**: Tailwind CSS from CDN (no CSS modules)

## When Extending

1. **Add new PDF feature?** → Modify `PdfViewer.tsx`, may need coordinate math in `pdfTextExtractor.ts`
2. **Add new word lookup source?** → Add function to `dictionaryApi.ts`, extend `DefinitionData` interface
3. **Add new UI page/section?** → Create component in `components/`, export from `App.tsx`, add to state if needed
4. **Change popup layout?** → Edit `DefinitionPopup.tsx`, adjust offset if needed (`x + 16, y + 16`)

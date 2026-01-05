# Smart PDF Reader

A pure static React + TypeScript application for interactive PDF reading with word definitions. **No npm dependencies required** - uses PDF.js from CDN.

## Features

- **PDF Upload**: Native drag-and-drop or click to upload PDF files
- **Interactive Text Layer**: Click any word to see its definition
- **Dictionary API Integration**: Real-time English definitions with pronunciation and examples
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Smart Word Detection**: Intelligent hit detection with proximity threshold
- **Definition Caching**: Session-based caching to avoid redundant API calls
- **Static Hosting Ready**: No build dependencies, works from any web server

## Architecture

### Components

- **App.tsx**: Main application shell, manages state for PDF file and popup
- **Header.tsx**: Application header with logo and title
- **UploadZone.tsx**: Native drag-and-drop file upload component (no react-dropzone)
- **PdfViewer.tsx**: Canvas-based PDF renderer with word detection
- **DefinitionPopup.tsx**: Floating popup showing word definitions
- **InfoSection.tsx**: Instructions and help section

### External Libraries (CDN)

- **PDF.js v3.11.174**: Loaded from CloudFlare CDN for PDF rendering
- **Dictionary API**: Free English dictionary at dictionaryapi.dev
- **Tailwind CSS**: Loaded from CDN for styling

### Utilities

- **dictionaryApi.ts**: Fetches and caches word definitions
- **pdfTextExtractor.ts**: Extracts word positions from PDF text layer with proper coordinate mapping
- **pdfLoaderCdn.ts**: Waits for window.pdfjsLib from CDN script, configures worker

## Current Implementation

The PDF viewer uses **real PDF.js rendering from CDN** with no npm dependencies required.

### PDF.js Integration via CDN

The implementation includes:

1. **CDN Loading**: PDF.js loaded via `<script>` tag in HTML
2. **Runtime Detection**: Waits for `window.pdfjsLib` to be available
3. **Worker Configuration**: Automatically configures worker from CDN
4. **Canvas Rendering**: High-DPI rendering with context scaling for crisp display
5. **Native Text Layer**: Uses PDF.js `renderTextLayer()` for selectable, invisible text overlay
6. **Viewport Consistency**: Same viewport (scale=1) for both canvas and text layer ensures perfect alignment
7. **Selection-Based Word Detection**: Uses browser's native text selection API
8. **Cleanup & Memory Management**: Properly destroys documents, pages, and cancels render tasks

### Static Hosting

The application is fully static and works from any web server. No npm install or build process required for PDF functionality.

### How It Works

```html
<!-- HTML includes PDF.js from CDN -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
</script>
```

```typescript
// Wait for CDN script to load
const pdfjsLib = await waitForPdfJs();

// Load PDF document
const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
const page = await doc.getPage(1);

// CRITICAL: Use scale=1 viewport for both canvas and text layer
const viewport = page.getViewport({ scale: 1 });

// Set canvas dimensions for high-DPI rendering
const dpr = window.devicePixelRatio || 1;
canvas.width = viewport.width * dpr;
canvas.height = viewport.height * dpr;
canvas.style.width = `${viewport.width}px`;
canvas.style.height = `${viewport.height}px`;

// Scale context for crisp rendering
ctx.scale(dpr, dpr);

// Render to canvas with scale=1 viewport
await page.render({ canvasContext: ctx, viewport }).promise;

// Render text layer with SAME viewport (ensures alignment)
textLayerDiv.style.width = `${viewport.width}px`;
textLayerDiv.style.height = `${viewport.height}px`;
const textContent = await page.getTextContent();
await pdfjsLib.renderTextLayer({
  textContentSource: textContent,
  container: textLayerDiv,
  viewport: viewport,
  textDivs: []
}).promise;

// Handle text selection
onClick: () => {
  const selection = window.getSelection();
  const word = selection.toString().split(/[\s\p{P}]+/u)[0];
  // Fetch definition...
}
```

## Usage

1. Upload a PDF file using the upload zone
2. The first page renders with an interactive text layer
3. Click any word to see its definition
4. A popup appears with the word's meaning, pronunciation, and example usage
5. Click outside the popup or press ESC to close

### Multi-Page Navigation

For PDFs with multiple pages:

- **Next/Previous Buttons**: Use the navigation buttons in the status bar
- **Keyboard Shortcuts**:
  - `→` (Right Arrow): Next page
  - `←` (Left Arrow): Previous page
- **Page Indicator**: Shows "Page X of Y" in the header and status bar
- **Auto-close Popup**: Definition popup closes automatically when changing pages
- **Debounced Resize**: Window resize re-renders the current page after 150ms

## Mobile Support

- Adaptive tap targets (12px for touch devices, 8px for mouse)
- Touch device detection using `ontouchstart` and `maxTouchPoints`
- Responsive layout with mobile-first design
- Touch-friendly popup positioning
- Auto-adjusts popup to stay within viewport

## Error Handling

- Invalid file type detection with user-friendly messages
- CDN loading failure detection (network issues)
- PDF loading/rendering error recovery with retry option
- Text layer detection for scanned/image-based PDFs (shows warning)
- Network error recovery for Dictionary API
- 404 handling for words not found in dictionary
- Visual feedback for loading and error states
- Proper cleanup on component unmount and file change

## Performance

- Session-based definition caching (no duplicate API calls)
- Device pixel ratio scaling for crisp rendering on high-DPI displays
- Native browser text selection for word detection (no manual hit-testing)
- Render task cancellation when switching pages or files
- Debounced window resize (150ms) to avoid excessive re-renders
- Proper document/page cleanup to prevent memory leaks
- Page-by-page rendering (only current page in memory)
- No npm dependencies - all libraries loaded from CDN

## Technical Implementation Details

### Text Layer Approach

The application uses PDF.js's native `renderTextLayer()` function to create a selectable text overlay:

1. **Text Layer Rendering**: PDF.js positions text spans exactly over the canvas
2. **Invisible but Selectable**: CSS makes text transparent but selection works
3. **Native Selection API**: Uses `window.getSelection()` to get clicked word
4. **Word Extraction**: Splits selection by whitespace/punctuation, takes first word
5. **Touch Support**: Both click and touchend events supported
6. **Automatic Cleanup**: Selection cleared after word lookup to avoid highlights

### Limitations

**Scanned PDFs**: If a PDF is image-based or scanned without OCR, no text layer will be available. The app detects this and shows a warning: "Interactive text unavailable for this page. PDF may be scanned or image-based."

**Selection Behavior**: Users must click text to select it (native browser behavior). The selection is automatically cleared after word lookup to prevent lingering highlights.

### Native Drag and Drop

Replaced react-dropzone with native HTML5 drag-and-drop:
```typescript
<input type="file" accept="application/pdf,.pdf" />
// Plus onDrop, onDragOver, onDragLeave handlers
```

## Deployment

This is a static frontend application. To deploy:

1. Build the TypeScript/React code: `npm run build`
2. Serve the `dist/client` folder from any web server
3. The HTML automatically includes PDF.js from CDN
4. No server-side processing required (except for serving static files)

All PDF processing happens client-side in the browser using the CDN-loaded PDF.js library.
---

## Repository / Push

This project is intended to be published at: https://github.com/Dipendr98/padf

To push your local copy to GitHub, run the following commands locally in PowerShell (HTTPS):

```bash
# Initialize repository and commit
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Add remote and push (HTTPS)
git remote add origin https://github.com/Dipendr98/padf.git
git push -u origin main
```

Or, if you prefer SSH and have SSH keys configured:

```bash
git remote add origin git@github.com:Dipendr98/padf.git
git push -u origin main
```

If you use the GitHub CLI (`gh`) and are authenticated, you can also create and push in one step:

```bash
gh repo create Dipendr98/padf --public --source=. --remote=origin --push
```

Notes:
- Ensure `git` is installed (`git --version`) and you have permission to push to the target repo.
- If using HTTPS and you have 2FA enabled on GitHub, use a Personal Access Token (PAT) instead of your password for `git push` authentication.

---

If you want, I can also add a short `CONTRIBUTING.md` and a trimmed `CHANGELOG.md` before you push — tell me if you'd like that.
import { useEffect, useRef, useState, useCallback } from 'react';
import { loadPdfDocument } from '@/lib/pdfLoaderCdn';
import { normalizeWord } from '@/lib/dictionaryApi';

interface PdfViewerProps {
  file: File | null;
  onWordClick: (word: string, x: number, y: number) => void;
  onClosePopup: () => void;
}

export default function PdfViewer({ file, onWordClick, onClosePopup }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [renderingPage, setRenderingPage] = useState(false);
  const [hasTextLayer, setHasTextLayer] = useState(true);
  const [noTextForPage, setNoTextForPage] = useState(false);
  const [showDebug, setShowDebug] = useState(true);

  // Refs for cleanup and render tracking
  const pdfDocRef = useRef<any>(null);
  const pdfPageRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renderTokenRef = useRef<number>(0);
  const needsRerender = useRef<boolean>(false);

  // Cleanup function
  const cleanup = () => {
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {
        // Ignore cancellation errors
      }
      renderTaskRef.current = null;
    }
    if (pdfPageRef.current) {
      try {
        pdfPageRef.current.cleanup();
      } catch (e) {
        // Ignore cleanup errors
      }
      pdfPageRef.current = null;
    }
  };

  const cleanupDoc = () => {
    cleanup();
    if (pdfDocRef.current) {
      try {
        pdfDocRef.current.destroy();
      } catch (e) {
        // Ignore destroy errors
      }
      pdfDocRef.current = null;
    }
  };

  useEffect(() => {
    if (!file) {
      cleanupDoc();
      setRendered(false);
      setError(null);
      setCurrentPage(1);
      setNumPages(0);
      setHasTextLayer(false);
      setNoTextForPage(false);
      return;
    }

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setRendered(false);
      cleanupDoc();

      try {
        // Validate file type
        if (!file.type.includes('pdf')) {
          throw new Error('Invalid file type. Please upload a PDF file.');
        }

        // Read file as ArrayBuffer
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsArrayBuffer(file);
        });

        // Load PDF document from CDN-loaded PDF.js
        const pdfDoc = await loadPdfDocument(arrayBuffer);
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setCurrentPage(1);

        // Render first page
        await renderPage(1);

      } catch (err) {
        console.error('PDF loading error:', err);
        if (err instanceof Error && err.message.includes('PDF.js library failed')) {
          setError(
            'PDF.js library failed to load from CDN. Please check your internet connection and reload the page.'
          );
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      cleanupDoc();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [file]);

  const renderTextLayer = async (page: any, viewport: any) => {
    const textLayer = textLayerRef.current;
    if (!textLayer) return;

    // Hard reset: remove all children
    while (textLayer.firstChild) {
      textLayer.removeChild(textLayer.firstChild);
    }

    try {
      // Fetch text content
      const textContent = await page.getTextContent();

      console.log('[PdfViewer] Text content items:', textContent.items.length);

      // Check if page has extractable text
      if (!textContent.items || textContent.items.length === 0) {
        console.warn('[PdfViewer] No text content items found - page may be scanned');
        setNoTextForPage(true);
        setHasTextLayer(false);
        return;
      }

      // Text exists
      setNoTextForPage(false);

      // Render text layer using PDF.js built-in renderer
      if (window.pdfjsLib && window.pdfjsLib.renderTextLayer) {
        await window.pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayer,
          viewport: viewport,
          textDivs: [],
        }).promise;

        const childCount = textLayer.children.length;
        console.log('[PdfViewer] Text layer rendered with', childCount, 'children');
        setHasTextLayer(true);
      } else {
        console.warn('[PdfViewer] renderTextLayer API not available');
        setNoTextForPage(true);
        setHasTextLayer(false);
      }
    } catch (err) {
      console.error('[PdfViewer] Text layer rendering error:', err);
      setNoTextForPage(true);
      setHasTextLayer(false);
    }
  };

  const renderPage = async (pageNum: number): Promise<boolean> => {
    const canvas = canvasRef.current;
    const textLayer = textLayerRef.current;
    const pdfDoc = pdfDocRef.current;

  if (!canvas) {
    console.log(`[PdfViewer] Render aborted - missing canvas for page ${pageNum}`);
    return false;
  }

  if (!pdfDoc) {
    console.log(`[PdfViewer] Render aborted - missing pdfDoc for page ${pageNum}`);
    return false;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.log(`[PdfViewer] Render aborted - canvas.getContext('2d') returned null for page ${pageNum}`);
    return false;
  }

  console.log(`[PdfViewer] Starting render page ${pageNum} (token: ${localToken})`);

  setRenderingPage(true);
  cleanup();

  // Hard reset text layer immediately
  if (textLayer) {
    while (textLayer.firstChild) {
      textLayer.removeChild(textLayer.firstChild);
    }
      const page = await pdfDoc.getPage(pageNum);

      // Check if stale
      if (localToken !== renderTokenRef.current) {
        console.log(`[PdfViewer] Render cancelled (stale token: ${localToken})`);
        return false;
      }

      pdfPageRef.current = page;

      // 2) Compute viewport with scale=1 (CSS pixels)
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: 1 });

      console.log('[PdfViewer] Viewport:', {
        width: viewport.width,
        height: viewport.height,
        dpr: dpr
      });

      // 3) Set canvas intrinsic size (devicePixelRatio for crisp rendering)
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);

      // 4) Set canvas CSS size (matches viewport exactly)
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      console.log('[PdfViewer] Canvas dimensions:', {
        intrinsic: `${canvas.width}x${canvas.height}`,
        css: `${canvas.style.width} x ${canvas.style.height}`
      });

      // 5) Scale context and render
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      renderTaskRef.current = null;

      // Check if stale after canvas render
      if (localToken !== renderTokenRef.current) {
        console.log(`[PdfViewer] Render cancelled after canvas (stale token: ${localToken})`);
        return false;
      }

      console.log('[PdfViewer] Canvas rendered successfully');

      // 6) Render text layer with SAME viewport
      await renderTextLayer(page, viewport);

      // Check if stale after text layer
      if (localToken !== renderTokenRef.current) {
        console.log(`[PdfViewer] Render cancelled after text layer (stale token: ${localToken})`);
        return false;
      }

      setRendered(true);
      console.log(`[PdfViewer] Page ${pageNum} render complete (token: ${localToken})`);
      return true;
    } catch (err) {
      console.error('[PdfViewer] Page rendering error:', String(err), (err && (err as any).stack) || null);

      // Ignore cancellation exceptions
      if (err && typeof err === 'object' && 'name' in err && (err as any).name === 'RenderingCancelledException') {
        console.log(`[PdfViewer] Render task cancelled (token: ${localToken})`);
        return false;
      }

      // Real errors
      if (localToken === renderTokenRef.current) {
        const msg = err && typeof err === 'object' && 'message' in (err as any) ? (err as any).message : 'Failed to render page';
        setError(msg);
      }
      return false;
    } finally {
      // Only clear rendering state if this is the latest render
      if (localToken === renderTokenRef.current) {
        setRenderingPage(false);

        // Check if a rerender was requested during this render
        if (needsRerender.current) {
          needsRerender.current = false;
          console.log(`[PdfViewer] Triggering queued rerender for page ${pageNum}`);
          setTimeout(() => renderPage(pageNum), 0);
        }
      }
    }
  };

  const handlePageChange = useCallback(async (newPage: number) => {
    // Guard: validate bounds
    if (newPage < 1 || newPage > numPages || newPage === currentPage) {
      console.log(`[PdfViewer] Page change ignored: ${newPage} (current: ${currentPage}, total: ${numPages})`);
      return;
    }

    // Guard: prevent navigation while rendering
    if (renderingPage) {
      console.log(`[PdfViewer] Page change blocked - already rendering`);
      return;
    }

    console.log(`[PdfViewer] Navigating to page ${newPage}`);

    onClosePopup();

    // Render new page and update currentPage only on success
    const success = await renderPage(newPage);

    if (success) {
      setCurrentPage(newPage);
      console.log(`[PdfViewer] Successfully navigated to page ${newPage}`);
    } else {
      console.log(`[PdfViewer] Failed to navigate to page ${newPage}`, { error, pdfDoc: !!pdfDocRef.current, renderingPage, currentPage, numPages, rendered });
    }
  }, [numPages, currentPage, renderingPage, onClosePopup]);

  const handleNextPage = useCallback(() => {
    if (!renderingPage && currentPage < numPages) {
      console.log('[PdfViewer] Next button clicked');
      handlePageChange(currentPage + 1);
    }
  }, [currentPage, numPages, renderingPage, handlePageChange]);

  const handlePrevPage = useCallback(() => {
    if (!renderingPage && currentPage > 1) {
      console.log('[PdfViewer] Prev button clicked');
      handlePageChange(currentPage - 1);
    }
  }, [currentPage, renderingPage, handlePageChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!rendered || numPages === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard nav while rendering
      if (renderingPage) {
        console.log('[PdfViewer] Keyboard navigation ignored - rendering in progress');
        return;
      }

      if (e.key === 'ArrowLeft' && currentPage > 1) {
        e.preventDefault();
        console.log('[PdfViewer] Left arrow pressed');
        handlePrevPage();
      } else if (e.key === 'ArrowRight' && currentPage < numPages) {
        e.preventDefault();
        console.log('[PdfViewer] Right arrow pressed');
        handleNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rendered, numPages, currentPage, renderingPage, handlePrevPage, handleNextPage]);

  // Debounced resize handler
  useEffect(() => {
    if (!rendered) return;

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        console.log('[PdfViewer] Resize detected, re-rendering current page');

        // If currently rendering, queue a rerender
        if (renderingPage) {
          console.log('[PdfViewer] Render in progress, queuing rerender');
          needsRerender.current = true;
        } else {
          // Otherwise render immediately
          renderPage(currentPage);
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [rendered, currentPage, renderingPage]);

  // Text layer click/touch handlers
  const handleTextLayerClick = useCallback((event: React.MouseEvent) => {
    if (renderingPage || !hasTextLayer) {
      console.log('[PdfViewer] Click ignored:', { renderingPage, hasTextLayer });
      return;
    }

    // Small delay to let browser selection happen
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        console.log('[PdfViewer] No selection available');
        return;
      }

      let selectedText = selection.toString().trim();

      // If no selection, try target element
      if (!selectedText && event.target instanceof HTMLElement) {
        selectedText = event.target.textContent?.trim() || '';
      }

      if (!selectedText) {
        console.log('[PdfViewer] No text selected');
        return;
      }

      // Extract first word from selection
      const words = selectedText.split(/[\s\p{P}]+/u).filter(w => w.length > 0);
      const firstWord = words[0] || '';

      const normalized = normalizeWord(firstWord);

      if (normalized) {
        console.log('[PdfViewer] Valid word selected:', normalized);
        onWordClick(normalized, event.pageX, event.pageY);

        // Clear selection after 100ms
        setTimeout(() => selection.removeAllRanges(), 100);
      } else {
        console.log('[PdfViewer] Invalid word ignored:', firstWord);
      }
    }, 10);
  }, [renderingPage, hasTextLayer, onWordClick]);

  const handleTextLayerTouch = useCallback((event: React.TouchEvent) => {
    if (renderingPage || !hasTextLayer) {
      console.log('[PdfViewer] Touch ignored:', { renderingPage, hasTextLayer });
      return;
    }

    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        console.log('[PdfViewer] No selection from touch');
        return;
      }

      let selectedText = selection.toString().trim();

      if (!selectedText && event.target instanceof HTMLElement) {
        selectedText = event.target.textContent?.trim() || '';
      }

      if (!selectedText) {
        console.log('[PdfViewer] No text from touch');
        return;
      }

      const words = selectedText.split(/[\s\p{P}]+/u).filter(w => w.length > 0);
      const firstWord = words[0] || '';

      const normalized = normalizeWord(firstWord);

      if (normalized) {
        console.log('[PdfViewer] Valid word from touch:', normalized);
        const touch = event.changedTouches[0] || event.touches[0];
        if (touch) {
          onWordClick(normalized, touch.pageX, touch.pageY);
        }
        setTimeout(() => selection.removeAllRanges(), 100);
      } else {
        console.log('[PdfViewer] Invalid word from touch:', firstWord);
      }
    }, 10);
  }, [renderingPage, hasTextLayer, onWordClick]);

  return (
    <section className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-100 px-4 sm:px-6 py-3 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-700">
          {rendered && numPages > 0
            ? `PDF Preview - Page ${currentPage} of ${numPages}`
            : 'PDF Preview'}
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative bg-gray-50 flex items-center justify-center min-h-96 overflow-auto"
      >
        {(loading || renderingPage) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
              <p className="text-sm text-gray-600">
                {renderingPage ? `Rendering page ${currentPage}...` : 'Loading PDF...'}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
              <p className="text-red-800 text-sm font-medium mb-2">Error Loading PDF</p>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
              >
                Reload page to retry
              </button>
            </div>
          </div>
        )}

        {!file && !loading && !error && (
          <div className="text-gray-500 text-sm">
            Upload a PDF to get started
          </div>
        )}

        <div className="w-full max-w-4xl mx-auto p-4">
          {rendered && noTextForPage && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <p className="text-yellow-800 text-sm">
                ⚠️ Interactive text unavailable for this page. PDF may be scanned or image-based.
              </p>
            </div>
          )}

          <div
            className="relative inline-block mx-auto"
            style={{ display: rendered && file && !error ? 'block' : 'none' }}
          >
            <canvas
              ref={canvasRef}
              className="shadow-lg rounded-sm"
            />
            {hasTextLayer && (
              <div
                ref={textLayerRef}
                className="textLayer"
                onClick={handleTextLayerClick}
                onTouchEnd={handleTextLayerTouch}
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-100 px-4 sm:px-6 py-3 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span>
            {renderingPage
              ? `Rendering page ${currentPage}...`
              : rendered && numPages > 0
              ? `Page ${currentPage} of ${numPages} — ${hasTextLayer ? 'Click any word to see its definition' : 'No interactive text on this page'}`
              : 'Ready to render PDF'}
          </span>
          {rendered && hasTextLayer && !renderingPage && (
            <span className="hidden sm:inline">
              Text layer active • Selection-based word lookup
            </span>
          )}
        </div>

        {rendered && numPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || renderingPage}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors text-sm"
            >
              ← Previous
            </button>
            <span className="text-sm font-medium text-gray-700">
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === numPages || renderingPage}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors text-sm"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>

    {/* Debug banner (dev only) */}
    <div className="fixed right-4 bottom-4 z-50">
      <div className="flex items-start gap-2">
        <button onClick={() => setShowDebug(s => !s)} className="px-2 py-1 bg-gray-800 text-white rounded text-xs">
          {showDebug ? 'Hide' : 'Show'} debug
        </button>
        {showDebug && (
          <div className="bg-white p-2 border rounded shadow text-xs w-72">
            <div className="font-medium text-sm mb-2">Debug</div>
            <div><strong>Error:</strong> {error || '—'}</div>
            <div><strong>Rendered:</strong> {String(rendered)}</div>
            <div><strong>Page:</strong> {currentPage} / {numPages}</div>
            <div><strong>Rendering:</strong> {String(renderingPage)}</div>
            <div><strong>pdfDoc:</strong> {pdfDocRef.current ? 'present' : 'missing'}</div>
          </div>
        )}
      </div>
    </div>
  );
}

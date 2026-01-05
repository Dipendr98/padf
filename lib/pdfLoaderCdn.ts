/**
 * CDN-based PDF.js loader
 * Waits for window.pdfjsLib to be available from CDN script tag
 */

export async function waitForPdfJs(timeoutMs: number = 10000): Promise<any> {
  const startTime = Date.now();

  while (!window.pdfjsLib) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(
        'PDF.js library failed to load from CDN. Please check your internet connection and reload the page.'
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return window.pdfjsLib;
}

export async function loadPdfDocument(data: ArrayBuffer): Promise<any> {
  const pdfjsLib = await waitForPdfJs();

  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const loadingTask = pdfjsLib.getDocument({ data });
  return await loadingTask.promise;
}

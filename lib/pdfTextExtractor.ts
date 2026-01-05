import { WordRect } from '@/types/pdf';

const DEBUG = true; // Enable debug logging

export function extractWordsFromTextContent(
  textContent: any,
  viewport: any,
  scale: number = 1
): WordRect[] {
  const words: WordRect[] = [];

  if (!textContent || !textContent.items) {
    console.warn('[TextExtractor] No text content or items');
    return words;
  }

  if (DEBUG) {
    console.log('[TextExtractor] Extracting from', textContent.items.length, 'text items');
    console.log('[TextExtractor] Viewport:', { width: viewport.width, height: viewport.height, scale });
  }

  for (const item of textContent.items) {
    if (typeof item.str !== 'string' || !item.str.trim()) {
      continue;
    }

    // Get transform values - PDF.js provides a 6-element transform matrix
    // [a, b, c, d, e, f] where:
    // - a, d are horizontal and vertical scaling
    // - e, f are x and y translation (position)
    const transform = item.transform;
    const scaleX = transform[0];
    const scaleY = transform[3];
    const tx = transform[4];
    const ty = transform[5];

    // Calculate font size from transform matrix (use absolute values)
    const fontSize = Math.abs(scaleY);

    // Minimum height fallback
    const minHeight = 12;
    const effectiveHeight = Math.max(fontSize, minHeight);

    // Split text into words, handling multiple spaces
    const textWords = item.str.split(/\s+/).filter((w: string) => w.trim().length > 0);

    // Character width approximation based on item width and string length
    const totalWidth = item.width;
    const charWidth = item.str.length > 0 ? totalWidth / item.str.length : 0;

    let charOffset = 0;

    for (const word of textWords) {
      // Skip whitespace-only or punctuation-only tokens
      const cleanWord = word.replace(/[^\w'-]/g, '');
      if (cleanWord.length === 0) {
        charOffset += word.length + 1; // +1 for space
        continue;
      }

      // Find word position in original string
      const wordIndexInStr = item.str.indexOf(word, charOffset);
      if (wordIndexInStr === -1) {
        charOffset += word.length + 1;
        continue;
      }

      // Calculate word position and dimensions
      const wordStartX = tx + (wordIndexInStr * charWidth);
      const wordWidth = charWidth * word.length;

      // Convert from PDF coordinates (bottom-left origin) to canvas coordinates (top-left origin)
      // PDF y grows upward, canvas y grows downward
      const x = wordStartX;
      const y = viewport.height - ty - effectiveHeight;
      const width = wordWidth;
      const height = effectiveHeight;

      words.push({
        word: cleanWord,
        x,
        y,
        width,
        height,
        centerX: x + width / 2,
        centerY: y + height / 2,
      });

      charOffset = wordIndexInStr + word.length + 1;
    }
  }

  const filteredWords = words.filter((w) => w.word.length > 0);

  if (DEBUG) {
    console.log('[TextExtractor] Extracted', filteredWords.length, 'word rects');
    if (filteredWords.length > 0) {
      console.log('[TextExtractor] Sample rects (first 5):');
      filteredWords.slice(0, 5).forEach((w, i) => {
        console.log(`  [${i}]`, w.word, {
          x: w.x.toFixed(1),
          y: w.y.toFixed(1),
          width: w.width.toFixed(1),
          height: w.height.toFixed(1),
        });
      });
    }
  }

  return filteredWords;
}

export function findWordAtPoint(
  words: WordRect[],
  x: number,
  y: number,
  threshold = 12
): WordRect | null {
  if (DEBUG) {
    console.log('[TextExtractor] Finding word at point:', { x: x.toFixed(1), y: y.toFixed(1), threshold });
  }

  // First try exact containment with threshold
  for (const word of words) {
    if (
      x >= word.x - threshold &&
      x <= word.x + word.width + threshold &&
      y >= word.y - threshold &&
      y <= word.y + word.height + threshold
    ) {
      if (DEBUG) {
        console.log('[TextExtractor] Found word by containment:', word.word, {
          rect: { x: word.x.toFixed(1), y: word.y.toFixed(1), w: word.width.toFixed(1), h: word.height.toFixed(1) }
        });
      }
      return word;
    }
  }

  // Fallback to nearest center distance
  let nearest: WordRect | null = null;
  let minDistance = threshold * 2;

  for (const word of words) {
    const dx = x - word.centerX;
    const dy = y - word.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = word;
    }
  }

  if (nearest && DEBUG) {
    console.log('[TextExtractor] Found nearest word:', nearest.word, 'at distance', minDistance.toFixed(1));
  } else if (DEBUG) {
    console.log('[TextExtractor] No word found within threshold');
  }

  return nearest;
}

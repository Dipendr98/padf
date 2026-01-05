import { DefinitionData } from '@/types/pdf';

const cache = new Map<string, DefinitionData>();

/**
 * Normalize word for lookup: remove punctuation, lowercase, trim
 */
export function normalizeWord(word: string): string | null {
  // Remove all non-alphabetic characters and convert to lowercase
  const normalized = word.toLowerCase().trim().replace(/[^a-z]/g, '');

  // Only proceed if word is at least 2 characters and contains only letters
  if (normalized.length < 2 || !/^[a-z]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

export async function fetchDefinition(word: string): Promise<DefinitionData> {
  const normalizedWord = normalizeWord(word);

  if (!normalizedWord) {
    console.log('[Dictionary] Invalid word, skipping:', word);
    throw new Error('Invalid word format');
  }

  console.log('[Dictionary] Fetching definition for:', normalizedWord);

  // Check cache first
  if (cache.has(normalizedWord)) {
    console.log('[Dictionary] Using cached result for:', normalizedWord);
    return cache.get(normalizedWord)!;
  }

  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`;
    console.log('[Dictionary] Fetching from API:', url);

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[Dictionary] Word not found (404):', normalizedWord);
        const errorData: DefinitionData = {
          word: normalizedWord,
          definition: `Meaning not available for '${normalizedWord}'`,
          error: 'not_found',
        };
        cache.set(normalizedWord, errorData);
        return errorData;
      }
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    console.log('[Dictionary] API response received for:', normalizedWord);

    const firstEntry = data[0];
    const firstMeaning = firstEntry?.meanings?.[0];
    const firstDefinition = firstMeaning?.definitions?.[0];

    const phonetic = firstEntry?.phonetic ||
                     firstEntry?.phonetics?.find((p: any) => p.text)?.text ||
                     '';

    const example = firstDefinition?.example || undefined;
    const definition = firstDefinition?.definition || 'No definition available';

    const result: DefinitionData = {
      word: normalizedWord,
      phonetic: phonetic || undefined,
      definition,
      example,
    };

    console.log('[Dictionary] Caching result for:', normalizedWord);
    cache.set(normalizedWord, result);
    return result;
  } catch (error) {
    console.error('[Dictionary] Error fetching definition:', error);
    const errorData: DefinitionData = {
      word: normalizedWord,
      definition: `Unable to fetch meaning for '${normalizedWord}'`,
      error: error instanceof Error ? error.message : 'network_error',
    };
    // Don't cache network errors, only cache 404s
    return errorData;
  }
}

export function clearCache() {
  cache.clear();
}

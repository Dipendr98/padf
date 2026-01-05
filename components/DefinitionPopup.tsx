import { useEffect, useRef } from 'react';
import { DefinitionData } from '@/types/pdf';

interface DefinitionPopupProps {
  visible: boolean;
  x: number;
  y: number;
  word: string;
  loading: boolean;
  data: DefinitionData | null;
  error: string | null;
  onClose: () => void;
}

export default function DefinitionPopup({
  visible,
  x,
  y,
  word,
  loading,
  data,
  error,
  onClose,
}: DefinitionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (!visible || !popupRef.current) return;

    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + rect.width > viewportWidth - 16) {
      adjustedX = viewportWidth - rect.width - 16;
    }

    if (y + rect.height > viewportHeight - 16) {
      adjustedY = Math.max(16, y - rect.height - 16);
    }

    popup.style.left = `${adjustedX}px`;
    popup.style.top = `${adjustedY}px`;
  }, [visible, x, y, data, loading]);

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-20 z-40" />
      <div
        ref={popupRef}
        className="fixed w-72 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 transition-opacity duration-200"
        style={{ left: x, top: y }}
      >
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
          <span className="font-bold text-lg">{word}</span>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded p-1 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          )}

          {!loading && error && (
            <div className="text-gray-700 text-sm">{error}</div>
          )}

          {!loading && data && !data.error && (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Definition
                </p>
                <p className="text-gray-800 text-sm leading-relaxed">
                  {data.definition}
                </p>
              </div>

              {data.phonetic && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Pronunciation
                  </p>
                  <p className="text-gray-700 text-sm italic">{data.phonetic}</p>
                </div>
              )}

              {data.example && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Example
                  </p>
                  <p className="text-gray-700 text-sm italic">"{data.example}"</p>
                </div>
              )}
            </>
          )}

          {!loading && data?.error && (
            <div className="text-gray-700 text-sm">{data.definition}</div>
          )}
        </div>

        <div className="bg-gray-50 px-4 py-3 rounded-b-lg text-xs text-gray-600 border-t border-gray-200">
          Data from Dictionary API • Click outside to close
        </div>
      </div>
    </>
  );
}

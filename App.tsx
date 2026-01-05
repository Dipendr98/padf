import { useState } from 'react';
import Header from '@/components/Header';
import UploadZone from '@/components/UploadZone';
import PdfViewer from '@/components/PdfViewer';
import DefinitionPopup from '@/components/DefinitionPopup';
import InfoSection from '@/components/InfoSection';
import { PopupState } from '@/types/pdf';
import { fetchDefinition } from '@/lib/dictionaryApi';

export default function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [popupState, setPopupState] = useState<PopupState>({
    visible: false,
    x: 0,
    y: 0,
    word: '',
    loading: false,
    data: null,
    error: null,
  });

  const handleFileSelect = (file: File) => {
    setPdfFile(file);
    setPopupState({
      visible: false,
      x: 0,
      y: 0,
      word: '',
      loading: false,
      data: null,
      error: null,
    });
  };

  const handleWordClick = async (word: string, x: number, y: number) => {
    console.log('[App] Word clicked:', word, 'at coords:', { x, y });

    // Set popup visible immediately with loading state
    setPopupState({
      visible: true,
      x: x + 16,
      y: y + 16,
      word,
      loading: true,
      data: null,
      error: null,
    });

    try {
      console.log('[App] Fetching definition for:', word);
      const definition = await fetchDefinition(word);

      console.log('[App] Definition received:', definition);

      setPopupState((prev) => ({
        ...prev,
        loading: false,
        data: definition,
      }));
    } catch (err) {
      console.error('[App] Error fetching definition:', err);

      // If error is due to invalid word, don't show popup
      if (err instanceof Error && err.message === 'Invalid word format') {
        setPopupState({
          visible: false,
          x: 0,
          y: 0,
          word: '',
          loading: false,
          data: null,
          error: null,
        });
        return;
      }

      setPopupState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch definition',
      }));
    }
  };

  const handleClosePopup = () => {
    setPopupState({
      visible: false,
      x: 0,
      y: 0,
      word: '',
      loading: false,
      data: null,
      error: null,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {!pdfFile && <UploadZone onFileSelect={handleFileSelect} />}

        <PdfViewer
          file={pdfFile}
          onWordClick={handleWordClick}
          onClosePopup={handleClosePopup}
        />

        <InfoSection />
      </main>

      <DefinitionPopup
        visible={popupState.visible}
        x={popupState.x}
        y={popupState.y}
        word={popupState.word}
        loading={popupState.loading}
        data={popupState.data}
        error={popupState.error}
        onClose={handleClosePopup}
      />
    </div>
  );
}

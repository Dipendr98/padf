export interface WordRect {
  word: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface DefinitionData {
  word: string;
  phonetic?: string;
  definition: string;
  example?: string;
  error?: string;
}

export interface PopupState {
  visible: boolean;
  x: number;
  y: number;
  word: string;
  loading: boolean;
  data: DefinitionData | null;
  error: string | null;
}

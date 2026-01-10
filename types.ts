
export interface ChordProgression {
  timestamp: string;
  section: string;
  chords: string;
  lyricsSnippet?: string;
}

export interface SongAnalysis {
  title: string;
  artist: string;
  key: string;
  bpm: number;
  timeSignature: string;
  progression: ChordProgression[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}


import React, { useState, useRef, useCallback } from 'react';
import { AppStatus, SongAnalysis } from './types';
import { analyzeAudio } from './services/geminiService';
import { Music, Upload, Loader2, Play, Pause, AlertCircle, Headphones, Download, Guitar } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [analysis, setAnalysis] = useState<SongAnalysis | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Por favor, envie um arquivo de áudio válido.');
      return;
    }

    try {
      setError(null);
      setStatus(AppStatus.UPLOADING);
      
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      
      const base64 = await fileToBase64(file);
      
      setStatus(AppStatus.ANALYZING);
      const result = await analyzeAudio(base64, file.type);
      
      setAnalysis(result);
      setStatus(AppStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro inesperado ao analisar o áudio.');
      setStatus(AppStatus.ERROR);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const downloadChords = () => {
    if (!analysis) return;
    const content = `
Música: ${analysis.title}
Artista: ${analysis.artist}
Tom: ${analysis.key}
BPM: ${analysis.bpm}

CIFRA:
${analysis.progression.map(p => `[${p.timestamp}] ${p.section}\n${p.chords}\n(${p.lyricsSnippet || ''})\n`).join('\n')}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.title}_cifra.txt`;
    a.click();
  };

  const reset = () => {
    setAnalysis(null);
    setAudioUrl(null);
    setStatus(AppStatus.IDLE);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-5xl mb-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            ChordGenius AI
          </h1>
        </div>
        <button 
          onClick={reset}
          className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          Limpar Tudo
        </button>
      </header>

      <main className="w-full max-w-5xl flex-1 flex flex-col gap-8">
        
        {/* State: Idle / Error */}
        {(status === AppStatus.IDLE || status === AppStatus.ERROR) && (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50 hover:bg-slate-900/80 transition-all">
            <div className="bg-slate-800 p-6 rounded-full mb-6">
              <Upload className="w-12 h-12 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Transforme áudio em cifras</h2>
            <p className="text-slate-400 mb-8 text-center max-w-md px-6">
              Faça upload de um arquivo MP3, WAV ou M4A e nossa IA detectará os acordes, tom e estrutura da música para você.
            </p>
            
            <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Selecionar Áudio
              <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
            </label>

            {error && (
              <div className="mt-8 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* State: Loading */}
        {(status === AppStatus.UPLOADING || status === AppStatus.ANALYZING) && (
          <div className="flex flex-col items-center justify-center py-32 bg-slate-900/50 rounded-3xl border border-slate-800">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold mb-2">
              {status === AppStatus.UPLOADING ? 'Subindo áudio...' : 'Analisando harmonia...'}
            </h2>
            <p className="text-slate-400 animate-pulse">
              {status === AppStatus.ANALYZING ? 'A IA está ouvindo e identificando os acordes. Isso pode levar alguns segundos.' : 'Preparando o arquivo para análise.'}
            </p>
          </div>
        )}

        {/* State: Completed */}
        {status === AppStatus.COMPLETED && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sidebar: Metadata & Player */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Headphones className="w-8 h-8 text-white" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-lg truncate" title={analysis.title}>{analysis.title}</h3>
                    <p className="text-slate-400 text-sm truncate">{analysis.artist}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Tom</p>
                    <p className="text-xl font-bold text-indigo-400">{analysis.key}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">BPM</p>
                    <p className="text-xl font-bold text-purple-400">{analysis.bpm}</p>
                  </div>
                </div>

                {audioUrl && (
                  <div className="space-y-4">
                    <audio 
                      ref={audioRef} 
                      src={audioUrl} 
                      onEnded={() => setIsPlaying(false)}
                      className="hidden" 
                    />
                    <button 
                      onClick={togglePlay}
                      className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-700"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                      {isPlaying ? 'Pausar' : 'Ouvir Música'}
                    </button>
                    <button 
                      onClick={downloadChords}
                      className="w-full py-3 text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Baixar Cifra (TXT)
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 flex items-start gap-4">
                <Guitar className="w-6 h-6 text-indigo-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-indigo-300 mb-1">Dica de Músico</h4>
                  <p className="text-sm text-indigo-300/80 leading-relaxed">
                    A IA detectou uma progressão no tom de {analysis.key}. Se estiver difícil de tocar, tente usar um capotraste!
                  </p>
                </div>
              </div>
            </div>

            {/* Main: Chord Sheet */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[700px]">
                <div className="p-6 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                  <h3 className="font-bold flex items-center gap-2">
                    <Music className="w-5 h-5 text-indigo-400" />
                    Cifra Gerada
                  </h3>
                  <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300 uppercase font-bold">
                    {analysis.timeSignature || '4/4'}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
                  {analysis.progression.map((item, idx) => (
                    <div key={idx} className="relative pl-12 group">
                      {/* Timeline marker */}
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-800 group-hover:bg-indigo-500/50 transition-colors"></div>
                      <div className="absolute left-[-4px] top-0 w-2 h-2 rounded-full bg-slate-700 group-hover:bg-indigo-500 transition-all"></div>
                      
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-500/80 uppercase tracking-widest">{item.section}</span>
                        <span className="text-xs text-slate-500 font-mono">{item.timestamp}</span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-3xl md:text-4xl font-black text-white tracking-wider font-serif selection:bg-indigo-500">
                          {item.chords}
                        </p>
                      </div>
                      
                      {item.lyricsSnippet && (
                        <p className="text-slate-500 italic text-sm md:text-base border-l-2 border-slate-800 pl-4 py-1">
                          "{item.lyricsSnippet}"
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="py-20 text-center text-slate-600">
                    <p className="text-sm">Fim da análise gerada por IA.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mt-12 py-8 border-t border-slate-900 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} ChordGenius AI - Inteligência Artificial para Músicos</p>
      </footer>
    </div>
  );
};

export default App;

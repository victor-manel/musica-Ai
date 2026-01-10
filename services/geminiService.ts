
import { GoogleGenAI, Type } from "@google/genai";
import { SongAnalysis } from "../types";

export const analyzeAudio = async (base64Audio: string, mimeType: string): Promise<SongAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio,
          },
        },
        {
          text: `Analise este áudio musical e gere a cifra completa. 
          Identifique o tom (key), o BPM aproximado e a progressão de acordes organizada por seções (Intro, Verso, Refrão, etc) com marcações de tempo.
          Retorne obrigatoriamente um JSON puro seguindo exatamente este esquema.`
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Nome da música" },
          artist: { type: Type.STRING, description: "Artista ou banda" },
          key: { type: Type.STRING, description: "Tom da música" },
          bpm: { type: Type.NUMBER, description: "Batidas por minuto" },
          timeSignature: { type: Type.STRING, description: "Fórmula de compasso (ex: 4/4)" },
          progression: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                timestamp: { type: Type.STRING, description: "Tempo no áudio (ex: 0:15)" },
                section: { type: Type.STRING, description: "Nome da seção (ex: Refrão)" },
                chords: { type: Type.STRING, description: "Acordes daquela parte" },
                lyricsSnippet: { type: Type.STRING, description: "Pequeno trecho da letra correspondente" }
              },
              required: ["timestamp", "section", "chords"]
            }
          }
        },
        required: ["title", "artist", "key", "bpm", "progression"]
      },
    },
  });

  if (!response.text) {
    throw new Error("Não foi possível obter resposta da IA.");
  }

  try {
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Erro ao parsear JSON:", error);
    throw new Error("Erro ao processar os dados da cifra.");
  }
};

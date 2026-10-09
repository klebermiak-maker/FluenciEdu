import { GoogleGenAI } from '@google/genai';

export interface TranscriptionResult {
  success: boolean;
  transcription?: string;
  message?: string;
}

export const aiTranscriptionService = {
  /**
   * Verifica se o serviço de IA possui chave configurada no ambiente.
   */
  isConfigured(): boolean {
    const key = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);
    return Boolean(key);
  },

  /**
   * Gera uma sugestão opcional de transcrição com assistência de IA.
   * Não altera pontuação nem marcações automaticamente.
   */
  async generateTranscriptionSuggestion(audioBlob: Blob): Promise<TranscriptionResult> {
    const key = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

    if (!key) {
      return {
        success: false,
        message: 'Assistência de IA não configurada. Defina a variável GEMINI_API_KEY para habilitar a geração de sugestões de transcrição.',
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: key });

      // Converter Blob em base64
      const buffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const mimeType = audioBlob.type || 'audio/webm';

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Audio,
                },
              },
              {
                text: 'Transcreva exatamente as palavras que o estudante pronunciou neste áudio em português do Brasil. Não normalize nem corrija erros de leitura do aluno. Apenas forneça a transcrição das palavras ouvidas, sem introduções ou comentários adicionais.',
              },
            ],
          },
        ],
      });

      const text = response.text?.trim() || '';

      if (!text) {
        return {
          success: false,
          message: 'O serviço de IA não identificou fala audível na gravação.',
        };
      }

      return {
        success: true,
        transcription: text,
        message: 'Sugestão de transcrição gerada com sucesso. Requer revisão e validação do professor.',
      };
    } catch (err: unknown) {
      console.warn('Erro ao solicitar transcrição por IA:', err);
      const msg = err instanceof Error ? err.message : 'Falha na comunicação com o serviço de transcrição.';
      return {
        success: false,
        message: `Não foi possível gerar a sugestão automática: ${msg}`,
      };
    }
  },
};

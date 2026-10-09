import { supabase, isSupabaseConfigured } from './supabase';

const DB_NAME = 'fluenciedu_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

// Open IndexedDB database for local persistent binary storage
function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste navegador.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// In-memory object URL cache to prevent leaking multiple URLs
const objectUrlCache = new Map<string, string>();

export const audioStorageService = {
  /**
   * Armazena o blob de áudio de forma persistente.
   * Tenta salvar no Supabase Storage se configurado; caso contrário, persiste em IndexedDB.
   */
  async saveAudio(
    assessmentId: string,
    blob: Blob,
    mimeType: string
  ): Promise<{ storagePath: string; audioUrl: string; sizeBytes: number }> {
    const sizeBytes = blob.size;
    const extension = mimeType.includes('ogg')
      ? 'ogg'
      : mimeType.includes('mp4')
      ? 'mp4'
      : mimeType.includes('wav')
      ? 'wav'
      : 'webm';
    
    // Unique storage path sem nomes de alunos no caminho
    const storagePath = `assessments/${assessmentId}/recording_${Date.now()}.${extension}`;

    let remoteSaved = false;

    // 1. Tentar upload no Supabase Storage se disponível
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('audio-recordings')
          .upload(storagePath, blob, {
            contentType: mimeType,
            upsert: true,
          });

        if (!error && data) {
          remoteSaved = true;
        } else {
          console.warn('Falha no Supabase Storage, utilizando armazenamento local persistente:', error);
        }
      } catch (err) {
        console.warn('Erro ao conectar ao Supabase Storage:', err);
      }
    }

    // 2. Sempre armazenar cópia completa no IndexedDB para redundância, offline e reprodução imediata
    try {
      const idb = await openAudioDB();
      await new Promise<void>((resolve, reject) => {
        const tx = idb.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record = {
          id: assessmentId,
          storagePath,
          blob,
          mimeType,
          sizeBytes,
          created_at: new Date().toISOString(),
        };
        const putRequest = store.put(record);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      });
    } catch (idbErr) {
      console.error('Erro ao salvar áudio no IndexedDB:', idbErr);
      if (!remoteSaved) {
        throw new Error('Não foi possível persistir o arquivo de áudio no armazenamento.');
      }
    }

    // Criar Object URL para reprodução imediata
    const localUrl = URL.createObjectURL(blob);
    objectUrlCache.set(assessmentId, localUrl);

    return {
      storagePath,
      audioUrl: localUrl,
      sizeBytes,
    };
  },

  /**
   * Recupera o Blob de áudio armazenado.
   */
  async getAudioBlob(assessmentId: string): Promise<Blob | null> {
    try {
      const idb = await openAudioDB();
      return new Promise<Blob | null>((resolve) => {
        const tx = idb.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(assessmentId);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve(req.result.blob);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  /**
   * Obtém uma URL válida para reprodução do áudio (Object URL segura).
   */
  async getPlaybackUrl(assessmentId: string, storagePath?: string): Promise<string | null> {
    // 1. Verificar cache em memória
    if (objectUrlCache.has(assessmentId)) {
      return objectUrlCache.get(assessmentId)!;
    }

    // 2. Verificar IndexedDB
    const blob = await this.getAudioBlob(assessmentId);
    if (blob) {
      const url = URL.createObjectURL(blob);
      objectUrlCache.set(assessmentId, url);
      return url;
    }

    // 3. Verificar URL assinada no Supabase Storage se configurado
    if (isSupabaseConfigured && supabase && storagePath) {
      try {
        const { data, error } = await supabase.storage
          .from('audio-recordings')
          .createSignedUrl(storagePath, 3600); // 1 hora de validade

        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }
      } catch (err) {
        console.warn('Erro ao gerar URL assinada:', err);
      }
    }

    return null;
  },

  /**
   * Baixa o arquivo de áudio diretamente no dispositivo do usuário.
   */
  async downloadAudioFile(assessmentId: string, customFilename?: string): Promise<boolean> {
    const blob = await this.getAudioBlob(assessmentId);
    if (!blob) return false;

    const extension = blob.type.includes('ogg')
      ? 'ogg'
      : blob.type.includes('mp4')
      ? 'mp4'
      : blob.type.includes('wav')
      ? 'wav'
      : 'webm';

    const filename = customFilename || `gravacao_leitura_${assessmentId.slice(0, 8)}.${extension}`;
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return true;
  },

  /**
   * Exclui o arquivo de áudio do IndexedDB e do Supabase Storage.
   */
  async deleteAudio(assessmentId: string, storagePath?: string): Promise<void> {
    // Revogar Object URL do cache
    if (objectUrlCache.has(assessmentId)) {
      URL.revokeObjectURL(objectUrlCache.get(assessmentId)!);
      objectUrlCache.delete(assessmentId);
    }

    // Remover do IndexedDB
    try {
      const idb = await openAudioDB();
      await new Promise<void>((resolve, reject) => {
        const tx = idb.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(assessmentId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Erro ao deletar áudio do IndexedDB:', err);
    }

    // Remover do Supabase Storage se configurado
    if (isSupabaseConfigured && supabase && storagePath) {
      try {
        await supabase.storage.from('audio-recordings').remove([storagePath]);
      } catch (err) {
        console.warn('Erro ao remover arquivo do Supabase Storage:', err);
      }
    }
  },
};

/**
 * Utilitário de formatação de data e hora para o fuso horário oficial de Itaúba - MT:
 * America/Cuiaba (UTC-4)
 */
export function formatDateTimeCuiaba(isoUtcString: string): string {
  try {
    const date = new Date(isoUtcString);
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Cuiaba',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return isoUtcString;
  }
}

/**
 * Utilitário de formatação de duração de gravação.
 * Exibe minutos e segundos reais decorridos, NUNCA como pontuação ou índice leitor.
 */
export function formatRecordingDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins} min ${secs.toString().padStart(2, '0')} s`;
  }
  return `${secs} s`;
}

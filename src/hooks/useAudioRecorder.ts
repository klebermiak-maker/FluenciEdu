import { useState, useRef, useEffect, useCallback } from 'react';

export type RecorderStatus = 'idle' | 'testing' | 'recording' | 'stopped';
export type RecordingMode = 'livre' | '60_segundos';

export interface UseAudioRecorderReturn {
  status: RecorderStatus;
  elapsedSeconds: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioMimeType: string;
  micVolume: number; // 0 to 100 for live visual meter
  isMicAvailable: boolean;
  errorMessage: string | null;
  hasPermission: boolean | null;
  startMicTest: () => Promise<boolean>;
  stopMicTest: () => void;
  startRecording: (mode: RecordingMode) => Promise<boolean>;
  stopRecording: () => void;
  discardRecording: () => void;
  clearError: () => void;
}

export function useAudioRecorder(onAutoStop60s?: () => void): UseAudioRecorderReturn {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isMicAvailable, setIsMicAvailable] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // References
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentModeRef = useRef<RecordingMode>('livre');

  // Determinar melhor MIME type suportado pelo navegador
  const getSupportedMimeType = useCallback((): string => {
    if (typeof MediaRecorder === 'undefined') return 'audio/webm';
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }, []);

  // Cleanup de streams e audio context
  const cleanupMedia = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setMicVolume(0);
  }, []);

  useEffect(() => {
    // Check initial device support
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setIsMicAvailable(false);
      setErrorMessage('Este navegador não suporta gravação direta de áudio via microfone.');
    }
    return () => {
      cleanupMedia();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [cleanupMedia, audioUrl]);

  // Visualizer loop
  const startVolumeMeter = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Normalizar volume de 0 a 100 com sensibilidade
        const normalized = Math.min(100, Math.round((average / 128) * 100 * 1.5));
        setMicVolume(normalized);

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('Não foi possível iniciar o medidor visual de volume:', e);
    }
  }, []);

  // 1. Testar o microfone
  const startMicTest = useCallback(async (): Promise<boolean> => {
    cleanupMedia();
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      setHasPermission(true);
      setStatus('testing');
      startVolumeMeter(stream);
      return true;
    } catch (err: unknown) {
      cleanupMedia();
      setHasPermission(false);
      setStatus('idle');

      const error = err as { name?: string; message?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setErrorMessage('Permissão de microfone negada. Clique no ícone de cadeado na barra de endereços para permitir o acesso.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setErrorMessage('Nenhum microfone foi detectado neste dispositivo.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setErrorMessage('O microfone já está em uso por outro aplicativo ou aba.');
      } else {
        setErrorMessage('Falha ao acessar o microfone. Verifique suas configurações de áudio.');
      }
      return false;
    }
  }, [cleanupMedia, startVolumeMeter]);

  const stopMicTest = useCallback(() => {
    if (status === 'testing') {
      cleanupMedia();
      setStatus('idle');
    }
  }, [status, cleanupMedia]);

  // 2. Iniciar gravação efetiva
  const startRecording = useCallback(async (mode: RecordingMode): Promise<boolean> => {
    setErrorMessage(null);
    currentModeRef.current = mode;

    let stream = mediaStreamRef.current;

    // Se não tiver stream ativo do teste, solicitar agora
    if (!stream || !stream.active) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
        setHasPermission(true);
      } catch (err: unknown) {
        const error = err as { name?: string };
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setErrorMessage('Permissão de microfone negada pelo navegador.');
        } else {
          setErrorMessage('Não foi possível iniciar a gravação. Verifique seu microfone.');
        }
        return false;
      }
    }

    const mime = getSupportedMimeType();
    setAudioMimeType(mime || 'audio/webm');

    try {
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          setErrorMessage('A gravação foi encerrada, mas nenhum dado de áudio foi capturado.');
          setStatus('idle');
          return;
        }

        const finalBlob = new Blob(chunks, { type: mime || 'audio/webm' });
        setAudioBlob(finalBlob);

        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
        setStatus('stopped');
      };

      recorder.start(250); // Emitir chunks a cada 250ms
      startTimeRef.current = performance.now();
      setStatus('recording');
      setElapsedSeconds(0);

      // Iniciar medidor de volume durante gravação
      if (!analyserRef.current) {
        startVolumeMeter(stream);
      }

      // Cronômetro real com verificação exata de performance.now()
      timerIntervalRef.current = setInterval(() => {
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        setElapsedSeconds(elapsed);

        // Se modo 60 segundos, parar automaticamente
        if (currentModeRef.current === '60_segundos' && elapsed >= 60) {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          if (onAutoStop60s) {
            onAutoStop60s();
          }
        }
      }, 100);

      return true;
    } catch (err) {
      console.error('Erro ao instanciar MediaRecorder:', err);
      setErrorMessage('Não foi possível iniciar o gravador de áudio.');
      return false;
    }
  }, [getSupportedMimeType, startVolumeMeter, onAutoStop60s]);

  // 3. Encerrar gravação
  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (startTimeRef.current > 0) {
      const finalDuration = (performance.now() - startTimeRef.current) / 1000;
      setElapsedSeconds(finalDuration);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    cleanupMedia();
  }, [cleanupMedia]);

  // 4. Descartar gravação
  const discardRecording = useCallback(() => {
    cleanupMedia();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsedSeconds(0);
    setStatus('idle');
    setErrorMessage(null);
  }, [cleanupMedia, audioUrl]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    status,
    elapsedSeconds,
    audioBlob,
    audioUrl,
    audioMimeType,
    micVolume,
    isMicAvailable,
    errorMessage,
    hasPermission,
    startMicTest,
    stopMicTest,
    startRecording,
    stopRecording,
    discardRecording,
    clearError,
  };
}

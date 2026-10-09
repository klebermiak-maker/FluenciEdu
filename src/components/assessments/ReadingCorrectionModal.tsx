import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  FastForward, 
  Check, 
  AlertTriangle, 
  Clock, 
  FileText, 
  User, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle, 
  Flag, 
  Layers, 
  Volume2, 
  MessageSquare,
  ArrowRight,
  Bookmark
} from 'lucide-react';
import { 
  Assessment, 
  Student, 
  ClassRoom, 
  WordEvaluation, 
  WordMarkingType, 
  ComplementaryOccurrence, 
  ProsodyRubric, 
  ProsodyScore, 
  EvaluationDetails 
} from '../../types/database';
import { 
  fluencyProtocolService, 
  PROTOCOLO_VERSAO_PADRAO, 
  SEGMENTACAO_VERSAO_PADRAO, 
  CalculationResult 
} from '../../services/fluencyProtocolService';
import { formatDateTimeCuiaba, formatRecordingDuration } from '../../services/audioStorageService';
import { aiTranscriptionService } from '../../services/aiTranscriptionService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ReadingCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment | null;
  student: Student | null;
  classRoom: ClassRoom | null;
  onSaveEvaluation: (assessmentId: string, details: EvaluationDetails) => Promise<void>;
}

export const ReadingCorrectionModal: React.FC<ReadingCorrectionModalProps> = ({
  isOpen,
  onClose,
  assessment,
  student,
  classRoom,
  onSaveEvaluation,
}) => {
  const { profile } = useAuth();
  const { addToast } = useToast();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Time boundaries
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  // Word markings & last reached
  const [words, setWords] = useState<WordEvaluation[]>([]);
  const [lastReachedIndex, setLastReachedIndex] = useState<number>(0);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);

  // Prosody Rubric
  const [prosody, setProsody] = useState<ProsodyRubric>({
    pontuacao_pausas: 0,
    entonacao: 0,
    ritmo_continuidade: 0,
    agrupamento_sentido: 0,
    comentarios: '',
  });

  // Observations
  const [observacoes, setObservacoes] = useState<string>('');
  const [encaminhamentos, setEncaminhamentos] = useState<string>('');

  // AI Suggestion
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [showAiConsentDialog, setShowAiConsentDialog] = useState<boolean>(false);

  // Modals & Dialogs
  const [showMarkPendingConfirm, setShowMarkPendingConfirm] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Calculations
  const [calc, setCalc] = useState<CalculationResult>({
    isValidTime: true,
    tempoAvaliado: 0,
    totalPalavrasTrecho: 0,
    totalCorretas: 0,
    totalErros: 0,
    totalSubstituicoes: 0,
    totalOmissoes: 0,
    totalIncorretas: 0,
    totalAutocorrecoes: 0,
    totalRepeticoes: 0,
    totalInsercoes: 0,
    pcpm: 0,
    precisaoPercentual: 0,
    hasPendingWords: false,
    pendingCount: 0,
    isConsistent: true,
  });

  // Initialize data when modal opens
  useEffect(() => {
    if (!isOpen || !assessment) return;

    const duracaoTotal = assessment.duracao_segundos || 60;
    const existing = assessment.avaliacao_detalhes;

    if (existing) {
      // Retomar avaliação existente ou rascunho
      setStartTime(existing.tempo_inicio_segundos);
      setEndTime(existing.tempo_fim_segundos);
      setLastReachedIndex(existing.ultima_palavra_alcancada_index);
      setWords(existing.palavras_marcadas);
      if (existing.rubrica_prosodia) {
        setProsody(existing.rubrica_prosodia);
      }
      setObservacoes(existing.observacoes_professor || assessment.observacoes || '');
      setEncaminhamentos(existing.encaminhamentos_pedagogicos || '');
      setAiSuggestion(existing.sugestao_transcricao_ia || '');
    } else {
      // Inicializar nova correção
      const initialWords = fluencyProtocolService.segmentText(assessment.material_conteudo_snapshot);
      setWords(initialWords);
      setLastReachedIndex(Math.max(0, initialWords.length - 1));
      setStartTime(0);
      setEndTime(Math.min(duracaoTotal, assessment.modalidade === '60_segundos' ? 60 : duracaoTotal));
      setObservacoes(assessment.observacoes || '');
      setEncaminhamentos('');
      setAiSuggestion('');
      setProsody({
        pontuacao_pausas: 0,
        entonacao: 0,
        ritmo_continuidade: 0,
        agrupamento_sentido: 0,
        comentarios: '',
      });
    }

    setCurrentTime(0);
    setIsPlaying(false);
  }, [isOpen, assessment]);

  // Recalculate indicators whenever words, range, or last word changes
  useEffect(() => {
    if (words.length === 0) return;
    const result = fluencyProtocolService.calculateIndicators(
      words,
      startTime,
      endTime,
      lastReachedIndex
    );
    setCalc(result);
  }, [words, startTime, endTime, lastReachedIndex]);

  if (!isOpen || !assessment) return null;

  // Audio Controls
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (newTime: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(assessment.duracao_segundos, newTime));
    audioRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Word Marking Handlers
  const handleSetWordStatus = (index: number, status: WordMarkingType, palavraLida?: string) => {
    setWords((prev) =>
      prev.map((w) => {
        if (w.index !== index) return w;
        return {
          ...w,
          status,
          palavra_lida: palavraLida !== undefined ? palavraLida : w.palavra_lida,
        };
      })
    );
  };

  const handleToggleOccurrence = (index: number, occ: ComplementaryOccurrence) => {
    setWords((prev) =>
      prev.map((w) => {
        if (w.index !== index) return w;
        const hasOcc = w.ocorrencias.includes(occ);
        const newOccs = hasOcc
          ? w.ocorrencias.filter((o) => o !== occ)
          : [...w.ocorrencias, occ];
        return {
          ...w,
          ocorrencias: newOccs,
        };
      })
    );
  };

  const handleMarkAllPendingAsCorrect = () => {
    setWords((prev) =>
      prev.map((w) => {
        if (w.index <= lastReachedIndex && w.status === 'pendente') {
          return { ...w, status: 'correta' };
        }
        return w;
      })
    );
    setShowMarkPendingConfirm(false);
    addToast('Palavras atualizadas', 'As palavras pendentes do trecho foram marcadas como corretas.', 'success');
  };

  // AI Transcription request
  const handleRequestAiSuggestion = async () => {
    setShowAiConsentDialog(false);
    setIsLoadingAi(true);

    try {
      const response = await fetch(assessment.audio_url);
      const blob = await response.blob();
      const res = await aiTranscriptionService.generateTranscriptionSuggestion(blob);

      if (res.success && res.transcription) {
        setAiSuggestion(res.transcription);
        addToast('Sugestão gerada', 'Sugestão de transcrição da IA pronta para consulta.', 'info');
      } else {
        addToast('Aviso de IA', res.message || 'Não foi possível gerar sugestão.', 'warning');
      }
    } catch {
      addToast('Erro', 'Falha ao processar o áudio com o serviço de transcrição.', 'error');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Save evaluation (Draft or Final)
  const handleSave = async (isFinal: boolean) => {
    if (!calc.isValidTime) {
      addToast('Trecho inválido', 'O tempo de fim deve ser estritamente maior que o tempo de início.', 'warning');
      return;
    }

    if (isFinal) {
      if (calc.hasPendingWords) {
        addToast(
          'Revisão pendente',
          `Ainda restam ${calc.pendingCount} palavra(s) pendente(s) no trecho avaliado. Revise todas antes de finalizar.`,
          'warning'
        );
        return;
      }

      if (!calc.isConsistent) {
        addToast(
          'Inconsistência nos cálculos',
          'A soma de corretas e erros deve ser igual ao total de palavras avaliadas no trecho.',
          'error'
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const nowUtc = new Date().toISOString();
      const details: EvaluationDetails = {
        id: assessment.avaliacao_detalhes?.id || `evaldet-${Date.now()}`,
        assessment_id: assessment.id,
        estado_correcao: isFinal ? 'revisada' : 'em_correcao',
        protocolo_versao: assessment.avaliacao_detalhes?.protocolo_versao || PROTOCOLO_VERSAO_PADRAO,
        segmentacao_versao: assessment.avaliacao_detalhes?.segmentacao_versao || SEGMENTACAO_VERSAO_PADRAO,
        tempo_inicio_segundos: Math.round(startTime * 10) / 10,
        tempo_fim_segundos: Math.round(endTime * 10) / 10,
        tempo_avaliado_segundos: Math.round(calc.tempoAvaliado * 10) / 10,
        ultima_palavra_alcancada_index: lastReachedIndex,
        palavras_marcadas: words,
        total_palavras_trecho: calc.totalPalavrasTrecho,
        total_corretas: calc.totalCorretas,
        total_erros: calc.totalErros,
        total_substituicoes: calc.totalSubstituicoes,
        total_omissoes: calc.totalOmissoes,
        total_incorretas: calc.totalIncorretas,
        total_autocorrecoes: calc.totalAutocorrecoes,
        total_repeticoes: calc.totalRepeticoes,
        total_insercoes: calc.totalInsercoes,
        pcpm: calc.pcpm,
        precisao_percentual: calc.precisaoPercentual,
        rubrica_prosodia: assessment.material_tipo === 'texto_curto' ? prosody : undefined,
        observacoes_professor: observacoes,
        encaminhamentos_pedagogicos: encaminhamentos,
        sugestao_transcricao_ia: aiSuggestion || undefined,
        professor_revisor_id: profile?.id || 'prof-anon',
        professor_revisor_nome: profile?.nome || 'Professor Revisor',
        data_revisao: isFinal ? nowUtc : assessment.avaliacao_detalhes?.data_revisao,
        created_at: assessment.avaliacao_detalhes?.created_at || nowUtc,
        updated_at: nowUtc,
      };

      await onSaveEvaluation(assessment.id, details);

      addToast(
        isFinal ? 'Avaliação Finalizada!' : 'Rascunho Salvo!',
        isFinal
          ? `A correção de ${student?.nome} foi concluída com sucesso.`
          : 'Progresso da correção salvo com sucesso.',
        'success'
      );
      onClose();
    } catch {
      addToast('Erro ao salvar', 'Ocorreu uma falha ao registrar a avaliação.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedWord = selectedWordIndex !== null ? words[selectedWordIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* Header da Tela de Correção */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-linear-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-xs">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Correção de Leitura — {student?.nome || 'Estudante'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  assessment.avaliacao_detalhes?.estado_correcao === 'revisada'
                    ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/30'
                    : assessment.avaliacao_detalhes?.estado_correcao === 'em_correcao'
                    ? 'bg-amber-500/30 text-amber-300 border-amber-400/30'
                    : 'bg-slate-500/30 text-slate-300 border-slate-400/30'
                }`}>
                  {assessment.avaliacao_detalhes?.estado_correcao === 'revisada'
                    ? 'Revisada pelo professor'
                    : assessment.avaliacao_detalhes?.estado_correcao === 'em_correcao'
                    ? 'Em correção (Rascunho)'
                    : 'Não avaliada'}
                </span>
              </div>
              <p className="text-xs text-blue-200">
                {classRoom?.nome} • Gravado em {formatDateTimeCuiaba(assessment.created_at)} • Duração original: {formatRecordingDuration(assessment.duracao_segundos)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar tela de correção"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Player Stick Bar com Controle de Velocidade */}
        <div className="px-6 py-3 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Elemento de Áudio Oculto */}
          <audio
            ref={audioRef}
            src={assessment.audio_url}
            onTimeUpdate={() => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
              }
            }}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Botões Play / Pause / Seek */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlayPause}
              className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors shadow-xs"
              title={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleSeek(currentTime - 5)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Voltar 5 segundos"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleSeek(currentTime + 5)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Avançar 5 segundos"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <span className="font-mono text-xs font-bold text-slate-300 ml-2">
              {currentTime.toFixed(1)} s / {assessment.duracao_segundos.toFixed(1)} s
            </span>
          </div>

          {/* Scrubber de Progresso */}
          <div className="flex-1 max-w-md mx-4">
            <input
              type="range"
              min={0}
              max={assessment.duracao_segundos}
              step={0.1}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Controle de Velocidade */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Velocidade:</span>
            {[0.75, 1, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => handleSpeedChange(speed)}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Corpo Principal da Correção com 2 Colunas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUNA ESQUERDA (2/3): Texto com Marcação de Palavras & Delimitação de Trecho */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Bloco de Delimitação do Trecho de Áudio */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Delimitação do Trecho Avaliado (Segundos)
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Tempo avaliado (T): <strong className="font-mono text-slate-900">{calc.tempoAvaliado.toFixed(1)} s</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Início */}
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-600">Início:</label>
                  <input
                    type="number"
                    min={0}
                    max={endTime}
                    step={0.5}
                    value={startTime}
                    onChange={(e) => setStartTime(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2 py-1 rounded-lg border border-slate-300 font-mono text-sm"
                  />
                  <span>s</span>
                  <button
                    type="button"
                    onClick={() => setStartTime(Math.round(currentTime * 10) / 10)}
                    className="ml-auto px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                    title="Definir início na posição atual do áudio"
                  >
                    Usar atual ({currentTime.toFixed(1)}s)
                  </button>
                </div>

                {/* Fim */}
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-600">Fim:</label>
                  <input
                    type="number"
                    min={startTime}
                    max={assessment.duracao_segundos}
                    step={0.5}
                    value={endTime}
                    onChange={(e) => setEndTime(Math.min(assessment.duracao_segundos, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2 py-1 rounded-lg border border-slate-300 font-mono text-sm"
                  />
                  <span>s</span>
                  <button
                    type="button"
                    onClick={() => setEndTime(Math.round(currentTime * 10) / 10)}
                    className="ml-auto px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                    title="Definir fim na posição atual do áudio"
                  >
                    Usar atual ({currentTime.toFixed(1)}s)
                  </button>
                </div>
              </div>
            </div>

            {/* Barra de Ações Rápidas de Marcação */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500 mr-1">Legenda:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Correta
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span> Substituída
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-medium">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span> Incorreta / Omitida
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                  Não alcançada
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowMarkPendingConfirm(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Marcar pendentes como corretas</span>
              </button>
            </div>

            {/* Área Interativa das Palavras do Material */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm">
                  {assessment.material_titulo}
                </h4>
                <span className="text-xs text-slate-400">
                  Clique em uma palavra para alterar o status
                </span>
              </div>

              {/* Grid / Texto Corrido de Palavras Selecionáveis */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-3 font-serif text-base sm:text-lg leading-relaxed select-none">
                {words.map((w) => {
                  const isReached = w.index <= lastReachedIndex;
                  const isSelected = selectedWordIndex === w.index;
                  const isLastReached = w.index === lastReachedIndex;

                  let styleClass = 'bg-slate-50 border-slate-200 text-slate-700';

                  if (!isReached) {
                    styleClass = 'bg-slate-100/60 border-transparent text-slate-400 line-through';
                  } else if (w.status === 'correta') {
                    styleClass = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                  } else if (w.status === 'substituida') {
                    styleClass = 'bg-amber-50 border-amber-300 text-amber-900 font-semibold';
                  } else if (w.status === 'incorreta') {
                    styleClass = 'bg-rose-50 border-rose-300 text-rose-900 font-semibold';
                  } else if (w.status === 'omitida') {
                    styleClass = 'bg-rose-100/70 border-rose-300 text-rose-700 line-through';
                  } else if (w.status === 'pendente') {
                    styleClass = 'bg-amber-50/50 border-dashed border-amber-400 text-amber-900';
                  }

                  return (
                    <span key={w.id} className="inline-flex items-center group relative">
                      <button
                        type="button"
                        onClick={() => setSelectedWordIndex(w.index)}
                        className={`px-2 py-1 rounded-xl border text-left transition-all cursor-pointer relative ${styleClass} ${
                          isSelected ? 'ring-2 ring-blue-500 ring-offset-1 scale-105 z-10' : ''
                        }`}
                        title={`Palavra nº ${w.index + 1}: ${w.palavra_original} [${w.status}]`}
                      >
                        <span>{w.palavra_original}</span>
                        {w.palavra_lida && (
                          <span className="block text-[10px] font-sans text-amber-700 italic">
                            ({w.palavra_lida})
                          </span>
                        )}

                        {/* Badges de Ocorrências Complementares */}
                        {w.ocorrencias.length > 0 && (
                          <span className="absolute -top-2 -right-1 flex gap-0.5">
                            {w.ocorrencias.map((o) => (
                              <span
                                key={o}
                                className="text-[8px] font-sans font-extrabold px-1 py-0.2 rounded-full bg-blue-600 text-white"
                              >
                                {o === 'autocorrecao' ? 'Auto' : o === 'repeticao' ? 'Rep' : 'Ins'}
                              </span>
                            ))}
                          </span>
                        )}
                      </button>

                      {/* Pontuação anexa original */}
                      {w.pontuacao_anexa && (
                        <span className="font-serif text-slate-800 ml-0.5">{w.pontuacao_anexa}</span>
                      )}

                      {/* Marcador de Última Palavra Alcançada */}
                      {isLastReached && (
                        <span 
                          className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-sans font-bold rounded-full shadow-xs"
                          title="Última palavra alcançada no tempo de leitura"
                        >
                          Fim da leitura
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Painel Flutuante / Editor da Palavra Selecionada */}
            {selectedWord && (
              <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-md space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      Palavra Selecionada: <strong className="text-blue-700">"{selectedWord.palavra_original}"</strong>
                    </span>
                    <span className="text-xs text-slate-400">
                      (Nº {selectedWord.index + 1} de {words.length})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedWordIndex(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                  >
                    Fechar
                  </button>
                </div>

                {/* Seleção do Status Principal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Classificação da Leitura:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSetWordStatus(selectedWord.index, 'correta')}
                      className={`p-2 rounded-xl border font-bold transition-all ${
                        selectedWord.status === 'correta'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      ✓ Correta
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetWordStatus(selectedWord.index, 'substituida')}
                      className={`p-2 rounded-xl border font-bold transition-all ${
                        selectedWord.status === 'substituida'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      ✎ Substituída
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetWordStatus(selectedWord.index, 'omitida')}
                      className={`p-2 rounded-xl border font-bold transition-all ${
                        selectedWord.status === 'omitida'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      ✕ Omitida
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetWordStatus(selectedWord.index, 'incorreta')}
                      className={`p-2 rounded-xl border font-bold transition-all ${
                        selectedWord.status === 'incorreta'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      ⚠ Incorreta
                    </button>
                  </div>
                </div>

                {/* Campo opcional de palavra pronunciada (para substituição) */}
                {selectedWord.status === 'substituida' && (
                  <div className="pt-1">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      O que o aluno pronunciou no lugar? (Opcional):
                    </label>
                    <input
                      type="text"
                      value={selectedWord.palavra_lida || ''}
                      onChange={(e) => handleSetWordStatus(selectedWord.index, 'substituida', e.target.value)}
                      placeholder="Ex: 'pala' ao invés de 'mala'"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Ocorrências Complementares & Última Palavra */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-500">Ocorrências:</span>
                    {(['autocorrecao', 'repeticao', 'insercao'] as ComplementaryOccurrence[]).map((occ) => {
                      const isActive = selectedWord.ocorrencias.includes(occ);
                      const label = occ === 'autocorrecao' ? 'Autocorreção' : occ === 'repeticao' ? 'Repetição' : 'Inserção';
                      return (
                        <button
                          key={occ}
                          type="button"
                          onClick={() => handleToggleOccurrence(selectedWord.index, occ)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLastReachedIndex(selectedWord.index);
                      addToast('Limite definido', `A leitura foi delimitada até a palavra "${selectedWord.palavra_original}".`, 'info');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px]"
                  >
                    <Flag className="w-3.5 h-3.5 text-blue-600" />
                    <span>Definir como última palavra lida</span>
                  </button>
                </div>
              </div>
            )}

            {/* Rubrica Pedagógica de Prosódia (Apenas para Textos Curtos) */}
            {assessment.material_tipo === 'texto_curto' && (
              <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Rubrica de Prosódia (Avaliação Humana)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Instrumento de acompanhamento pedagógico qualitativo para narrativas contínuas.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Apenas Textos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Dimensão 1: Pontuação e Pausas */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 block">1. Pontuação e Pausas:</span>
                    <p className="text-[11px] text-slate-500">Respeita vírgulas e pontos finais no trecho lido.</p>
                    <select
                      value={prosody.pontuacao_pausas}
                      onChange={(e) => setProsody({ ...prosody, pontuacao_pausas: parseInt(e.target.value) as ProsodyScore })}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      <option value={0}>0 — Não avaliado</option>
                      <option value={1}>1 — Necessita de apoio frequente (ignora pausas)</option>
                      <option value={2}>2 — Em desenvolvimento (pausas ocasionais)</option>
                      <option value={3}>3 — Consistente no trecho (pausas precisas)</option>
                    </select>
                  </div>

                  {/* Dimensão 2: Entonação */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 block">2. Entonação Expressiva:</span>
                    <p className="text-[11px] text-slate-500">Modulação de voz de acordo com o sentido do texto.</p>
                    <select
                      value={prosody.entonacao}
                      onChange={(e) => setProsody({ ...prosody, entonacao: parseInt(e.target.value) as ProsodyScore })}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      <option value={0}>0 — Não avaliado</option>
                      <option value={1}>1 — Monótona / Leitura robotizada</option>
                      <option value={2}>2 — Entonação parcial ou oscilante</option>
                      <option value={3}>3 — Expressiva e natural</option>
                    </select>
                  </div>

                  {/* Dimensão 3: Ritmo e Continuidade */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 block">3. Ritmo e Continuidade:</span>
                    <p className="text-[11px] text-slate-500">Fluidez contínua sem quebras excessivas de fala.</p>
                    <select
                      value={prosody.ritmo_continuidade}
                      onChange={(e) => setProsody({ ...prosody, ritmo_continuidade: parseInt(e.target.value) as ProsodyScore })}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      <option value={0}>0 — Não avaliado</option>
                      <option value={1}>1 — Ritmo truncado e silabado</option>
                      <option value={2}>2 — Ritmo em transição</option>
                      <option value={3}>3 — Fluido e contínuo</option>
                    </select>
                  </div>

                  {/* Dimensão 4: Agrupamento em Unidades de Sentido */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 block">4. Agrupamento de Palavras:</span>
                    <p className="text-[11px] text-slate-500">Lê sintagmas completos em vez de palavra por palavra.</p>
                    <select
                      value={prosody.agrupamento_sentido}
                      onChange={(e) => setProsody({ ...prosody, agrupamento_sentido: parseInt(e.target.value) as ProsodyScore })}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      <option value={0}>0 — Não avaliado</option>
                      <option value={1}>1 — Leitura palavra por palavra</option>
                      <option value={2}>2 — Agrupa frases curtas</option>
                      <option value={3}>3 — Agrupa sentenças completas</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Comentário da Prosódia (Opcional):
                  </label>
                  <input
                    type="text"
                    value={prosody.comentarios || ''}
                    onChange={(e) => setProsody({ ...prosody, comentarios: e.target.value })}
                    placeholder="Ex: Aluno respeitou bem as exclamações, mas hesitou nas vírgulas..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA (1/3): Painel de Indicadores Pedagógicos, IA & Anotações */}
          <div className="space-y-5">
            
            {/* Card Principal: Indicadores Calculados */}
            <div className="p-5 rounded-3xl bg-linear-to-b from-blue-900 to-indigo-950 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-blue-800/80 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  Indicadores Pedagógicos
                </span>
                <span className="text-[10px] text-blue-300 font-mono">
                  {PROTOCOLO_VERSAO_PADRAO}
                </span>
              </div>

              {/* PCPM e Precisão em destaque */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
                  <span className="text-[11px] text-blue-200 font-medium block">PCPM (Taxa):</span>
                  <p className="text-3xl font-extrabold text-white mt-0.5 font-mono">
                    {calc.pcpm}
                  </p>
                  <p className="text-[10px] text-blue-300 mt-1 leading-tight">
                    Palavras Corretas / Minuto
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
                  <span className="text-[11px] text-blue-200 font-medium block">Precisão:</span>
                  <p className="text-3xl font-extrabold text-white mt-0.5 font-mono">
                    {calc.precisaoPercentual}%
                  </p>
                  <p className="text-[10px] text-blue-300 mt-1 leading-tight">
                    Acertos no trecho lido
                  </p>
                </div>
              </div>

              {/* Tabela de Contagem */}
              <div className="space-y-1.5 text-xs text-blue-100/90 pt-2 border-t border-blue-800/60">
                <div className="flex justify-between py-1 border-b border-blue-800/40">
                  <span>Palavras no trecho avaliado (N):</span>
                  <strong className="font-mono text-white">{calc.totalPalavrasTrecho}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-blue-800/40 text-emerald-300">
                  <span>Palavras corretas (C):</span>
                  <strong className="font-mono">{calc.totalCorretas}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-blue-800/40 text-rose-300">
                  <span>Total de erros:</span>
                  <strong className="font-mono">{calc.totalErros}</strong>
                </div>
                <div className="pl-3 space-y-0.5 text-[11px] text-blue-200/80">
                  <div className="flex justify-between">
                    <span>• Substituições:</span>
                    <span>{calc.totalSubstituicoes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Omissões:</span>
                    <span>{calc.totalOmissoes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Incorretas:</span>
                    <span>{calc.totalIncorretas}</span>
                  </div>
                </div>
                <div className="flex justify-between py-1 pt-2 border-t border-blue-800/40 text-amber-200">
                  <span>Ocorrências complementares:</span>
                  <span>{calc.totalAutocorrecoes + calc.totalRepeticoes + calc.totalInsercoes}</span>
                </div>
                <div className="pl-3 space-y-0.5 text-[11px] text-blue-200/80">
                  <div className="flex justify-between">
                    <span>• Autocorreções:</span>
                    <span>{calc.totalAutocorrecoes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Repetições:</span>
                    <span>{calc.totalRepeticoes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Inserções:</span>
                    <span>{calc.totalInsercoes}</span>
                  </div>
                </div>
              </div>

              {/* Alerta de Validação */}
              {calc.hasPendingWords && (
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{calc.pendingCount} palavra(s) pendente(s) no trecho lido.</span>
                </div>
              )}
            </div>

            {/* Assistência Opcional de IA */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">Assistência de Transcrição (IA)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Opcional</span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Gera uma transcrição preliminar da fala como sugestão. Não altera marcações nem finaliza avaliações automaticamente.
              </p>

              {aiSuggestion ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 font-serif max-h-32 overflow-y-auto">
                    <p className="font-bold text-[10px] text-indigo-600 mb-1 font-sans uppercase">Sugestão não revisada:</p>
                    "{aiSuggestion}"
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiConsentDialog(true)}
                    disabled={isLoadingAi}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    Gerar novamente com IA
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAiConsentDialog(true)}
                  disabled={isLoadingAi}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isLoadingAi ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Processando áudio...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gerar Sugestão de Transcrição</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Observações e Encaminhamentos */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Observações da Leitura:
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Anotações sobre a execução da leitura..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Encaminhamentos Pedagógicos:
                </label>
                <textarea
                  rows={2}
                  value={encaminhamentos}
                  onChange={(e) => setEncaminhamentos(e.target.value)}
                  placeholder="Ações sugeridas (ex: atividades com dígrafos, leitura em eco)..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Barra Inferior com Ações de Salvamento e Finalização */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {calc.hasPendingWords ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                {calc.pendingCount} palavra(s) precisam de revisão para finalizar
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Todas as palavras do trecho foram revisadas
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Rascunho</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving || calc.hasPendingWords}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-md transition-colors disabled:opacity-40"
            >
              {isSaving ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Finalizando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalizar Avaliação</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diálogo de Confirmação: Marcar Pendentes como Corretas */}
        {showMarkPendingConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-slate-200 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-slate-900">Marcar pendentes como corretas?</h4>
              <p className="text-xs text-slate-500">
                Todas as {calc.pendingCount} palavras que ainda estão pendentes dentro do trecho avaliado serão marcadas como "Correta". Você ainda poderá alterar palavras pontuais depois.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowMarkPendingConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleMarkAllPendingAsCorrect}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Sim, Marcar como Corretas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Diálogo de Consentimento: Assistência de IA */}
        {showAiConsentDialog && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-slate-200 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-slate-900">Solicitar Sugestão de Transcrição?</h4>
              <p className="text-xs text-slate-500 text-left leading-relaxed">
                O áudio gravado será enviado ao serviço de inteligência artificial configurado no sistema para gerar uma <strong>sugestão preliminar de transcrição</strong>.
                <br /><br />
                • A sugestão <strong>não altera notas nem marcações</strong> automaticamente.<br />
                • A correção e a decisão pedagógica permanecem sob total responsabilidade do professor.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiConsentDialog(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRequestAiSuggestion}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Concordar e Enviar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Volume2, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  Clock, 
  User, 
  GraduationCap, 
  FileText, 
  Maximize2, 
  Minimize2, 
  Download, 
  Save, 
  Trash2,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Student, ClassRoom, ReadingMaterial, AssessmentMode } from '../../types/database';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { formatRecordingDuration } from '../../services/audioStorageService';
import { CreateAssessmentPayload } from '../../services/assessmentService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface NewAssessmentFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  students: Student[];
  materials: ReadingMaterial[];
  preselectedClassId?: string;
  preselectedStudentId?: string;
  onSaveAssessment: (payload: CreateAssessmentPayload, audioBlob: Blob) => Promise<void>;
}

type FlowStep = 'select_class' | 'select_student' | 'select_material' | 'review_config' | 'reading_record' | 'review_audio';

export const NewAssessmentFlowModal: React.FC<NewAssessmentFlowModalProps> = ({
  isOpen,
  onClose,
  classes,
  students,
  materials,
  preselectedClassId,
  preselectedStudentId,
  onSaveAssessment,
}) => {
  const { profile } = useAuth();
  const { addToast } = useToast();

  // Selected State
  const [currentStep, setCurrentStep] = useState<FlowStep>('select_class');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [mode, setMode] = useState<AssessmentMode>('60_segundos');
  const [fontSizePx, setFontSizePx] = useState<number>(24);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [startTimeIso, setStartTimeIso] = useState<string>('');

  // Confirmation modals inside the flow
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);
  const [showReRecordConfirm, setShowReRecordConfirm] = useState<boolean>(false);

  const readingContainerRef = useRef<HTMLDivElement>(null);

  // Hook do gravador
  const {
    status,
    elapsedSeconds,
    audioBlob,
    audioUrl,
    audioMimeType,
    micVolume,
    errorMessage,
    startMicTest,
    stopMicTest,
    startRecording,
    stopRecording,
    discardRecording,
    clearError,
  } = useAudioRecorder(() => {
    // Callback disparado quando o modo 60s atinge 60 segundos exatos
    addToast('Tempo limite atingido', 'A gravação de 60 segundos foi finalizada automaticamente.', 'info');
    setCurrentStep('review_audio');
  });

  // Inicializar com pré-seleções quando aberto
  useEffect(() => {
    if (isOpen) {
      if (preselectedClassId) {
        setSelectedClassId(preselectedClassId);
        if (preselectedStudentId) {
          setSelectedStudentId(preselectedStudentId);
          setCurrentStep('select_material');
        } else {
          setCurrentStep('select_student');
        }
      } else {
        setCurrentStep('select_class');
        setSelectedClassId(classes[0]?.id || '');
      }
    } else {
      discardRecording();
      setIsFullscreen(false);
      setNotes('');
    }
  }, [isOpen, preselectedClassId, preselectedStudentId, classes, discardRecording]);

  // Bloqueio de saída do navegador com gravação ativa ou não salva
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'recording' || (audioBlob && currentStep === 'review_audio')) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status, audioBlob, currentStep]);

  if (!isOpen) return null;

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const classStudents = students.filter((s) => s.turma_id === selectedClassId);
  const currentStudent = students.find((s) => s.id === selectedStudentId);
  const currentMaterial = materials.find((m) => m.id === selectedMaterialId);

  // Manipulação de Fullscreen
  const toggleFullscreen = () => {
    if (!readingContainerRef.current) return;
    if (!document.fullscreenElement) {
      readingContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleStartRecording = async () => {
    setStartTimeIso(new Date().toISOString());
    const ok = await startRecording(mode);
    if (!ok) {
      addToast('Erro no microfone', 'Não foi possível capturar o áudio.', 'error');
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    setCurrentStep('review_audio');
  };

  const handleSave = async () => {
    if (!audioBlob || !currentStudent || !currentClass || !currentMaterial) {
      addToast('Dados incompletos', 'Verifique a gravação e o aluno selecionado.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const payload: CreateAssessmentPayload = {
        escola_id: currentStudent.escola_id,
        professor_id: profile?.id || 'prof-anonimo',
        professor_nome: profile?.nome || 'Professor Avaliador',
        turma_id: currentClass.id,
        aluno_id: currentStudent.id,
        material_id: currentMaterial.id,
        material_titulo: currentMaterial.titulo,
        material_tipo: currentMaterial.tipo,
        material_conteudo_snapshot: currentMaterial.conteudo,
        modalidade: mode,
        data_inicio: startTimeIso || new Date().toISOString(),
        duracao_segundos: elapsedSeconds,
        audio_mime_type: audioMimeType,
        observacoes: notes,
      };

      await onSaveAssessment(payload, audioBlob);
      addToast('Avaliação salva com sucesso!', `A gravação de ${currentStudent.nome} foi armazenada.`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar', 'Ocorreu uma falha ao enviar a gravação. Você pode tentar novamente ou baixar o arquivo de segurança.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    if (!audioBlob) return;
    const extension = audioMimeType.includes('mp4') ? 'mp4' : 'webm';
    const filename = `leitura_${currentStudent?.matricula || 'aluno'}_${Date.now()}.${extension}`;
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    addToast('Cópia baixada', 'Arquivo de áudio salvo no seu dispositivo.', 'info');
  };

  const handleCloseAttempt = () => {
    if (status === 'recording') {
      addToast('Gravação em andamento', 'Encerre a gravação antes de sair.', 'warning');
      return;
    }
    if (audioBlob && currentStep === 'review_audio') {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div 
        ref={readingContainerRef}
        className={`relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden ${
          isFullscreen ? 'fixed inset-0 max-w-none max-h-none rounded-none z-50' : ''
        }`}
      >
        {/* Header com indicador de etapas */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-xs">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Nova Avaliação de Leitura</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                  Fase 2: Gravação Real
                </span>
              </div>
              <p className="text-xs text-blue-200">
                {currentStep === 'select_class' && 'Passo 1 de 4: Escolha a turma'}
                {currentStep === 'select_student' && 'Passo 2 de 4: Escolha o(a) aluno(a)'}
                {currentStep === 'select_material' && 'Passo 3 de 4: Escolha o material de leitura'}
                {currentStep === 'review_config' && 'Passo 4 de 4: Revisar e testar microfone'}
                {currentStep === 'reading_record' && 'Tela de Leitura e Gravação'}
                {currentStep === 'review_audio' && 'Revisão do Áudio Gravado'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentStep === 'reading_record' && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                title={isFullscreen ? 'Sair da tela cheia' : 'Modo tela cheia'}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            )}
            <button
              type="button"
              onClick={handleCloseAttempt}
              disabled={status === 'recording'}
              className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mensagem de Erro de Microfone */}
        {errorMessage && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-rose-800 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-xs font-semibold text-rose-700 hover:underline"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Corpo do Modal por Etapa */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ETAPA 1: SELECIONAR TURMA */}
          {currentStep === 'select_class' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Selecione a Turma</h4>
                  <p className="text-xs text-slate-500">Escolha a turma da escola participante</p>
                </div>
              </div>

              {classes.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Nenhuma turma cadastrada</p>
                  <p className="text-xs text-slate-500">Cadastre turmas na aba "Turmas" antes de avaliar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {classes.map((c) => {
                    const studentCount = students.filter((s) => s.turma_id === c.id).length;
                    const isSelected = selectedClassId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedClassId(c.id)}
                        className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900">{c.nome}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {c.ano_serie}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">Turno: {c.turno} • Ano Letivo: {c.ano_letivo}</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                          <span className="font-medium">{studentCount} aluno(s)</span>
                          {isSelected && <span className="text-blue-600 font-bold flex items-center gap-1">Selecionada <Check className="w-3.5 h-3.5" /></span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ETAPA 2: SELECIONAR ALUNO */}
          {currentStep === 'select_student' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Selecione o(a) Aluno(a)</h4>
                  <p className="text-xs text-slate-500">Turma: <strong>{currentClass?.nome}</strong> ({classStudents.length} alunos)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep('select_class')}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Trocar turma
                </button>
              </div>

              {classStudents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <User className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Nenhum aluno nesta turma</p>
                  <p className="text-xs text-slate-500">Cadastre alunos na turma ou importe via CSV.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
                  {classStudents.map((s) => {
                    const isSelected = selectedStudentId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-sm text-slate-900 truncate">{s.nome}</p>
                          <p className="text-xs text-slate-500">Matrícula: {s.matricula}</p>
                        </div>
                        {isSelected ? (
                          <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full border border-slate-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ETAPA 3: SELECIONAR MATERIAL */}
          {currentStep === 'select_material' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Selecione o Material de Leitura</h4>
                  <p className="text-xs text-slate-500">Prática pedagógica para verificação de fluência</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-1">
                {materials.map((m) => {
                  const isSelected = selectedMaterialId === m.id;
                  const typeLabel = m.tipo === 'palavras' ? 'Lista de Palavras' : m.tipo === 'pseudopalavras' ? 'Pseudopalavras' : 'Texto Curto';
                  const typeColor = m.tipo === 'palavras' ? 'bg-blue-100 text-blue-800' : m.tipo === 'pseudopalavras' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMaterialId(m.id)}
                      className={`p-4 rounded-2xl text-left border transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${typeColor}`}>
                            {typeLabel}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{m.ano_escolar}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <h5 className="font-bold text-sm text-slate-900 mb-1">{m.titulo}</h5>
                      <p className="text-xs text-slate-600 line-clamp-2 italic font-serif bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                        "{m.conteudo}"
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ETAPA 4: REVISAR CONFIGURAÇÃO & TESTAR MICROFONE */}
          {currentStep === 'review_config' && currentStudent && currentClass && currentMaterial && (
            <div className="space-y-6">
              {/* Resumo do Aluno e Material */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium block mb-1">Aluno(a):</span>
                  <p className="text-sm font-bold text-slate-900">{currentStudent.nome}</p>
                  <p className="text-xs text-slate-500">Matrícula: {currentStudent.matricula}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium block mb-1">Turma:</span>
                  <p className="text-sm font-bold text-slate-900">{currentClass.nome}</p>
                  <p className="text-xs text-slate-500">{currentClass.ano_serie} • {currentClass.turno}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium block mb-1">Material Selecionado:</span>
                  <p className="text-sm font-bold text-slate-900 truncate">{currentMaterial.titulo}</p>
                  <p className="text-xs text-slate-500 capitalize">{currentMaterial.tipo.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Escolha da Modalidade do Cronômetro */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <label className="text-sm font-bold text-slate-900 block">Modalidade da Leitura:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('60_segundos')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      mode === '60_segundos'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">Leitura de 60 segundos</span>
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-slate-500">Encerramento automático aos 60 segundos de leitura.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('livre')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      mode === 'livre'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">Leitura Livre</span>
                      <Mic className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xs text-slate-500">O professor encerra a gravação manualmente quando o aluno terminar.</p>
                  </button>
                </div>
              </div>

              {/* Teste de Microfone */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold text-slate-900">Teste de Captação do Microfone</span>
                  </div>
                  {status === 'testing' ? (
                    <button
                      type="button"
                      onClick={stopMicTest}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300"
                    >
                      Parar teste
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startMicTest}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                    >
                      Testar microfone agora
                    </button>
                  )}
                </div>

                {status === 'testing' && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Fale algo para testar o nível de som:</span>
                      <span className="font-bold">{micVolume}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-75 rounded-full ${
                          micVolume > 70 ? 'bg-rose-500' : micVolume > 30 ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.max(4, micVolume)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      ✓ Microfone funcionando perfeitamente! Pronto para a avaliação.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ETAPA 5: TELA DE LEITURA & GRAVAÇÃO EFETIVA */}
          {currentStep === 'reading_record' && currentStudent && currentClass && currentMaterial && (
            <div className="space-y-5">
              {/* Barra superior de leitura */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-100 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs">
                    {currentStudent.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{currentStudent.nome}</p>
                    <p className="text-xs text-slate-500">{currentClass.nome} • Modalidade: {mode === '60_segundos' ? '60 Segundos' : 'Livre'}</p>
                  </div>
                </div>

                {/* Cronômetro e indicador de gravação */}
                <div className="flex items-center gap-3">
                  {status === 'recording' ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold animate-pulse">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-600"></span>
                      <span>GRAVANDO LEITURA</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold">
                      <span>Pronto para iniciar</span>
                    </div>
                  )}

                  {/* Contador de Tempo Decorrido Real */}
                  <div className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-mono font-bold text-base shadow-xs min-w-[90px] text-center">
                    {elapsedSeconds.toFixed(1)} s
                  </div>

                  {/* Controles de Tamanho da Fonte */}
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                    <button
                      type="button"
                      onClick={() => setFontSizePx((prev) => Math.max(16, prev - 2))}
                      className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 border-r border-slate-200"
                      title="Diminuir fonte"
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSizePx((prev) => Math.min(42, prev + 2))}
                      className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      title="Aumentar fonte"
                    >
                      A+
                    </button>
                  </div>
                </div>
              </div>

              {/* Área do Texto do Material de Leitura */}
              <div 
                className="p-6 sm:p-8 rounded-3xl bg-amber-50/40 border border-amber-200/60 shadow-xs max-h-[50vh] overflow-y-auto"
                style={{ fontSize: `${fontSizePx}px`, lineHeight: 1.65 }}
              >
                <div className="text-center mb-6">
                  <h4 className="font-bold text-slate-900 opacity-90 text-[0.8em] uppercase tracking-wider mb-1">
                    {currentMaterial.titulo}
                  </h4>
                  <div className="h-0.5 w-16 bg-blue-600 mx-auto rounded-full"></div>
                </div>

                <div className="font-serif text-slate-800 text-justify select-none font-normal tracking-wide">
                  {currentMaterial.conteudo}
                </div>
              </div>

              {/* Controles de Gravação Grandes */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                {status !== 'recording' ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-base shadow-lg hover:bg-emerald-700 transition-all focus:ring-4 focus:ring-emerald-500/30 scale-100 hover:scale-102"
                  >
                    <Mic className="w-6 h-6 animate-bounce" />
                    <span>Iniciar Gravação</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-rose-600 text-white font-bold text-base shadow-lg hover:bg-rose-700 transition-all focus:ring-4 focus:ring-rose-500/30 animate-pulse"
                  >
                    <Square className="w-6 h-6 fill-white" />
                    <span>Encerrar Gravação</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ETAPA 6: REVISÃO DO ÁUDIO GRAVADO ANTES DE SALVAR */}
          {currentStep === 'review_audio' && currentStudent && currentClass && currentMaterial && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">Gravação Concluída com Sucesso</h4>
                    <p className="text-xs text-emerald-700">
                      Escute o áudio abaixo antes de salvar no sistema.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Duração Efetiva:</span>
                  <span className="font-mono text-base font-bold text-slate-900">
                    {formatRecordingDuration(elapsedSeconds)}
                  </span>
                </div>
              </div>

              {/* Player de Áudio */}
              {audioUrl && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Áudio da Leitura ({audioMimeType})</span>
                    <span>Tamanho: {(audioBlob ? (audioBlob.size / 1024).toFixed(1) : 0)} KB</span>
                  </div>
                  <audio 
                    controls 
                    src={audioUrl} 
                    className="w-full rounded-lg"
                    preload="auto"
                  />
                </div>
              )}

              {/* Informações da Avaliação */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Aluno:</span>
                  <strong className="text-slate-900 block truncate">{currentStudent.nome}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Turma:</span>
                  <strong className="text-slate-900 block truncate">{currentClass.nome}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Material Utilizado:</span>
                  <strong className="text-slate-900 block truncate">{currentMaterial.titulo}</strong>
                </div>
              </div>

              {/* Observações do Professor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Observações do Professor (Opcional):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Aluno leu com boa entonação; hesitou em palavras com dígrafos; realizou autocorreção..."
                  rows={3}
                  className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Ações de Revisão */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReRecordConfirm(true)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Gravar Novamente</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200"
                    title="Baixar arquivo de áudio no computador"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Baixar Cópia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDiscardConfirm(true)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Descartar</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Salvando Gravação...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Avaliação</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé com Botões de Navegação das Etapas */}
        {currentStep !== 'reading_record' && currentStep !== 'review_audio' && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
            <div>
              {currentStep !== 'select_class' && (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 'select_student') setCurrentStep('select_class');
                    if (currentStep === 'select_material') setCurrentStep('select_student');
                    if (currentStep === 'review_config') setCurrentStep('select_material');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Voltar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCloseAttempt}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancelar
              </button>

              {currentStep === 'select_class' && (
                <button
                  type="button"
                  onClick={() => setCurrentStep('select_student')}
                  disabled={!selectedClassId}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40"
                >
                  <span>Continuar para Aluno</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 'select_student' && (
                <button
                  type="button"
                  onClick={() => setCurrentStep('select_material')}
                  disabled={!selectedStudentId}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40"
                >
                  <span>Continuar para Material</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 'select_material' && (
                <button
                  type="button"
                  onClick={() => setCurrentStep('review_config')}
                  disabled={!selectedMaterialId}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40"
                >
                  <span>Revisar e Configurar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 'review_config' && (
                <button
                  type="button"
                  onClick={() => {
                    stopMicTest();
                    setCurrentStep('reading_record');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-md hover:bg-emerald-700"
                >
                  <span>Ir para Tela de Leitura</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal de Confirmação: Descartar Gravação */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-slate-200 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-slate-900">Descartar gravação atual?</h4>
              <p className="text-xs text-slate-500">
                O áudio gravado será perdido e não será salvo no histórico. Deseja realmente descartar?
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    discardRecording();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                >
                  Sim, Descartar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação: Gravar Novamente */}
        {showReRecordConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-slate-200 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-slate-900">Substituir gravação?</h4>
              <p className="text-xs text-slate-500">
                A gravação atual será descartada e você voltará para a tela de leitura para gravar novamente.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowReRecordConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReRecordConfirm(false);
                    discardRecording();
                    setCurrentStep('reading_record');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700"
                >
                  Sim, Gravar Novamente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

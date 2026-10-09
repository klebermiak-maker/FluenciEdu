import { WordEvaluation, WordMarkingType, EvaluationDetails, ProsodyRubric, ReadingMaterialType } from '../types/database';

export const PROTOCOLO_VERSAO_PADRAO = 'Protocolo FluenciEdu v1.0 (2026)';
export const SEGMENTACAO_VERSAO_PADRAO = 'Segmentação Ortográfica FluenciEdu v1.0';

export interface CalculationResult {
  isValidTime: boolean;
  tempoAvaliado: number;
  totalPalavrasTrecho: number; // N
  totalCorretas: number; // C
  totalErros: number;
  totalSubstituicoes: number;
  totalOmissoes: number;
  totalIncorretas: number;
  totalAutocorrecoes: number;
  totalRepeticoes: number;
  totalInsercoes: number;
  pcpm: number;
  precisaoPercentual: number;
  hasPendingWords: boolean;
  pendingCount: number;
  isConsistent: boolean; // C + erros === N
}

export const fluencyProtocolService = {
  /**
   * Segmenta o texto congelado em tokens de palavras individuais.
   * Regra documentada:
   * - Preserva palavras com hífen como uma única unidade (ex: 'guarda-chuva', 'pula-pula').
   * - Preserva apóstrofos internos (ex: 'd\'água').
   * - Isola pontuações anexas (, . ! ? : ;) para exibição visual correta sem contabilizar como palavra.
   */
  segmentText(text: string): WordEvaluation[] {
    if (!text || !text.trim()) return [];

    // Normalizar quebras de linha e espaços
    const rawTokens = text.trim().split(/\s+/);
    const words: WordEvaluation[] = [];

    let wordIndex = 0;

    for (let i = 0; i < rawTokens.length; i++) {
      const raw = rawTokens[i];

      // Expressão para extrair pontuações iniciais/finais e o corpo da palavra
      // Mantém hífens e apóstrofos internos na palavra
      const match = raw.match(/^([«"“'(\[]*)([\wÀ-ÿ0-9'-]+)([»"”')\].,!?;:]*)$/);

      if (match) {
        const prefix = match[1] || '';
        const coreWord = match[2];
        const punctuation = match[3] || '';

        // Se o coreWord não for vazio, é uma palavra válida
        if (coreWord && coreWord.length > 0) {
          words.push({
            id: `word_${wordIndex}`,
            index: wordIndex,
            palavra_original: prefix + coreWord,
            pontuacao_anexa: punctuation,
            status: 'pendente',
            ocorrencias: [],
            nao_alcancada: false,
          });
          wordIndex++;
        }
      } else {
        // Fallback para caracteres especiais
        const clean = raw.replace(/[^\wÀ-ÿ0-9'-]/g, '');
        const punct = raw.replace(/[\wÀ-ÿ0-9'-]/g, '');
        if (clean.length > 0) {
          words.push({
            id: `word_${wordIndex}`,
            index: wordIndex,
            palavra_original: clean,
            pontuacao_anexa: punct,
            status: 'pendente',
            ocorrencias: [],
            nao_alcancada: false,
          });
          wordIndex++;
        }
      }
    }

    return words;
  },

  /**
   * Calcula rigorosamente os indicadores de fluência e valida a consistência.
   */
  calculateIndicators(
    words: WordEvaluation[],
    startTime: number,
    endTime: number,
    lastReachedIndex: number
  ): CalculationResult {
    const tempoAvaliado = Math.max(0, endTime - startTime);
    const isValidTime = tempoAvaliado > 0;

    const evaluatedWords = words.filter((w) => w.index <= lastReachedIndex);
    const totalPalavrasTrecho = evaluatedWords.length; // N

    let totalCorretas = 0;
    let totalSubstituicoes = 0;
    let totalOmissoes = 0;
    let totalIncorretas = 0;
    let totalAutocorrecoes = 0;
    let totalRepeticoes = 0;
    let totalInsercoes = 0;
    let pendingCount = 0;

    for (const w of evaluatedWords) {
      if (w.status === 'correta') {
        totalCorretas++;
      } else if (w.status === 'substituida') {
        totalSubstituicoes++;
      } else if (w.status === 'omitida') {
        totalOmissoes++;
      } else if (w.status === 'incorreta') {
        totalIncorretas++;
      } else if (w.status === 'pendente') {
        pendingCount++;
      }

      if (w.ocorrencias.includes('autocorrecao')) totalAutocorrecoes++;
      if (w.ocorrencias.includes('repeticao')) totalRepeticoes++;
      if (w.ocorrencias.includes('insercao')) totalInsercoes++;
    }

    const totalErros = totalSubstituicoes + totalOmissoes + totalIncorretas;
    const hasPendingWords = pendingCount > 0;
    const isConsistent = totalCorretas + totalErros === totalPalavrasTrecho;

    // Fórmulas pedagógicas:
    // PCPM = (C * 60) / T
    // Precisão = (C / N) * 100
    let pcpm = 0;
    let precisaoPercentual = 0;

    if (isValidTime && tempoAvaliado > 0) {
      pcpm = (totalCorretas * 60) / tempoAvaliado;
    }

    if (totalPalavrasTrecho > 0) {
      precisaoPercentual = (totalCorretas / totalPalavrasTrecho) * 100;
    }

    return {
      isValidTime,
      tempoAvaliado,
      totalPalavrasTrecho,
      totalCorretas,
      totalErros,
      totalSubstituicoes,
      totalOmissoes,
      totalIncorretas,
      totalAutocorrecoes,
      totalRepeticoes,
      totalInsercoes,
      pcpm: Math.round(pcpm * 10) / 10,
      precisaoPercentual: Math.round(precisaoPercentual * 10) / 10,
      hasPendingWords,
      pendingCount,
      isConsistent,
    };
  },
};

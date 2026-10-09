import { CSVPreviewItem, ClassRoom, Student } from '../types/database';

export function generateCSVTemplate(): string {
  return `Nome,Matricula,Data de Nascimento,Turma
Arthur Vinícius Pereira,2026-101,15/04/2018,2º Ano A
Beatriz Helena Vasconcelos,2026-102,23/07/2018,2º Ano A
Caio Roberto Fontes,2026-103,11/02/2018,2º Ano B
Daniela Souza Castro,2026-104,09/11/2017,3º Ano A
Eduardo Miguel Dias,2026-105,30/05/2018,2º Ano A`;
}

// Convert DD/MM/YYYY or YYYY-MM-DD to ISO standard YYYY-MM-DD
export function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();

  // Pattern DD/MM/YYYY or DD-MM-YYYY
  const brMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    const year = brMatch[3];
    const iso = `${year}-${month}-${day}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }

  // Pattern YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    const iso = `${year}-${month}-${day}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }

  return null;
}

export function parseCSVStudents(
  csvContent: string,
  availableClasses: ClassRoom[],
  existingStudents: Student[]
): CSVPreviewItem[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return [];
  }

  // Detect delimiter (; or ,)
  const headerLine = lines[0];
  const delimiter = headerLine.includes(';') ? ';' : ',';

  // Normalize header names
  const headers = headerLine
    .split(delimiter)
    .map((h) => h.trim().toLowerCase().replace(/["']/g, ''));

  const colNome = headers.findIndex((h) => h.includes('nome') || h.includes('aluno'));
  const colMatricula = headers.findIndex((h) => h.includes('matr') || h.includes('cod') || h.includes('id'));
  const colNasc = headers.findIndex((h) => h.includes('nasc') || h.includes('data'));
  const colTurma = headers.findIndex((h) => h.includes('turma') || h.includes('série') || h.includes('serie') || h.includes('ano'));

  const previewItems: CSVPreviewItem[] = [];
  const seenMatriculasInBatch = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Handle quoted values with delimiter
    const cols = line
      .split(delimiter)
      .map((c) => c.trim().replace(/^["']|["']$/g, ''));

    const rawNome = colNome !== -1 ? cols[colNome] || '' : cols[0] || '';
    const rawMatricula = colMatricula !== -1 ? cols[colMatricula] || '' : cols[1] || '';
    const rawNasc = colNasc !== -1 ? cols[colNasc] || '' : cols[2] || '';
    const rawTurma = colTurma !== -1 ? cols[colTurma] || '' : cols[3] || '';

    const errors: string[] = [];

    // 1. Validate Nome
    if (!rawNome || rawNome.trim().length < 3) {
      errors.push('Nome inválido ou com menos de 3 caracteres');
    }

    // 2. Validate Matrícula
    const cleanMatricula = rawMatricula.trim().toUpperCase();
    if (!cleanMatricula) {
      errors.push('Matrícula obrigatória');
    } else if (seenMatriculasInBatch.has(cleanMatricula)) {
      errors.push(`Matrícula duplicada no próprio arquivo (${cleanMatricula})`);
    } else {
      seenMatriculasInBatch.add(cleanMatricula);
    }

    // Check duplicate in existing database
    const isDuplicate = existingStudents.some(
      (s) => s.matricula.toUpperCase() === cleanMatricula
    );
    if (isDuplicate) {
      errors.push(`Matrícula já cadastrada no sistema (${cleanMatricula})`);
    }

    // 3. Validate Data de Nascimento
    const normalizedDate = normalizeDate(rawNasc);
    if (!normalizedDate) {
      errors.push('Data de nascimento inválida (use DD/MM/AAAA)');
    }

    // 4. Validate and match Class
    let matchedClassId: string | undefined = undefined;
    if (!rawTurma) {
      errors.push('Turma não informada');
    } else {
      const match = availableClasses.find(
        (c) =>
          c.nome.toLowerCase() === rawTurma.toLowerCase().trim() ||
          c.nome.toLowerCase().includes(rawTurma.toLowerCase().trim()) ||
          c.ano_serie.toLowerCase() === rawTurma.toLowerCase().trim()
      );
      if (match) {
        matchedClassId = match.id;
      } else {
        errors.push(`Turma "${rawTurma}" não encontrada no sistema`);
      }
    }

    previewItems.push({
      id: `preview-${i}`,
      nome: rawNome.trim(),
      matricula: cleanMatricula,
      data_nascimento: normalizedDate || rawNasc,
      turma: rawTurma,
      turma_id: matchedClassId,
      isValid: errors.length === 0,
      errors,
      isDuplicate,
    });
  }

  return previewItems;
}

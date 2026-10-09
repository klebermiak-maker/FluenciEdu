import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, ClassRoom, School, Assessment, EvaluationDetails } from '../types/database';
import { formatDateTimeCuiaba, formatRecordingDuration } from './audioStorageService';

// Prevenção de injeção de fórmulas no Excel CSV (=, +, -, @, tab, cr)
function sanitizeCSVField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  let str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  // Escapar aspas duplas
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const pdfExportService = {
  exportStudentsPDF(
    students: Student[],
    classes: ClassRoom[],
    schools: School[],
    filterInfo?: {
      schoolName?: string;
      className?: string;
      searchTerm?: string;
    }
  ) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Prefeitura Municipal de Itaúba - MT • SEMEC', 14, 11);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('FluenciEdu — Relatório de Alunos Cadastrados', 14, 17);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema Municipal de Avaliação de Fluência Leitora • Anos Iniciais do Ensino Fundamental', 14, 22);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Filtros e Parâmetros de Emissão:', 14, 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const filterLines: string[] = [
      `Data de Emissão: ${formattedDate} às ${formattedTime}`,
      `Escola Selecionada: ${filterInfo?.schoolName || 'Todas as Escolas'}`,
      `Turma Selecionada: ${filterInfo?.className || 'Todas as Turmas'}`,
    ];
    if (filterInfo?.searchTerm) {
      filterLines.push(`Termo de Busca: "${filterInfo.searchTerm}"`);
    }
    filterLines.push(`Total de Alunos Listados: ${students.length}`);

    let metaY = 37;
    filterLines.forEach((line) => {
      doc.text(line, 14, metaY);
      metaY += 4.5;
    });

    const tableRows = students.map((student, index) => {
      const cls = classes.find((c) => c.id === student.turma_id);
      const school = schools.find((s) => s.id === student.escola_id);
      const birthFormatted = new Date(student.data_nascimento).toLocaleDateString('pt-BR');

      return [
        (index + 1).toString(),
        student.nome,
        student.matricula,
        birthFormatted,
        cls ? `${cls.nome} (${cls.ano_serie})` : 'Não informada',
        school ? school.nome : 'Não vinculada',
      ];
    });

    autoTable(doc, {
      startY: metaY + 4,
      head: [['Nº', 'Nome do Aluno', 'Matrícula', 'Data Nasc.', 'Turma / Série', 'Escola']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 26, fontStyle: 'bold' },
        3: { cellWidth: 22 },
        4: { cellWidth: 35 },
        5: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Prefeitura de Itaúba - MT • SEMEC • FluenciEdu • Página ${data.pageNumber} de ${pageCount}`,
          14,
          290
        );
      },
    });

    const filename = `relatorio_alunos_${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  },

  exportClassesPDF(
    classes: ClassRoom[],
    schools: School[],
    students: Student[],
    filterInfo?: {
      schoolName?: string;
      searchTerm?: string;
    }
  ) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Prefeitura Municipal de Itaúba - MT • SEMEC', 14, 11);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('FluenciEdu — Relatório Geral de Turmas', 14, 17);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema Municipal de Avaliação de Fluência Leitora • Rede Municipal de Ensino', 14, 22);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Filtros e Parâmetros de Emissão:', 14, 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const filterLines: string[] = [
      `Data de Emissão: ${formattedDate} às ${formattedTime}`,
      `Escola Selecionada: ${filterInfo?.schoolName || 'Todas as Escolas'}`,
    ];
    if (filterInfo?.searchTerm) {
      filterLines.push(`Termo de Busca: "${filterInfo.searchTerm}"`);
    }

    const totalStudentsInClasses = classes.reduce((acc, c) => {
      return acc + students.filter((s) => s.turma_id === c.id).length;
    }, 0);

    filterLines.push(`Total de Turmas Listadas: ${classes.length}`);
    filterLines.push(`Total de Alunos Alocados: ${totalStudentsInClasses}`);

    let metaY = 37;
    filterLines.forEach((line) => {
      doc.text(line, 14, metaY);
      metaY += 4.5;
    });

    const tableRows = classes.map((cls, index) => {
      const school = schools.find((s) => s.id === cls.escola_id);
      const studentCount = students.filter((s) => s.turma_id === cls.id).length;

      return [
        (index + 1).toString(),
        cls.nome,
        cls.ano_serie,
        cls.turno,
        cls.ano_letivo.toString(),
        school ? school.nome : 'Não vinculada',
        `${studentCount} aluno(s)`,
      ];
    });

    autoTable(doc, {
      startY: metaY + 4,
      head: [['Nº', 'Turma', 'Série', 'Turno', 'Ano Letivo', 'Escola', 'Alunos Matriculados']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { cellWidth: 24 },
        3: { cellWidth: 22 },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 32, halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Prefeitura de Itaúba - MT • SEMEC • FluenciEdu • Página ${data.pageNumber} de ${pageCount}`,
          14,
          290
        );
      },
    });

    const filename = `relatorio_turmas_${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  },

  /**
   * FASE 3: Relatório Individual de Desempenho em Fluência Leitora (PDF)
   */
  exportIndividualAssessmentPDF(
    assessment: Assessment,
    student: Student | undefined,
    classRoom: ClassRoom | undefined,
    school: School | undefined,
    details: EvaluationDetails
  ) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Faixa Institucional
    doc.setFillColor(30, 58, 138); // Blue 900
    doc.rect(0, 0, 210, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Prefeitura Municipal de Itaúba - MT • SEMEC', 14, 11);

    doc.setFontSize(11);
    doc.text('Relatório Individual de Fluência Leitora', 14, 17);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema Municipal de Avaliação Formativa • Protocolo Pedagógico FluenciEdu', 14, 22);

    let currentY = 33;

    // Dados do Estudante e Turma
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 22, 2, 2, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Estudante:', 18, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(student?.nome || 'Não localizado', 38, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('Matrícula:', 130, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(student?.matricula || '---', 148, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.text('Turma / Série:', 18, currentY + 12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${classRoom?.nome || 'Turma'} (${classRoom?.ano_serie || '-'})`, 42, currentY + 12);

    doc.setFont('helvetica', 'bold');
    doc.text('Escola:', 130, currentY + 12);
    doc.setFont('helvetica', 'normal');
    doc.text(school?.nome || 'Não vinculada', 144, currentY + 12);

    doc.setFont('helvetica', 'bold');
    doc.text('Data / Hora (MT):', 18, currentY + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateTimeCuiaba(assessment.created_at), 46, currentY + 18);

    doc.setFont('helvetica', 'bold');
    doc.text('Avaliador(a):', 130, currentY + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(details.professor_revisor_nome || assessment.professor_nome, 150, currentY + 18);

    currentY += 28;

    // Tabela dos Indicadores Calculados
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text('Indicadores de Fluência Leitora (Fórmulas Pedagógicas):', 14, currentY);

    currentY += 4;

    const indicatorsBody = [
      ['Material de Leitura Utilizado', `${assessment.material_titulo} (${assessment.material_tipo.replace('_', ' ')})`],
      ['Modalidade da Aplicação', assessment.modalidade === '60_segundos' ? '60 Segundos' : 'Leitura Livre'],
      ['Duração Total do Áudio Gravado', formatRecordingDuration(assessment.duracao_segundos)],
      ['Trecho Efetivamente Avaliado (T)', `${details.tempo_avaliado_segundos.toFixed(1)} segundos (de ${details.tempo_inicio_segundos.toFixed(1)}s a ${details.tempo_fim_segundos.toFixed(1)}s)`],
      ['Palavras no Trecho Avaliado (N)', `${details.total_palavras_trecho} palavras`],
      ['Palavras Corretas no Trecho (C)', `${details.total_corretas} palavras`],
      ['Taxa de Palavras Corretas por Minuto (PCPM)', `${details.pcpm} PCPM [Fórmula: C × 60 ÷ T]`],
      ['Índice de Precisão no Trecho', `${details.precisao_percentual}% [Fórmula: C ÷ N × 100]`],
      ['Erros Observados (Substituições / Omissões / Pronúncia)', `${details.total_erros} (Subst: ${details.total_substituicoes}, Omiss: ${details.total_omissoes}, Incorr: ${details.total_incorretas})`],
      ['Ocorrências Complementares (Sem impacto no PCPM)', `Autocorreções: ${details.total_autocorrecoes} | Repetições: ${details.total_repeticoes} | Inserções: ${details.total_insercoes}`],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Parâmetro / Indicador', 'Resultado Apurado pelo Professor']],
      body: indicatorsBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Rubrica de Prosódia (se houver)
    if (details.rubrica_prosodia && assessment.material_tipo === 'texto_curto') {
      const p = details.rubrica_prosodia;
      const formatScore = (s: number) =>
        s === 3 ? '3 — Consistente no trecho' : s === 2 ? '2 — Em desenvolvimento' : s === 1 ? '1 — Necessita apoio frequente' : 'Não avaliado';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 138);
      doc.text('Avaliação Qualitativa de Prosódia (Humana):', 14, currentY);

      currentY += 4;

      autoTable(doc, {
        startY: currentY,
        head: [['Dimensão Observável', 'Nível de Domínio']],
        body: [
          ['1. Respeito à Pontuação e Pausas', formatScore(p.pontuacao_pausas)],
          ['2. Entonação Expressiva', formatScore(p.entonacao)],
          ['3. Ritmo e Continuidade', formatScore(p.ritmo_continuidade)],
          ['4. Agrupamento em Unidades de Sentido', formatScore(p.agrupamento_sentido)],
          ['Comentário Pedagógico da Prosódia', p.comentarios || 'Sem observações adicionais.'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 8.5 },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' } },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // Observações do Professor e Encaminhamentos
    if (details.observacoes_professor || details.encaminhamentos_pedagogicos) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);

      if (details.observacoes_professor) {
        doc.text('Anotações da Leitura:', 14, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(details.observacoes_professor, 14, currentY + 4, { maxWidth: 182 });
        currentY += 12;
      }

      if (details.encaminhamentos_pedagogicos) {
        doc.setFont('helvetica', 'bold');
        doc.text('Encaminhamentos Pedagógicos Sugeridos:', 14, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(details.encaminhamentos_pedagogicos, 14, currentY + 4, { maxWidth: 182 });
        currentY += 12;
      }
    }

    // Rodapé Institucional e Protocolo
    const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Prefeitura de Itaúba - MT • SEMEC • FluenciEdu • ${details.protocolo_versao} • Página ${i} de ${pageCount}`,
        14,
        290
      );
    }

    const filename = `relatorio_individual_${student?.matricula || 'aluno'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  },

  /**
   * FASE 3: Relatório Consolidado da Turma em PDF
   */
  exportClassAssessmentsPDF(
    assessments: Assessment[],
    students: Student[],
    classRoom: ClassRoom | undefined,
    school: School | undefined,
    filtersDesc?: string
  ) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 297, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Prefeitura Municipal de Itaúba - MT • SEMEC', 14, 10);

    doc.setFontSize(10);
    doc.text(`Relatório de Desempenho em Fluência Leitora — ${classRoom?.nome || 'Turma'} (${classRoom?.ano_serie || '-'})`, 14, 16);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Escola: ${school?.nome || 'Não vinculada'} • Emissão: ${formattedDate} • ${filtersDesc || ''}`, 14, 28);

    const tableRows = assessments.map((a, index) => {
      const student = students.find((s) => s.id === a.aluno_id || s.id === a.student_id);
      const d = a.avaliacao_detalhes;

      return [
        (index + 1).toString(),
        student?.nome || 'Aluno',
        student?.matricula || '-',
        a.material_titulo,
        a.modalidade === '60_segundos' ? '60s' : 'Livre',
        formatDateTimeCuiaba(a.created_at).slice(0, 10),
        d ? `${d.tempo_avaliado_segundos.toFixed(1)}s` : `${a.duracao_segundos.toFixed(1)}s (tot)`,
        d ? d.total_corretas.toString() : '-',
        d ? d.total_erros.toString() : '-',
        d ? `${d.pcpm}` : 'Pendente',
        d ? `${d.precisao_percentual}%` : 'Pendente',
        d?.estado_correcao === 'revisada' ? 'Revisada' : d?.estado_correcao === 'em_correcao' ? 'Rascunho' : 'Aguardando',
      ];
    });

    autoTable(doc, {
      startY: 32,
      head: [['Nº', 'Estudante', 'Matrícula', 'Material', 'Modal.', 'Data', 'Tempo Aval.', 'Corretas', 'Erros', 'PCPM', 'Precisão', 'Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 20 },
        3: { cellWidth: 45 },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 16, halign: 'center' },
        8: { cellWidth: 14, halign: 'center' },
        9: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        10: { cellWidth: 18, halign: 'center' },
        11: { cellWidth: 'auto', halign: 'center' },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Prefeitura de Itaúba - MT • SEMEC • FluenciEdu • Página ${data.pageNumber} de ${pageCount}`,
          14,
          200
        );
      },
    });

    const filename = `relatorio_turma_${classRoom?.nome?.replace(/\s+/g, '_') || 'turma'}_${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  },

  /**
   * FASE 3: Exportação em CSV compatível com Excel (UTF-8 BOM + Sanitização de Fórmulas)
   */
  exportClassAssessmentsCSV(
    assessments: Assessment[],
    students: Student[],
    classes: ClassRoom[],
    schools: School[]
  ) {
    const headers = [
      'ID_Avaliacao',
      'Estudante',
      'Matricula',
      'Turma',
      'Serie',
      'Escola',
      'Material_Titulo',
      'Material_Tipo',
      'Modalidade',
      'Data_Gravacao_MT',
      'Duracao_Total_s',
      'Tempo_Avaliado_s',
      'Palavras_Avaliadas_N',
      'Palavras_Corretas_C',
      'Total_Erros',
      'Substituicoes',
      'Omissoes',
      'Incorretas',
      'Autocorrecoes',
      'Repeticoes',
      'Insercoes',
      'PCPM_Taxa',
      'Precisao_Percentual',
      'Status_Correcao',
      'Professor_Revisor',
      'Observacoes_Professor',
    ];

    const rows = assessments.map((a) => {
      const student = students.find((s) => s.id === a.aluno_id || s.id === a.student_id);
      const cls = classes.find((c) => c.id === a.turma_id);
      const school = schools.find((s) => s.id === a.escola_id);
      const d = a.avaliacao_detalhes;

      return [
        sanitizeCSVField(a.id),
        sanitizeCSVField(student?.nome),
        sanitizeCSVField(student?.matricula),
        sanitizeCSVField(cls?.nome),
        sanitizeCSVField(cls?.ano_serie),
        sanitizeCSVField(school?.nome),
        sanitizeCSVField(a.material_titulo),
        sanitizeCSVField(a.material_tipo),
        sanitizeCSVField(a.modalidade),
        sanitizeCSVField(formatDateTimeCuiaba(a.created_at)),
        sanitizeCSVField(a.duracao_segundos),
        sanitizeCSVField(d ? d.tempo_avaliado_segundos : ''),
        sanitizeCSVField(d ? d.total_palavras_trecho : ''),
        sanitizeCSVField(d ? d.total_corretas : ''),
        sanitizeCSVField(d ? d.total_erros : ''),
        sanitizeCSVField(d ? d.total_substituicoes : ''),
        sanitizeCSVField(d ? d.total_omissoes : ''),
        sanitizeCSVField(d ? d.total_incorretas : ''),
        sanitizeCSVField(d ? d.total_autocorrecoes : ''),
        sanitizeCSVField(d ? d.total_repeticoes : ''),
        sanitizeCSVField(d ? d.total_insercoes : ''),
        sanitizeCSVField(d ? d.pcpm : ''),
        sanitizeCSVField(d ? d.precisao_percentual : ''),
        sanitizeCSVField(d?.estado_correcao || 'nao_avaliada'),
        sanitizeCSVField(d?.professor_revisor_nome || a.professor_nome),
        sanitizeCSVField(d?.observacoes_professor || a.observacoes),
      ].join(';');
    });

    // UTF-8 BOM (\uFEFF) para forçar o Excel a abrir com acentos corretos em português
    const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `avaliacoes_fluenciedu_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

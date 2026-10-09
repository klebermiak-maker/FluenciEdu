import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, ClassRoom, School } from '../types/database';

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

    // Header Background Accent
    doc.setFillColor(30, 58, 138); // Blue 900
    doc.rect(0, 0, 210, 24, 'F');

    // Header Title
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

    // Meta details block
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

    // Table rows
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
        // Footer on each page
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

    // Header Background Accent
    doc.setFillColor(30, 58, 138); // Blue 900
    doc.rect(0, 0, 210, 24, 'F');

    // Header Title
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

    // Meta details block
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

    // Table rows
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
};

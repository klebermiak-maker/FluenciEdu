import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  X, 
  HelpCircle,
  FileText,
  RotateCcw
} from 'lucide-react';
import { School, ClassRoom, Student, CSVPreviewItem, NavigationPage } from '../../types/database';
import { generateCSVTemplate, parseCSVStudents } from '../../services/csvParser';
import { useToast } from '../../contexts/ToastContext';

interface ImportStudentsPageProps {
  schools: School[];
  classes: ClassRoom[];
  students: Student[];
  onImportConfirm: (
    items: {
      nome: string;
      matricula: string;
      data_nascimento: string;
      turma_id: string;
      escola_id: string;
    }[]
  ) => Promise<{ insertedCount: number; errors: string[] }>;
  onNavigate: (page: NavigationPage) => void;
}

export const ImportStudentsPage: React.FC<ImportStudentsPageProps> = ({
  schools,
  classes,
  students,
  onImportConfirm,
  onNavigate,
}) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');
  const [fileName, setFileName] = useState<string>('');
  const [csvPreview, setCsvPreview] = useState<CSVPreviewItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'csv' | 'excel'>('csv');

  // Filter classes belonging to the selected school
  const schoolClasses = classes.filter((c) => c.escola_id === selectedSchoolId);

  // Download sample CSV
  const handleDownloadTemplate = () => {
    const content = generateCSVTemplate();
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_importacao_alunos_fluenciedu.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Download iniciado', 'Modelo CSV baixado com sucesso.', 'info');
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      addToast('Formato inválido', 'Selecione um arquivo no formato CSV (.csv).', 'warning');
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const preview = parseCSVStudents(text, schoolClasses, students);
        setCsvPreview(preview);
        if (preview.length === 0) {
          addToast('Arquivo vazio ou inválido', 'Não encontramos linhas de dados válidas no arquivo.', 'warning');
        } else {
          addToast(
            'Arquivo carregado',
            `${preview.length} aluno(s) lidos na prévia. Verifique os dados abaixo.`,
            'info'
          );
        }
      } catch (err) {
        addToast('Erro ao processar', 'Falha ao processar o arquivo CSV.', 'error');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const validItems = csvPreview.filter((i) => i.isValid);
  const invalidItems = csvPreview.filter((i) => !i.isValid);

  const handleConfirmImport = async () => {
    if (validItems.length === 0) {
      addToast('Nenhum registro válido', 'Corrija os erros na planilha antes de importar.', 'warning');
      return;
    }

    setIsImporting(true);
    try {
      const itemsToInsert = validItems.map((item) => ({
        nome: item.nome,
        matricula: item.matricula,
        data_nascimento: item.data_nascimento,
        turma_id: item.turma_id || schoolClasses[0]?.id,
        escola_id: selectedSchoolId,
      }));

      const res = await onImportConfirm(itemsToInsert);

      if (res.insertedCount > 0) {
        addToast(
          'Importação concluída!',
          `${res.insertedCount} aluno(s) importados com sucesso!`,
          'success'
        );
        setCsvPreview([]);
        setFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        onNavigate('students');
      } else {
        addToast('Falha na importação', 'Nenhum aluno foi inserido.', 'error');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    setCsvPreview([]);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Importação de Alunos em Lote
          </h2>
          <p className="text-sm text-slate-500">
            Adicione múltiplos alunos de uma só vez a partir de um arquivo CSV padronizado
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm shadow-xs hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-blue-500 shrink-0"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>Baixar Planilha Modelo (.csv)</span>
        </button>
      </div>

      {/* Tabs: CSV vs Excel */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('csv')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'csv'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Arquivo CSV (Ativo)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('excel')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'excel'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Planilha Excel (.xlsx)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
            Em breve
          </span>
        </button>
      </div>

      {activeTab === 'excel' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-2xl mx-auto space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Módulo Excel (.xlsx / .xls) Preparado
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            A estrutura do sistema já possui o mapeamento dos campos e validações necessárias. Na Fase 1, você pode facilmente exportar sua planilha Excel como <strong>CSV (.csv)</strong> e realizar a importação imediatamente!
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            Usar importador CSV agora
          </button>
        </div>
      ) : (
        <>
          {/* School Selector & Upload Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: School */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-[11px]">1</span>
                <span>Selecione a Escola de Destino</span>
              </div>
              <p className="text-xs text-slate-500">
                Os alunos serão importados e associados a esta instituição de ensino:
              </p>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.nome} ({school.municipio} - {school.estado})
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                Turmas cadastradas nesta escola: <strong>{schoolClasses.length}</strong>
              </div>
            </div>

            {/* Step 2: Upload box */}
            <div className="md:col-span-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 shadow-xs flex flex-col items-center justify-center text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-upload"
              />

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-2xs">
                <UploadCloud className="h-6 w-6" />
              </div>

              <label
                htmlFor="csv-file-upload"
                className="cursor-pointer text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Clique aqui para selecionar seu arquivo CSV
              </label>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Colunas necessárias: <span className="font-semibold text-slate-700">Nome, Matrícula, Data de Nascimento, Turma</span>
              </p>

              {fileName && (
                <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>{fileName}</span>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="ml-2 text-blue-400 hover:text-blue-700"
                    title="Remover arquivo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Data Preview */}
          {csvPreview.length > 0 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-slate-700">
                      {validItems.length} registro(s) prontos para importar
                    </span>
                  </div>
                  {invalidItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="flex h-3 w-3 rounded-full bg-rose-500"></span>
                      <span className="text-xs font-bold text-rose-700">
                        {invalidItems.length} com alertas/erros
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={validItems.length === 0 || isImporting}
                    onClick={handleConfirmImport}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isImporting ? 'Importando...' : `Confirmar Importação (${validItems.length})`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Pré-visualização e Validação dos Dados
                  </h3>
                  <span className="text-xs text-slate-500">
                    Total: {csvPreview.length} linha(s) lidas
                  </span>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5 pl-6 pr-3">Status</th>
                        <th className="py-2.5 px-3">Nome</th>
                        <th className="py-2.5 px-3">Matrícula</th>
                        <th className="py-2.5 px-3">Nascimento</th>
                        <th className="py-2.5 px-3">Turma Informada</th>
                        <th className="py-2.5 pl-3 pr-6">Diagnóstico / Erros</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {csvPreview.map((item) => (
                        <tr
                          key={item.id}
                          className={item.isValid ? 'hover:bg-slate-50/80' : 'bg-rose-50/40 hover:bg-rose-50'}
                        >
                          <td className="py-2.5 pl-6 pr-3 whitespace-nowrap">
                            {item.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Válido
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                Erro
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {item.nome}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                            {item.matricula}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {item.data_nascimento}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-slate-800">
                              {item.turma}
                            </span>
                          </td>
                          <td className="py-2.5 pl-3 pr-6">
                            {item.errors.length > 0 ? (
                              <ul className="text-rose-600 font-medium space-y-0.5">
                                {item.errors.map((err, idx) => (
                                  <li key={idx} className="flex items-center gap-1 text-[11px]">
                                    <span className="h-1 w-1 rounded-full bg-rose-500"></span>
                                    {err}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-emerald-600 text-[11px] font-medium">
                                Pronto para inserção
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

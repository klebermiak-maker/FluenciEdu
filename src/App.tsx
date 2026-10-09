import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './components/pages/DashboardPage';
import { SchoolsPage } from './components/pages/SchoolsPage';
import { ClassesPage } from './components/pages/ClassesPage';
import { StudentsPage } from './components/pages/StudentsPage';
import { ReadingMaterialsPage } from './components/pages/ReadingMaterialsPage';
import { AssessmentsPage } from './components/pages/AssessmentsPage';
import { ImportStudentsPage } from './components/pages/ImportStudentsPage';
import { ReportsPage } from './components/pages/ReportsPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { AuthPages } from './components/pages/AuthPages';
import { NewAssessmentFlowModal } from './components/assessments/NewAssessmentFlowModal';
import { ReadingCorrectionModal } from './components/assessments/ReadingCorrectionModal';

import { 
  School, 
  ClassRoom, 
  Student, 
  NavigationPage, 
  ReadingMaterial, 
  Assessment,
  EvaluationDetails 
} from './types/database';
import { schoolService, CreateSchoolDTO } from './services/schoolService';
import { classService, CreateClassDTO } from './services/classService';
import { studentService, CreateStudentDTO } from './services/studentService';
import { materialService, CreateMaterialDTO } from './services/materialService';
import { assessmentService, CreateAssessmentPayload } from './services/assessmentService';

function MainApp() {
  const { session, isLoading: authLoading, profile } = useAuth();
  const { addToast } = useToast();

  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [materials, setMaterials] = useState<ReadingMaterial[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Modal triggers from different pages
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Assessment recording flow modal
  const [isNewAssessmentFlowOpen, setIsNewAssessmentFlowOpen] = useState(false);
  const [preselectedClassId, setPreselectedClassId] = useState<string>('');
  const [preselectedStudentId, setPreselectedStudentId] = useState<string>('');
  const [preselectedMaterialId, setPreselectedMaterialId] = useState<string>('');

  // Assessment correction & evaluation modal (Phase 3)
  const [correctionAssessment, setCorrectionAssessment] = useState<Assessment | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  // Load all initial entities
  const loadAllData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [schoolsData, classesData, studentsData, materialsData, assessmentsData] = await Promise.all([
        schoolService.list(),
        classService.list(),
        studentService.list(),
        materialService.list(),
        assessmentService.list(),
      ]);
      setSchools(schoolsData);
      setClasses(classesData);
      setStudents(studentsData);
      setMaterials(materialsData);
      setAssessments(assessmentsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      addToast('Erro ao carregar dados', 'Verifique sua conexão.', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (session) {
      loadAllData();
    }
  }, [session, loadAllData]);

  // School handlers
  const handleCreateSchool = async (payload: CreateSchoolDTO) => {
    try {
      const created = await schoolService.create(payload);
      setSchools((prev) => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      addToast('Escola cadastrada!', `A unidade "${created.nome}" foi cadastrada com sucesso.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar escola.';
      addToast('Erro no cadastro', msg, 'error');
      throw err;
    }
  };

  const handleUpdateSchool = async (id: string, payload: Partial<CreateSchoolDTO>) => {
    try {
      const updated = await schoolService.update(id, payload);
      setSchools((prev) => prev.map((s) => (s.id === id ? updated : s)));
      addToast('Escola atualizada!', 'As informações foram salvas.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar escola.';
      addToast('Erro ao salvar', msg, 'error');
      throw err;
    }
  };

  const handleDeleteSchool = async (id: string) => {
    try {
      await schoolService.delete(id);
      setSchools((prev) => prev.filter((s) => s.id !== id));
      setClasses((prev) => prev.filter((c) => c.escola_id !== id));
      setStudents((prev) => prev.filter((st) => st.escola_id !== id));
      addToast('Escola excluída', 'A unidade e seus vínculos foram removidos.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir escola.';
      addToast('Erro ao excluir', msg, 'error');
      throw err;
    }
  };

  // Class handlers
  const handleCreateClass = async (payload: CreateClassDTO) => {
    try {
      const created = await classService.create(payload);
      setClasses((prev) => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      addToast('Turma cadastrada!', `A turma "${created.nome}" foi criada com sucesso.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar turma.';
      addToast('Erro no cadastro', msg, 'error');
      throw err;
    }
  };

  const handleUpdateClass = async (id: string, payload: Partial<CreateClassDTO>) => {
    try {
      const updated = await classService.update(id, payload);
      setClasses((prev) => prev.map((c) => (c.id === id ? updated : c)));
      addToast('Turma atualizada!', 'Dados da turma atualizados com sucesso.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar turma.';
      addToast('Erro ao salvar', msg, 'error');
      throw err;
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await classService.delete(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
      setStudents((prev) => prev.filter((st) => st.turma_id !== id));
      addToast('Turma excluída', 'A turma foi removida com sucesso.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir turma.';
      addToast('Erro ao excluir', msg, 'error');
      throw err;
    }
  };

  // Student handlers
  const handleCreateStudent = async (payload: CreateStudentDTO) => {
    try {
      const created = await studentService.create(payload);
      setStudents((prev) => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      addToast('Aluno cadastrado!', `${created.nome} foi cadastrado com sucesso.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar aluno.';
      addToast('Erro no cadastro', msg, 'error');
      throw err;
    }
  };

  const handleUpdateStudent = async (id: string, payload: Partial<CreateStudentDTO>) => {
    try {
      const updated = await studentService.update(id, payload);
      setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
      addToast('Aluno atualizado!', 'Os dados do aluno foram salvos.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar aluno.';
      addToast('Erro ao salvar', msg, 'error');
      throw err;
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await studentService.delete(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setAssessments((prev) => prev.filter((a) => a.aluno_id !== id && a.student_id !== id));
      addToast('Aluno excluído', 'O registro do aluno foi removido.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir aluno.';
      addToast('Erro ao excluir', msg, 'error');
      throw err;
    }
  };

  // Material handlers
  const handleCreateMaterial = async (payload: CreateMaterialDTO) => {
    try {
      const created = await materialService.create(payload);
      setMaterials((prev) => [...prev, created].sort((a, b) => a.titulo.localeCompare(b.titulo)));
      addToast('Material cadastrado!', `"${created.titulo}" foi adicionado com sucesso.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar material.';
      addToast('Erro no cadastro', msg, 'error');
      throw err;
    }
  };

  const handleUpdateMaterial = async (id: string, payload: Partial<CreateMaterialDTO>) => {
    try {
      const updated = await materialService.update(id, payload);
      setMaterials((prev) => prev.map((m) => (m.id === id ? updated : m)));
      addToast('Material atualizado!', 'Alterações salvas com sucesso.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar material.';
      addToast('Erro ao salvar', msg, 'error');
      throw err;
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await materialService.delete(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      addToast('Material excluído', 'O material foi removido do catálogo.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir material.';
      addToast('Erro ao excluir', msg, 'error');
      throw err;
    }
  };

  // Assessment handlers (Phase 2)
  const handleSaveAssessment = async (payload: CreateAssessmentPayload, audioBlob: Blob) => {
    const created = await assessmentService.create(payload, audioBlob);
    setAssessments((prev) => [created, ...prev]);
  };

  const handleDeleteAssessment = async (id: string) => {
    await assessmentService.delete(id);
    setAssessments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateAssessmentNotes = async (id: string, notes: string) => {
    const updated = await assessmentService.updateNotes(id, notes);
    setAssessments((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  // Reading evaluation handlers (Phase 3)
  const handleOpenCorrection = (assessment: Assessment) => {
    setCorrectionAssessment(assessment);
    setIsCorrectionModalOpen(true);
  };

  const handleSaveEvaluation = async (assessmentId: string, details: EvaluationDetails) => {
    try {
      const updated = await assessmentService.saveEvaluationDetails(assessmentId, details);
      setAssessments((prev) => prev.map((a) => (a.id === assessmentId ? updated : a)));
      if (details.estado_correcao === 'revisada') {
        addToast('Avaliação Concluída!', 'Os indicadores de fluência e a correção foram salvos com sucesso.', 'success');
      } else {
        addToast('Rascunho Salvo', 'A correção em andamento foi armazenada.', 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar avaliação.';
      addToast('Erro ao salvar', msg, 'error');
      throw err;
    }
  };

  // Triggering new assessment flow with presets
  const handleOpenNewAssessment = (studentId?: string, classId?: string, materialId?: string) => {
    setPreselectedStudentId(studentId || '');
    setPreselectedClassId(classId || '');
    setPreselectedMaterialId(materialId || '');
    setIsNewAssessmentFlowOpen(true);
  };

  // CSV Batch Import
  const handleImportConfirm = async (
    items: {
      nome: string;
      matricula: string;
      data_nascimento: string;
      turma_id: string;
      escola_id: string;
    }[]
  ) => {
    const res = await studentService.importBatch(items);
    await loadAllData();
    return res;
  };

  // Auth Protection: If not logged in, show AuthPages
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">Carregando FluenciEdu...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPages />;
  }

  // Active school name
  const currentSchool = schools.find((s) => s.id === profile?.escola_id) || schools[0];

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      schoolName={currentSchool?.nome}
    >
      {currentPage === 'dashboard' && (
        <DashboardPage
          schools={schools}
          classes={classes}
          students={students}
          assessments={assessments}
          onNavigate={setCurrentPage}
          onOpenCreateSchool={() => {
            setCurrentPage('schools');
            setIsSchoolModalOpen(true);
          }}
          onOpenCreateClass={() => {
            setCurrentPage('classes');
            setIsClassModalOpen(true);
          }}
          onOpenCreateStudent={() => {
            setCurrentPage('students');
            setIsStudentModalOpen(true);
          }}
          onOpenNewAssessment={() => handleOpenNewAssessment()}
        />
      )}

      {currentPage === 'schools' && (
        <SchoolsPage
          schools={schools}
          classes={classes}
          students={students}
          onCreateSchool={handleCreateSchool}
          onUpdateSchool={handleUpdateSchool}
          onDeleteSchool={handleDeleteSchool}
          isCreateModalOpen={isSchoolModalOpen}
          setIsCreateModalOpen={setIsSchoolModalOpen}
        />
      )}

      {currentPage === 'classes' && (
        <ClassesPage
          classes={classes}
          schools={schools}
          students={students}
          onCreateClass={handleCreateClass}
          onUpdateClass={handleUpdateClass}
          onDeleteClass={handleDeleteClass}
          isCreateModalOpen={isClassModalOpen}
          setIsCreateModalOpen={setIsClassModalOpen}
          onOpenCreateStudentForClass={(classId) => {
            setCurrentPage('students');
            setIsStudentModalOpen(true);
          }}
        />
      )}

      {currentPage === 'students' && (
        <StudentsPage
          students={students}
          schools={schools}
          classes={classes}
          assessments={assessments}
          onCreateStudent={handleCreateStudent}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
          isCreateModalOpen={isStudentModalOpen}
          setIsCreateModalOpen={setIsStudentModalOpen}
          onNavigateToImport={() => setCurrentPage('import')}
          onOpenNewAssessmentForStudent={(studentId, classId) => handleOpenNewAssessment(studentId, classId)}
          onDeleteAssessment={handleDeleteAssessment}
        />
      )}

      {currentPage === 'materials' && (
        <ReadingMaterialsPage
          materials={materials}
          onCreateMaterial={handleCreateMaterial}
          onUpdateMaterial={handleUpdateMaterial}
          onDeleteMaterial={handleDeleteMaterial}
          onStartAssessmentWithMaterial={(matId) => handleOpenNewAssessment(undefined, undefined, matId)}
        />
      )}

      {currentPage === 'assessments' && (
        <AssessmentsPage
          assessments={assessments}
          students={students}
          classes={classes}
          schools={schools}
          materials={materials}
          onOpenNewAssessment={() => handleOpenNewAssessment()}
          onDeleteAssessment={handleDeleteAssessment}
          onUpdateNotes={handleUpdateAssessmentNotes}
          onOpenCorrection={handleOpenCorrection}
        />
      )}

      {currentPage === 'import' && (
        <ImportStudentsPage
          schools={schools}
          classes={classes}
          students={students}
          onImportConfirm={handleImportConfirm}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'reports' && (
        <ReportsPage
          assessments={assessments}
          students={students}
          classes={classes}
          schools={schools}
          materials={materials}
          onOpenCorrection={handleOpenCorrection}
        />
      )}

      {currentPage === 'profile' && (
        <ProfilePage schools={schools} onRefreshData={loadAllData} />
      )}

      {/* Modal de Fluxo de Gravação de Nova Avaliação (Fase 2) */}
      <NewAssessmentFlowModal
        isOpen={isNewAssessmentFlowOpen}
        onClose={() => {
          setIsNewAssessmentFlowOpen(false);
          setPreselectedClassId('');
          setPreselectedStudentId('');
          setPreselectedMaterialId('');
        }}
        classes={classes}
        students={students}
        materials={materials}
        preselectedClassId={preselectedClassId}
        preselectedStudentId={preselectedStudentId}
        onSaveAssessment={handleSaveAssessment}
      />

      {/* Modal de Avaliação e Correção de Leitura (Fase 3) */}
      <ReadingCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => {
          setIsCorrectionModalOpen(false);
          setCorrectionAssessment(null);
        }}
        assessment={correctionAssessment}
        student={
          correctionAssessment
            ? students.find((s) => s.id === correctionAssessment.aluno_id || s.id === correctionAssessment.student_id) || null
            : null
        }
        classRoom={
          correctionAssessment
            ? classes.find((c) => c.id === correctionAssessment.turma_id) || null
            : null
        }
        onSaveEvaluation={handleSaveEvaluation}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './components/pages/DashboardPage';
import { SchoolsPage } from './components/pages/SchoolsPage';
import { ClassesPage } from './components/pages/ClassesPage';
import { StudentsPage } from './components/pages/StudentsPage';
import { ImportStudentsPage } from './components/pages/ImportStudentsPage';
import { AssessmentsPlaceholderPage } from './components/pages/AssessmentsPlaceholderPage';
import { ReportsPlaceholderPage } from './components/pages/ReportsPlaceholderPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { AuthPages } from './components/pages/AuthPages';

import { School, ClassRoom, Student, NavigationPage } from './types/database';
import { schoolService, CreateSchoolDTO } from './services/schoolService';
import { classService, CreateClassDTO } from './services/classService';
import { studentService, CreateStudentDTO } from './services/studentService';

function MainApp() {
  const { session, isLoading: authLoading, profile } = useAuth();
  const { addToast } = useToast();

  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Modal triggers from different pages
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Load all initial entities
  const loadAllData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [schoolsData, classesData, studentsData] = await Promise.all([
        schoolService.list(),
        classService.list(),
        studentService.list(),
      ]);
      setSchools(schoolsData);
      setClasses(classesData);
      setStudents(studentsData);
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
      addToast('Aluno excluído', 'O registro do aluno foi removido.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir aluno.';
      addToast('Erro ao excluir', msg, 'error');
      throw err;
    }
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
        />
      )}

      {currentPage === 'students' && (
        <StudentsPage
          students={students}
          schools={schools}
          classes={classes}
          onCreateStudent={handleCreateStudent}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
          isCreateModalOpen={isStudentModalOpen}
          setIsCreateModalOpen={setIsStudentModalOpen}
          onNavigateToImport={() => setCurrentPage('import')}
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

      {currentPage === 'assessments' && (
        <AssessmentsPlaceholderPage onNavigate={setCurrentPage} />
      )}

      {currentPage === 'reports' && (
        <ReportsPlaceholderPage onNavigate={setCurrentPage} />
      )}

      {currentPage === 'profile' && (
        <ProfilePage schools={schools} onRefreshData={loadAllData} />
      )}
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

import { Profile, UserRole } from '../types/database';
import { supabase, isSupabaseConfigured, localDB } from './supabase';

const CURRENT_USER_KEY = 'fluenciedu_itauba_session_v2';

export interface UserSession {
  id: string;
  email: string;
  profile: Profile;
}

export const authService = {
  async getInitialSession(): Promise<UserSession | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            return {
              id: session.user.id,
              email: session.user.email || '',
              profile: profile as Profile,
            };
          }
        }
      } catch (err) {
        console.error('Erro ao verificar sessão Supabase:', err);
      }
    }

    // Local fallback session
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fallback to default
      }
    }

    // Default seeded session for immediate testability if none found
    const profiles = localDB.getProfiles();
    const defaultProfile = profiles[0] || {
      id: 'user-demo-1',
      nome: 'Profª. Juliana Albuquerque',
      email: 'juliana.prof@itauba.mt.gov.br',
      role: 'professor',
      escola_id: 'school-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const session: UserSession = {
      id: defaultProfile.id,
      email: defaultProfile.email,
      profile: defaultProfile,
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
    return session;
  },

  async login(email: string, password: string): Promise<UserSession> {
    if (!email || !password) {
      throw new Error('E-mail e senha são obrigatórios.');
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error('Falha ao autenticar.');

      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (pError) throw pError;

      const session: UserSession = {
        id: data.user.id,
        email: data.user.email || email,
        profile: profile as Profile,
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
      return session;
    }

    // Local authentication logic
    const profiles = localDB.getProfiles();
    let foundProfile = profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());

    if (!foundProfile) {
      // Create user automatically for painless demo/testing
      foundProfile = {
        id: `user-${Date.now()}`,
        nome: email.split('@')[0].replace(/[._-]/g, ' '),
        email: email.trim().toLowerCase(),
        role: 'professor',
        escola_id: 'school-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      profiles.push(foundProfile);
      localDB.saveProfiles(profiles);
    }

    const session: UserSession = {
      id: foundProfile.id,
      email: foundProfile.email,
      profile: foundProfile,
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
    return session;
  },

  async signUp(
    nome: string,
    email: string,
    password: string,
    role: UserRole = 'professor',
    escola_id?: string
  ): Promise<UserSession> {
    if (!nome.trim() || !email.trim() || !password) {
      throw new Error('Por favor, preencha todos os campos obrigatórios.');
    }

    if (password.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres.');
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nome: nome.trim(),
            role,
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Não foi possível registrar o usuário.');

      const newProfile: Profile = {
        id: data.user.id,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        role,
        escola_id: escola_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const session: UserSession = {
        id: data.user.id,
        email: newProfile.email,
        profile: newProfile,
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
      return session;
    }

    // Local mode registration
    const profiles = localDB.getProfiles();
    const existing = profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      role,
      escola_id: escola_id || 'school-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    profiles.push(newProfile);
    localDB.saveProfiles(profiles);

    const session: UserSession = {
      id: newProfile.id,
      email: newProfile.email,
      profile: newProfile,
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
    return session;
  },

  async resetPassword(email: string): Promise<void> {
    if (!email || !email.includes('@')) {
      throw new Error('Por favor, informe um endereço de e-mail válido.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      return;
    }

    // Simulate recovery email in demo mode
    await new Promise((resolve) => setTimeout(resolve, 600));
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Erro no logout Supabase:', err);
      }
    }
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  async updateProfile(
    userId: string,
    updates: { nome?: string; escola_id?: string | null; role?: UserRole }
  ): Promise<Profile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const profiles = localDB.getProfiles();
    const idx = profiles.findIndex((p) => p.id === userId);
    if (idx === -1) throw new Error('Perfil não encontrado');

    const updated = {
      ...profiles[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    profiles[idx] = updated;
    localDB.saveProfiles(profiles);

    // Update session storage
    const currentSession = this.getCurrentSession();
    if (currentSession && currentSession.id === userId) {
      currentSession.profile = updated;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentSession));
    }

    return updated;
  },

  getCurrentSession(): UserSession | null {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Helper for fast switching roles in demo mode
  async switchDemoUser(role: UserRole): Promise<UserSession> {
    const profiles = localDB.getProfiles();
    let target = profiles.find((p) => p.role === role);
    if (!target) {
      target = {
        id: `user-demo-${role}`,
        nome: role === 'admin' ? 'Administrador Sistema' : role === 'gestor' ? 'Gestor Pedagógico' : 'Professor(a) Alfabetizador(a)',
        email: `${role}@fluenciedu.com.br`,
        role,
        escola_id: 'school-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      profiles.push(target);
      localDB.saveProfiles(profiles);
    }

    const session: UserSession = {
      id: target.id,
      email: target.email,
      profile: target,
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
    return session;
  }
};

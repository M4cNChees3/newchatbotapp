import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type UserRole = Database['public']['Tables']['athletes']['Row']['role'];

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, userData: SignUpData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

interface SignUpData {
  name: string;
  age?: number;
  sport_type?: string;
  fitness_goal?: string;
  dietary_restrictions?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // EXTRACT ROLE DIRECTLY FROM PASSED SESSION
  // ==========================================
  // No longer async, no longer calls getSession(), completely immune to race conditions
  const extractAndSetRole = (session: Session | null) => {
    const role = session?.user?.user_metadata?.role;
    console.log('Processing session role:', role);

    if (role === 'admin' || role === 'user') {
      setUserRole(role);
    } else {
      setUserRole(null);
    }
  };

  // Optional: If you want to use the database table instead of metadata, swap with this:
  /*
  const fetchRoleFromDatabase = async (userId: string) => {
    const { data } = await supabase.from('athletes').select('role').eq('id', userId).single();
    if (data?.role) setUserRole(data.role as UserRole);
  };
  */

  const refreshUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    extractAndSetRole(session);
  };

  // =========================
  // INITIAL AUTH & LISTENER
  // =========================
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        setUser(session?.user ?? null);
        extractAndSetRole(session);
      } catch (error) {
        console.error('Initialize auth error:', error);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // =========================
    // AUTH STATE LISTENER
    // =========================
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log('Auth state changed event:', event);
          
          const currentUser = session?.user ?? null;
          setUser(currentUser);

          // CRITICAL FIX: Extract the role directly from the event payload.
          // Do not await an external getSession call here.
          extractAndSetRole(session);
          
        } catch (error) {
          console.error('Auth state change error:', error);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // =========================
  // SIGN UP
  // =========================
  const signUp = async (email: string, password: string, userData: SignUpData) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          age: userData.age,
          sport_type: userData.sport_type,
          fitness_goal: userData.fitness_goal,
          dietary_restrictions: userData.dietary_restrictions,
          role: 'user', // Default role assigned to metadata
        },
      },
    });

    if (error) throw error;
  };

  // =========================
  // SIGN IN
  // =========================
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // =========================
  // SIGN OUT
  // =========================
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setUserRole(null);
  };

  const isAdmin = userRole === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        isAdmin,
        loading,
        signUp,
        signIn,
        signOut,
        refreshUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useIsAdmin() {
  return useAuth().isAdmin;
}
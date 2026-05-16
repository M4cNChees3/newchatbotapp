import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
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

  // Extract role directly from session payload
  const extractAndSetRole = useCallback((session: Session | null) => {
    const role = session?.user?.user_metadata?.role;
    console.log('Processing session role:', role);

    if (role === 'admin' || role === 'user') {
      setUserRole(role);
    } else {
      setUserRole(null);
    }
  }, []);

  const refreshUserRole = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    extractAndSetRole(session);
  }, [extractAndSetRole]);

  // Stable auth initializer and state observer
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log('Auth state changed event:', event);
          
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          extractAndSetRole(session);
          
        } catch (error) {
          console.error('Auth state change error:', error);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [extractAndSetRole]);

  // Memoized Sign Up
  const signUp = useCallback(async (email: string, password: string, userData: SignUpData) => {
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
          role: 'user',
        },
      },
    });
    if (error) throw error;
  }, []);

  // Memoized Sign In
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  // Memoized Sign Out
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setUserRole(null);
  }, []);

  const isAdmin = userRole === 'admin';

  // Memoize the context value payload to stop unnecessary child updates
  const contextValue = useMemo(() => ({
    user,
    userRole,
    isAdmin,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUserRole,
  }), [user, userRole, isAdmin, loading, signUp, signIn, signOut, refreshUserRole]);

  return (
    <AuthContext.Provider value={contextValue}>
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
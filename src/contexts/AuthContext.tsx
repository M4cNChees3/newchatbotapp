import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import { User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

import { Database } from '../lib/database.types';

type UserRole =
  Database['public']['Tables']['athletes']['Row']['role'];

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  loading: boolean;

  signUp: (
    email: string,
    password: string,
    userData: SignUpData
  ) => Promise<void>;

  signIn: (
    email: string,
    password: string
  ) => Promise<void>;

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

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [userRole, setUserRole] =
    useState<UserRole | null>(null);

  const [loading, setLoading] =
    useState(true);

  // =========================
  // Fetch User Role
  // =========================
  const fetchUserRole = async (
    userId: string
  ) => {
    try {
      console.log(
        'Fetching role for user:',
        userId
      );

      const { data, error } = await supabase
        .from('athletes')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      console.log('Role query result:', data);

      if (error) {
        console.error(
          'Error fetching user role:',
          error
        );

        setUserRole(null);
        return;
      }

      if (!data) {
        console.warn(
          'No athlete row found for user'
        );

        setUserRole(null);
        return;
      }

      setUserRole(data.role);
    } catch (error) {
      console.error(
        'Unexpected role fetch error:',
        error
      );

      setUserRole(null);
    }
  };

  // =========================
  // Refresh Role
  // =========================
  const refreshUserRole = async () => {
    if (!user) return;

    await fetchUserRole(user.id);
  };

  // =========================
  // Initial Session Load
  // =========================
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log(
          'Initial session:',
          session
        );

        const currentUser =
          session?.user ?? null;

        setUser(currentUser);

        if (currentUser) {
          await fetchUserRole(
            currentUser.id
          );
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error(
          'Error initializing auth:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // =========================
    // Auth State Listener
    // =========================
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          console.log(
            'Auth state changed:',
            _event
          );

          setLoading(true);

          const currentUser =
            session?.user ?? null;

          setUser(currentUser);

          if (currentUser) {
            await fetchUserRole(
              currentUser.id
            );
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error(
            'Auth state error:',
            error
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // =========================
  // Sign Up
  // =========================
  const signUp = async (
    email: string,
    password: string,
    userData: SignUpData
  ) => {
    const { error } =
      await supabase.auth.signUp({
        email,
        password,

        options: {
          data: {
            name: userData.name,
            age: userData.age,
            sport_type:
              userData.sport_type,
            fitness_goal:
              userData.fitness_goal,
            dietary_restrictions:
              userData.dietary_restrictions,
          },
        },
      });

    if (error) {
      throw error;
    }
  };

  // =========================
  // Sign In
  // =========================
  const signIn = async (
    email: string,
    password: string
  ) => {
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      throw error;
    }
  };

  // =========================
  // Sign Out
  // =========================
  const signOut = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
    setUserRole(null);
  };

  // =========================
  // Admin Check
  // =========================
  const isAdmin =
    userRole === 'admin';

  console.log('Current Auth State:', {
    user,
    userRole,
    isAdmin,
    loading,
  });

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

// =========================
// Hook
// =========================
export function useAuth() {
  const context =
    useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}

// =========================
// Admin Hook
// =========================
export function useIsAdmin() {
  const { isAdmin } = useAuth();

  return isAdmin;
}
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

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

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
  // FETCH ROLE FROM JWT
  // =========================
  const fetchUserRole = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const role =
        session?.user?.user_metadata?.role;

      console.log('JWT role:', role);

      if (
        role === 'admin' ||
        role === 'user'
      ) {
        setUserRole(role);
      } else {
        setUserRole(null);
      }
    } catch (error) {
      console.error(
        'Error fetching JWT role:',
        error
      );

      setUserRole(null);
    }
  };

  const refreshUserRole = async () => {
    await fetchUserRole();
  };

  // =========================
  // INITIAL AUTH
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

        await fetchUserRole();
      } catch (error) {
        console.error(
          'Initialize auth error:',
          error
        );

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log(
            'Auth state changed:',
            event
          );

          const currentUser =
            session?.user ?? null;

          setUser(currentUser);

          // DO NOT SET GLOBAL LOADING HERE
          // causes infinite loading on tab switch

          await fetchUserRole();
        } catch (error) {
          console.error(
            'Auth state change error:',
            error
          );
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
  const signUp = async (
    email: string,
    password: string,
    userData: SignUpData
  ) => {
    try {
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

              // DEFAULT ROLE
              role: 'user',
            },
          },
        });

      if (error) {
        console.error(
          'Sign up error:',
          error
        );

        throw error;
      }
    } catch (error) {
      console.error(
        'Unexpected sign up error:',
        error
      );

      throw error;
    }
  };

  // =========================
  // SIGN IN
  // =========================
  const signIn = async (
    email: string,
    password: string
  ) => {
    try {
      const { error } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password,
          }
        );

      if (error) {
        console.error(
          'Sign in error:',
          error
        );

        throw error;
      }
    } catch (error) {
      console.error(
        'Unexpected sign in error:',
        error
      );

      throw error;
    }
  };

  // =========================
  // SIGN OUT
  // =========================
  const signOut = async () => {
    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          'Sign out error:',
          error
        );

        throw error;
      }

      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error(
        'Unexpected sign out error:',
        error
      );

      throw error;
    }
  };

  // =========================
  // ADMIN CHECK
  // =========================
  const isAdmin =
    userRole === 'admin';

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
// HOOKS
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

export function useIsAdmin() {
  const { isAdmin } = useAuth();

  return isAdmin;
}
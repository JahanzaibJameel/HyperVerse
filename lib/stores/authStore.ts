import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthState, UserProfile } from '../services/AuthService';

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  logout: () => void;
  reset: () => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set: any, get: any) => ({
      ...initialState,

      setUser: (user: UserProfile | null) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      updateUser: (updates: Partial<UserProfile>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            ...updates,
            updatedAt: Date.now(),
          };
          set({ user: updatedUser });
        }
      },

      logout: () => {
        set({
          ...initialState,
          isAuthenticated: false,
        });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'hyperverse-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state: any) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

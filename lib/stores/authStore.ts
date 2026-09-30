import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { UserProfile } from '../services/AuthService';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthStore extends AuthState {
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  addXP: (amount: number) => void;
  updateStreak: (increment?: boolean) => void;
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

      addXP: (amount: number) => {
        const currentUser = get().user;
        if (!currentUser) return;

        let newXP = currentUser.xp + amount;
        let newLevel = currentUser.level;
        let newXPToNext = currentUser.xpToNextLevel;

        if (newXP >= currentUser.xpToNextLevel) {
          newLevel += 1;
          const overflowXP = newXP - currentUser.xpToNextLevel;
          newXPToNext = Math.floor(currentUser.xpToNextLevel * 1.5);
          newXP = overflowXP;
        }

        set({
          user: {
            ...currentUser,
            xp: newXP,
            level: newLevel,
            xpToNextLevel: newXPToNext,
            updatedAt: Date.now(),
          },
        });
      },

      updateStreak: (increment: boolean = true) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const newStreak = increment ? currentUser.streak + 1 : Math.max(0, currentUser.streak - 1);
        set({
          user: {
            ...currentUser,
            streak: newStreak,
            updatedAt: Date.now(),
          },
        });
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

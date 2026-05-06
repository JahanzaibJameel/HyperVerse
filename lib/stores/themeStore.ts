import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'cyan' | 'purple' | 'pink' | 'green' | 'orange';

interface ThemeState {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  isSystemDark: boolean;
  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setSystemDark: (isDark: boolean) => void;
  toggleTheme: () => void;
  cycleAccentColor: () => void;
}

const accentColors: AccentColor[] = ['cyan', 'purple', 'pink', 'green', 'orange'];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set: any, get: any) => ({
      themeMode: 'system',
      accentColor: 'cyan',
      isSystemDark: false,

      setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode });
      },

      setAccentColor: (color: AccentColor) => {
        set({ accentColor: color });
      },

      setSystemDark: (isDark: boolean) => {
        set({ isSystemDark: isDark });
      },

      toggleTheme: () => {
        const { themeMode } = get();
        if (themeMode === 'light') {
          set({ themeMode: 'dark' });
        } else if (themeMode === 'dark') {
          set({ themeMode: 'system' });
        } else {
          set({ themeMode: 'light' });
        }
      },

      cycleAccentColor: () => {
        const { accentColor } = get();
        const currentIndex = accentColors.indexOf(accentColor);
        const nextIndex = (currentIndex + 1) % accentColors.length;
        set({ accentColor: accentColors[nextIndex] });
      },
    }),
    {
      name: 'hyperverse-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

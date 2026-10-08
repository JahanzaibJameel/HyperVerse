import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'cyan' | 'purple' | 'pink' | 'green' | 'orange';

/** Single source of truth for accent hex values. Keep in sync with
 * `colors.accents` in `@/constants/colors`. */
export const ACCENT_HEX: Record<AccentColor, string> = {
  cyan: '#00d4ff',
  purple: '#7c3aed',
  pink: '#ff006e',
  green: '#00ff9d',
  orange: '#ff6b00',
};

export const ACCENT_ORDER: AccentColor[] = ['cyan', 'purple', 'pink', 'green', 'orange'];

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

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
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
        const currentIndex = ACCENT_ORDER.indexOf(accentColor);
        const nextIndex = (currentIndex + 1) % ACCENT_ORDER.length;
        set({ accentColor: ACCENT_ORDER[nextIndex] });
      },
    }),
    {
      name: 'hyperverse-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
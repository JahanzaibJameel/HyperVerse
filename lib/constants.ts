// App-wide constants for HyperVerse
export const APP_CONFIG = {
  name: 'HyperVerse',
  version: '1.0.0',
  description: 'AI-native life OS',
} as const;

// Animation constants
export const ANIMATION = {
  durations: {
    fast: 150,
    normal: 300,
    slow: 500,
    extraSlow: 1000,
  },
  easing: {
    easeIn: 'easeIn',
    easeOut: 'easeOut',
    easeInOut: 'easeInOut',
  },
} as const;

// Layout constants
export const LAYOUT = {
  padding: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 9999,
  },
  breakpoints: {
    sm: 375,
    md: 768,
    lg: 1024,
    xl: 1440,
  },
} as const;

// Typography constants
export const TYPOGRAPHY = {
  fontSizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 32,
  },
  fontWeights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
} as const;

// Color palette
export const COLORS = {
  primary: '#00ffff',
  secondary: '#ff00ff',
  success: '#00ff9d',
  warning: '#ffb800',
  error: '#ff4444',
  info: '#00d4ff',
  
  // Gradients
  gradients: {
    cyberpunk: ['#0d1a2e', '#0a1628', '#070e1c'],
    sunset: ['#ff6b00', '#ff8800', '#ffaa00'],
    ocean: ['#0066cc', '#0088ff', '#00aaff'],
    purple: ['#6b46c1', '#8b5cf6', '#a855f7'],
  },
  
  // Opacity levels
  opacity: {
    light: '15',
    medium: '33',
    strong: '55',
    full: 'ff',
  },
} as const;

// Task and XP constants
export const TASK = {
  priorities: {
    low: 10,
    medium: 20,
    high: 30,
    urgent: 50,
  },
  statuses: ['todo', 'in_progress', 'completed', 'cancelled'] as const,
  categories: ['work', 'health', 'finance', 'social', 'learning', 'personal'] as const,
  maxTags: 5,
} as const;

// Health constants
export const HEALTH = {
  goals: {
    steps: 10000,
    calories: 2500,
    sleep: 8,
    workouts: 5,
    water: 8,
  },
  units: {
    steps: 'steps',
    calories: 'kcal',
    sleep: 'hours',
    workouts: 'sessions',
    water: 'cups',
  },
} as const;

// XP and Leveling constants
export const XP = {
  baseLevelXP: 100,
  multiplier: 1.5,
  maxLevel: 100,
  rewards: {
    taskCompletion: 10,
    workout: 150,
    meditation: 75,
    streak: 50,
  },
} as const;

// UI Component constants
export const UI = {
  button: {
    sizes: {
      sm: { paddingVertical: 8, paddingHorizontal: 16 },
      md: { paddingVertical: 12, paddingHorizontal: 24 },
      lg: { paddingVertical: 16, paddingHorizontal: 32 },
    },
  },
  card: {
    glow: {
      low: { alpha: '1a', blur: 10, opacity: 0.2, elevation: 4 },
      medium: { alpha: '33', blur: 20, opacity: 0.35, elevation: 10 },
      high: { alpha: '55', blur: 40, opacity: 0.55, elevation: 20 },
    },
  },
  input: {
    heights: {
      sm: 32,
      md: 40,
      lg: 48,
    },
  },
} as const;

// Accessibility constants
export const ACCESSIBILITY = {
  minContrastRatio: {
    text: 4.5,
    largeText: 3.0,
    ui: 3.0,
  },
  touchTargets: {
    min: 44,
    comfortable: 48,
  },
} as const;

// Feature flags
export const FEATURES = {
  aiAssistant: true,
  arMode: true,
  blockchain: true,
  iotIntegration: true,
  socialFeatures: true,
  premiumFeatures: false,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  network: 'Network connection failed. Please check your internet connection.',
  auth: 'Authentication failed. Please try again.',
  validation: 'Please check your input and try again.',
  unknown: 'An unexpected error occurred. Please try again.',
  offline: 'You are currently offline. Some features may be unavailable.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  taskCreated: 'Task created successfully!',
  taskCompleted: 'Task completed! +{xp} XP earned.',
  workoutLogged: 'Workout logged! +150 XP earned.',
  meditationComplete: 'Meditation complete! +75 XP earned.',
  profileUpdated: 'Profile updated successfully.',
} as const;

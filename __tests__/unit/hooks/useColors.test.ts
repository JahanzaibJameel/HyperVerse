import { renderHook } from '@testing-library/react-hooks';
import { useColorScheme } from 'react-native';

import { useColors } from '@/hooks/useColors';

// Mock the colors module
jest.mock('@/constants/colors', () => ({
  default: {
    light: {
      text: '#000000',
      background: '#ffffff',
      primary: '#007AFF',
      secondary: '#5856D6',
      accent: '#FF9500',
      border: '#E5E5EA',
      card: '#ffffff',
      cardForeground: '#000000',
      primaryForeground: '#ffffff',
      secondaryForeground: '#ffffff',
      muted: '#8E8E93',
      mutedForeground: '#636366',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
      info: '#007AFF',
      cyan: '#32D74B',
      purple: '#AF52DE',
      pink: '#FF2D92',
      green: '#34C759',
      orange: '#FF9500',
    },
    dark: {
      text: '#ffffff',
      background: '#000000',
      primary: '#0A84FF',
      secondary: '#5E5CE6',
      accent: '#FF9F0A',
      border: '#38383A',
      card: '#1C1C1E',
      cardForeground: '#ffffff',
      primaryForeground: '#ffffff',
      secondaryForeground: '#ffffff',
      muted: '#8E8E93',
      mutedForeground: '#636366',
      success: '#30D158',
      warning: '#FF9F0A',
      error: '#FF453A',
      info: '#0A84FF',
      cyan: '#63E6BE',
      purple: '#BF5AF2',
      pink: '#FF2D92',
      green: '#30D158',
      orange: '#FF9F0A',
    },
    radius: 12,
  },
}));

// Mock useColorScheme
jest.mock('react-native', () => ({
  useColorScheme: jest.fn(),
}));

describe('useColors Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return light colors when scheme is light', () => {
    const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() => useColors());

    expect(result.current.text).toBe('#000000');
    expect(result.current.background).toBe('#ffffff');
    expect(result.current.primary).toBe('#007AFF');
    expect(result.current.radius).toBe(12);
  });

  it('should return dark colors when scheme is dark', () => {
    const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;
    mockUseColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() => useColors());

    expect(result.current.text).toBe('#ffffff');
    expect(result.current.background).toBe('#000000');
    expect(result.current.primary).toBe('#0A84FF');
    expect(result.current.radius).toBe(12);
  });

  it('should return light colors when scheme is null (default)', () => {
    const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;
    mockUseColorScheme.mockReturnValue(null);

    const { result } = renderHook(() => useColors());

    expect(result.current.text).toBe('#000000');
    expect(result.current.background).toBe('#ffffff');
    expect(result.current.primary).toBe('#007AFF');
  });

  it('should include radius property in returned object', () => {
    const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() => useColors());

    expect(result.current).toHaveProperty('radius');
    expect(typeof result.current.radius).toBe('number');
    expect(result.current.radius).toBe(12);
  });

  it('should have all required color properties', () => {
    const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() => useColors());

    // Check for all essential color properties
    const expectedProperties = [
      'text',
      'background',
      'primary',
      'secondary',
      'accent',
      'border',
      'card',
      'cardForeground',
      'primaryForeground',
      'secondaryForeground',
      'muted',
      'mutedForeground',
      'success',
      'warning',
      'error',
      'info',
      'cyan',
      'purple',
      'pink',
      'green',
      'orange',
      'radius',
    ];

    expectedProperties.forEach(prop => {
      expect(result.current).toHaveProperty(prop);
    });
  });

  it('should return consistent color types', () => {
    const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() => useColors());

    // All color values should be strings
    Object.keys(result.current).forEach(key => {
      if (key !== 'radius') {
        expect(typeof result.current[key as keyof typeof result.current]).toBe('string');
      }
    });

    // Radius should be a number
    expect(typeof result.current.radius).toBe('number');
  });

  it('should have valid hex color values', () => {
    const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() => useColors());

    // Check that color values are valid hex codes
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    
    Object.keys(result.current).forEach(key => {
      if (key !== 'radius') {
        const colorValue = result.current[key as keyof typeof result.current];
        expect(typeof colorValue).toBe('string');
        expect(hexColorRegex.test(colorValue as string)).toBe(true);
      }
    });
  });

  it('should handle scheme changes', () => {
    const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;
    
    // Start with light scheme
    mockUseColorScheme.mockReturnValue('light');
    const { result, rerender } = renderHook(() => useColors());

    expect(result.current.text).toBe('#000000');

    // Change to dark scheme
    mockUseColorScheme.mockReturnValue('dark');
    rerender();

    expect(result.current.text).toBe('#ffffff');
  });
});

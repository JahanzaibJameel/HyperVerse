import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { NeonButton } from '@/components/NeonButton';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('NeonButton Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly with default props', () => {
    const { getByText } = render(
      <NeonButton label="Test Button" onPress={mockOnPress} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should render with custom color', () => {
    const { getByText } = render(
      <NeonButton label="Test Button" onPress={mockOnPress} color="#FF0000" />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should render with custom style', () => {
    const customStyle = { margin: 10 };
    const { getByText } = render(
      <NeonButton label="Test Button" onPress={mockOnPress} style={customStyle} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should render with different sizes', () => {
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
    
    sizes.forEach(size => {
      const { getByText, unmount } = render(
        <NeonButton label={`Button ${size}`} onPress={mockOnPress} size={size} />
      );
      
      expect(getByText(`Button ${size}`)).toBeTruthy();
      unmount();
    });
  });

  it('should render filled variant', () => {
    const { getByText } = render(
      <NeonButton label="Filled Button" onPress={mockOnPress} filled={true} />
    );
    
    expect(getByText('Filled Button')).toBeTruthy();
  });

  it('should render outlined variant (default)', () => {
    const { getByText } = render(
      <NeonButton label="Outlined Button" onPress={mockOnPress} filled={false} />
    );
    
    expect(getByText('Outlined Button')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const { getByText } = render(
      <NeonButton label="Press Me" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Press Me'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const { getByText } = render(
      <NeonButton label="Disabled Button" onPress={mockOnPress} disabled={true} />
    );
    
    fireEvent.press(getByText('Disabled Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should call haptic feedback on press', () => {
    const mockHaptics = require('expo-haptics');
    const { getByText } = render(
      <NeonButton label="Haptic Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Haptic Button'));
    expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
      mockHaptics.ImpactFeedbackStyle.Light
    );
  });

  it('should not call haptic feedback when disabled', () => {
    const mockHaptics = require('expo-haptics');
    const { getByText } = render(
      <NeonButton label="Disabled Haptic" onPress={mockOnPress} disabled={true} />
    );
    
    fireEvent.press(getByText('Disabled Haptic'));
    expect(mockHaptics.impactAsync).not.toHaveBeenCalled();
  });

  it('should render with accessibility props', () => {
    const { getByRole } = render(
      <NeonButton 
        label="Accessible Button" 
        onPress={mockOnPress}
        accessibilityLabel="Custom accessible label"
        accessibilityHint="Press to perform action"
        accessibilityRole="button"
      />
    );
    
    const button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('should handle rapid presses', () => {
    const { getByText } = render(
      <NeonButton label="Rapid Press" onPress={mockOnPress} />
    );
    
    const button = getByText('Rapid Press');
    
    // Press multiple times rapidly
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);
    
    expect(mockOnPress).toHaveBeenCalledTimes(3);
  });

  it('should render with all props combined', () => {
    const customStyle = { padding: 15, margin: 8 };
    const { getByText } = render(
      <NeonButton
        label="Full Props Button"
        onPress={mockOnPress}
        color="#00FF00"
        style={customStyle}
        size="lg"
        filled={true}
        accessibilityLabel="Full props button"
        accessibilityHint="Button with all props"
      />
    );
    
    expect(getByText('Full Props Button')).toBeTruthy();
  });

  it('should handle empty label', () => {
    const { getByText } = render(
      <NeonButton label="" onPress={mockOnPress} />
    );
    
    // Should still render even with empty label
    expect(getByText('')).toBeTruthy();
  });

  it('should handle long label text', () => {
    const longText = 'This is a very long button label that should wrap properly and still be readable';
    const { getByText } = render(
      <NeonButton label={longText} onPress={mockOnPress} />
    );
    
    expect(getByText(longText)).toBeTruthy();
  });

  it('should handle special characters in label', () => {
    const specialText = 'Button with émojis 🚀 and spéci@l chars!';
    const { getByText } = render(
      <NeonButton label={specialText} onPress={mockOnPress} />
    );
    
    expect(getByText(specialText)).toBeTruthy();
  });

  it('should maintain re-rendering consistency', () => {
    const { rerender, getByText } = render(
      <NeonButton label="Initial" onPress={mockOnPress} />
    );
    
    expect(getByText('Initial')).toBeTruthy();
    
    // Re-render with same props
    rerender(<NeonButton label="Initial" onPress={mockOnPress} />);
    expect(getByText('Initial')).toBeTruthy();
    
    // Re-render with different label
    rerender(<NeonButton label="Updated" onPress={mockOnPress} />);
    expect(getByText('Updated')).toBeTruthy();
  });

  it('should handle onPress function changes', () => {
    const mockOnPress1 = jest.fn();
    const mockOnPress2 = jest.fn();
    
    const { rerender, getByText } = render(
      <NeonButton label="Button" onPress={mockOnPress1} />
    );
    
    fireEvent.press(getByText('Button'));
    expect(mockOnPress1).toHaveBeenCalledTimes(1);
    expect(mockOnPress2).not.toHaveBeenCalled();
    
    rerender(<NeonButton label="Button" onPress={mockOnPress2} />);
    
    fireEvent.press(getByText('Button'));
    expect(mockOnPress1).toHaveBeenCalledTimes(1);
    expect(mockOnPress2).toHaveBeenCalledTimes(1);
  });

  it('should handle disabled state changes', () => {
    const { rerender, getByText } = render(
      <NeonButton label="Toggle Button" onPress={mockOnPress} disabled={false} />
    );
    
    // Should work when enabled
    fireEvent.press(getByText('Toggle Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
    
    rerender(<NeonButton label="Toggle Button" onPress={mockOnPress} disabled={true} />);
    
    // Should not work when disabled
    fireEvent.press(getByText('Toggle Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should handle style changes', () => {
    const { rerender, getByText } = render(
      <NeonButton label="Styled Button" onPress={mockOnPress} style={{ margin: 5 }} />
    );
    
    expect(getByText('Styled Button')).toBeTruthy();
    
    rerender(
      <NeonButton label="Styled Button" onPress={mockOnPress} style={{ padding: 10, margin: 15 }} />
    );
    
    expect(getByText('Styled Button')).toBeTruthy();
  });
});

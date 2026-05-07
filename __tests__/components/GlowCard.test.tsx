import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { GlowCard } from '@/components/GlowCard';

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

describe('GlowCard Component', () => {
  const defaultProps = {
    children: <Text testID="test-content">Test Content</Text>,
  };

  it('should render correctly with default props', () => {
    const { getByTestId } = render(<GlowCard {...defaultProps} />);
    
    expect(getByTestId('test-content')).toBeTruthy();
  });

  it('should render with custom style', () => {
    const customStyle = { padding: 20, margin: 10 };
    const { getByTestId } = render(
      <GlowCard {...defaultProps} style={customStyle} />
    );
    
    expect(getByTestId('test-content')).toBeTruthy();
  });

  it('should render with custom glow color', () => {
    const { getByTestId } = render(
      <GlowCard {...defaultProps} glowColor="#FF0000" />
    );
    
    expect(getByTestId('test-content')).toBeTruthy();
  });

  it('should render with custom intensity', () => {
    const { getByTestId } = render(
      <GlowCard {...defaultProps} intensity={0.8} />
    );
    
    expect(getByTestId('test-content')).toBeTruthy();
  });

  it('should render with multiple children', () => {
    const { getByTestId } = render(
      <GlowCard>
        <Text testID="child1">Child 1</Text>
        <Text testID="child2">Child 2</Text>
        <View testID="child3" />
      </GlowCard>
    );
    
    expect(getByTestId('child1')).toBeTruthy();
    expect(getByTestId('child2')).toBeTruthy();
    expect(getByTestId('child3')).toBeTruthy();
  });

  it('should render with complex nested children', () => {
    const { getByTestId } = render(
      <GlowCard glowColor="#00FF00" intensity={0.9}>
        <View testID="container">
          <Text testID="title">Title</Text>
          <Text testID="description">Description</Text>
          <View testID="footer">
            <Text testID="footer-text">Footer</Text>
          </View>
        </View>
      </GlowCard>
    );
    
    expect(getByTestId('container')).toBeTruthy();
    expect(getByTestId('title')).toBeTruthy();
    expect(getByTestId('description')).toBeTruthy();
    expect(getByTestId('footer')).toBeTruthy();
    expect(getByTestId('footer-text')).toBeTruthy();
  });

  it('should handle empty children', () => {
    const { queryByTestId } = render(<GlowCard />);
    
    // Should not crash and render nothing
    expect(queryByTestId('test-content')).toBeFalsy();
  });

  it('should handle null children', () => {
    const { queryByTestId } = render(<GlowCard children={null} />);
    
    expect(queryByTestId('test-content')).toBeFalsy();
  });

  it('should apply platform-specific styling', () => {
    const { getByTestId } = render(
      <GlowCard {...defaultProps} style={{ borderRadius: 15 }} />
    );
    
    expect(getByTestId('test-content')).toBeTruthy();
  });

  it('should handle style updates', () => {
    const { rerender, getByTestId } = render(
      <GlowCard {...defaultProps} style={{ padding: 10 }} />
    );
    
    expect(getByTestId('test-content')).toBeTruthy();
    
    rerender(
      <GlowCard {...defaultProps} style={{ padding: 20, margin: 5 }} />
    );
    
    expect(getByTestId('test-content')).toBeTruthy();
  });

  it('should handle glow color changes', () => {
    const { rerender, getByTestId } = render(
      <GlowCard {...defaultProps} glowColor="#FF0000" />
    );
    
    expect(getByTestId('test-content')).toBeTruthy();
    
    rerender(
      <GlowCard {...defaultProps} glowColor="#00FF00" />
    );
    
    expect(getByTestId('test-content')).toBeTruthy();
  });

  it('should handle intensity changes', () => {
    const { rerender, getByTestId } = render(
      <GlowCard {...defaultProps} intensity={0.5} />
    );
    
    expect(getByTestId('test-content')).toBeTruthy();
    
    rerender(
      <GlowCard {...defaultProps} intensity={0.9} />
    );
    
    expect(getByTestId('test-content')).toBeTruthy();
  });

  it('should render with all props combined', () => {
    const customStyle = { padding: 15, margin: 8, borderRadius: 12 };
    const { getByTestId } = render(
      <GlowCard
        {...defaultProps}
        style={customStyle}
        glowColor="#FF00FF"
        intensity={0.7}
      />
    );
    
    expect(getByTestId('test-content')).toBeTruthy();
  });

  it('should handle text nodes as children', () => {
    const { getByText } = render(
      <GlowCard>Plain text content</GlowCard>
    );
    
    expect(getByText('Plain text content')).toBeTruthy();
  });

  it('should handle mixed children types', () => {
    const { getByTestId, getByText } = render(
      <GlowCard>
        Text node
        <Text testID="element">Element</Text>
        null
        {undefined}
        Text node 2
      </GlowCard>
    );
    
    expect(getByText('Text node')).toBeTruthy();
    expect(getByTestId('element')).toBeTruthy();
    expect(getByText('Text node 2')).toBeTruthy();
  });

  it('should maintain re-rendering consistency', () => {
    const { rerender, getByTestId } = render(
      <GlowCard {...defaultProps} />
    );
    
    expect(getByTestId('test-content')).toBeTruthy();
    
    // Re-render with same props
    rerender(<GlowCard {...defaultProps} />);
    expect(getByTestId('test-content')).toBeTruthy();
    
    // Re-render with different children
    rerender(
      <GlowCard>
        <Text testID="new-content">New Content</Text>
      </GlowCard>
    );
    expect(getByTestId('new-content')).toBeTruthy();
  });
});

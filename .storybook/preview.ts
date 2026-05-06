import type { Preview } from '@storybook/react-native';

const preview: Preview = {
  parameters: {
    viewport: {
      viewports: {
        // Mobile devices
        'iPhone SE': {
          name: 'iPhone SE',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        'iPhone 15 Pro Max': {
          name: 'iPhone 15 Pro Max',
          styles: {
            width: '430px',
            height: '932px',
          },
        },
        // Desktop
        'Desktop': {
          name: 'Desktop (1440px)',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
        // Tablet
        'iPad Pro': {
          name: 'iPad Pro',
          styles: {
            width: '1024px',
            height: '1366px',
          },
        },
      },
      defaultViewport: 'iPhone 15 Pro Max',
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0a0a0a',
        },
        {
          name: 'cyberpunk',
          value: '#0d1a2e',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;

import React from 'react';
import type { Preview } from '@storybook/react';

import { AppProvider } from '@/context/AppContext';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story) => (
      <AppProvider>
        <Story />
      </AppProvider>
    ),
  ],
};

export default preview;
import type { Meta, StoryObj } from '@storybook/react';

import { NotificationBadge } from '@/components/NotificationBadge';

const meta = {
  title: 'Components/NotificationBadge',
  component: NotificationBadge,
  parameters: {
    docs: {
      description: {
        component:
          'A bell icon with a red badge and an expanding panel. The bell shakes every 8 seconds '
          + 'while there are unread notifications. Opening the panel clears the badge.',
      },
    },
  },
} satisfies Meta<typeof NotificationBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithUnread: Story = {
  parameters: {
    docs: {
      description: {
        component:
          'Five unread notifications. The badge shows the count and the bell shakes every '
          + '8 seconds until the panel is opened.',
      },
    },
  },
};
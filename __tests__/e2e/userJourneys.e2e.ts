// E2E Tests for Critical User Journeys
// These tests simulate real user interactions across the entire application

import { device, element, by, expect } from 'detox';

describe('Critical User Journeys E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Onboarding Journey', () => {
    it('should complete full onboarding flow for new user', async () => {
      // Welcome screen
      await expect(element(by.id('welcome-screen'))).toBeVisible();
      await expect(element(by.text('Welcome to HyperVerse'))).toBeVisible();
      
      // Sign up flow
      await element(by.id('signup-button')).tap();
      
      // Name input
      await element(by.id('name-input')).typeText('John Doe');
      
      // Email input (optional)
      await element(by.id('email-input')).typeText('john@example.com');
      
      // Continue button
      await element(by.id('continue-button')).tap();
      
      // Biometric setup screen
      await expect(element(by.text('Enable Biometric Authentication'))).toBeVisible();
      await element(by.id('enable-biometric-button')).tap();
      
      // Biometric authentication prompt (mocked)
      await element(by.id('biometric-auth-button')).tap();
      
      // Main app should be visible
      await expect(element(by.id('main-app'))).toBeVisible();
      await expect(element(by.text('Welcome back, John Doe!'))).toBeVisible();
    });

    it('should handle returning user login flow', async () => {
      // Mock existing user data
      await device.launchApp({
        launchArgs: { mockExistingUser: 'true' },
      });
      
      // Should show biometric authentication
      await expect(element(by.id('biometric-auth-screen'))).toBeVisible();
      
      // Authenticate
      await element(by.id('authenticate-button')).tap();
      
      // Should land in main app
      await expect(element(by.id('main-app'))).toBeVisible();
    });
  });

  describe('Task Management Journey', () => {
    beforeEach(async () => {
      // Login first
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-auth-button')).tap();
    });

    it('should create, complete, and manage tasks', async () => {
      // Navigate to tasks
      await element(by.id('tasks-tab')).tap();
      
      // Create new task
      await element(by.id('add-task-button')).tap();
      
      // Fill task details
      await element(by.id('task-title-input')).typeText('Complete project documentation');
      await element(by.id('task-description-input')).typeText('Write comprehensive docs for the new feature');
      
      // Set priority
      await element(by.id('priority-selector')).tap();
      await element(by.text('High')).tap();
      
      // Set category
      await element(by.id('category-selector')).tap();
      await element(by.text('Work')).tap();
      
      // Save task
      await element(by.id('save-task-button')).tap();
      
      // Verify task appears in list
      await expect(element(by.text('Complete project documentation'))).toBeVisible();
      
      // Mark task as in progress
      await element(by.id('task-status-button')).tap();
      await element(by.text('In Progress')).tap();
      
      // Complete task
      await element(by.id('task-complete-button')).tap();
      
      // Verify task is in completed section
      await element(by.id('filter-completed')).tap();
      await expect(element(by.text('Complete project documentation'))).toBeVisible();
      
      // Check XP gain notification
      await expect(element(by.text('+50 XP'))).toBeVisible();
    });

    it('should handle task filtering and search', async () => {
      await element(by.id('tasks-tab')).tap();
      
      // Create multiple tasks with different statuses
      const tasks = [
        { title: 'High priority task', priority: 'High', status: 'todo' },
        { title: 'Medium priority task', priority: 'Medium', status: 'in_progress' },
        { title: 'Low priority task', priority: 'Low', status: 'completed' },
      ];
      
      for (const task of tasks) {
        await element(by.id('add-task-button')).tap();
        await element(by.id('task-title-input')).typeText(task.title);
        await element(by.id('priority-selector')).tap();
        await element(by.text(task.priority)).tap();
        await element(by.id('save-task-button')).tap();
      }
      
      // Test filters
      await element(by.id('filter-todo')).tap();
      await expect(element(by.text('High priority task'))).toBeVisible();
      await expect(element(by.text('Medium priority task'))).not.toBeVisible();
      
      await element(by.id('filter-in-progress')).tap();
      await expect(element(by.text('Medium priority task'))).toBeVisible();
      await expect(element(by.text('High priority task'))).not.toBeVisible();
      
      // Test search
      await element(by.id('search-input')).typeText('priority');
      await expect(element(by.text('High priority task'))).toBeVisible();
      await expect(element(by.text('Medium priority task'))).toBeVisible();
      await expect(element(by.text('Low priority task'))).toBeVisible();
    });
  });

  describe('Dashboard Journey', () => {
    beforeEach(async () => {
      // Login first
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-auth-button')).tap();
    });

    it('should display and interact with dashboard components', async () => {
      // Navigate to dashboard
      await element(by.id('dashboard-tab')).tap();
      
      // Verify main components
      await expect(element(by.id('hero-card'))).toBeVisible();
      await expect(element(by.id('stats-grid'))).toBeVisible();
      await expect(element(by.id('health-section'))).toBeVisible();
      await expect(element(by.id('finance-section'))).toBeVisible();
      await expect(element(by.id('ai-insights'))).toBeVisible();
      
      // Test XP bar interaction
      await element(by.id('xp-bar')).tap();
      await expect(element(by.text('Level Progress'))).toBeVisible();
      
      // Test health metrics
      await element(by.id('health-card')).tap();
      await expect(element(by.id('health-details'))).toBeVisible();
      
      // Test finance summary
      await element(by.id('finance-card')).tap();
      await expect(element(by.id('finance-details'))).toBeVisible();
      
      // Test AI insights
      await element(by.id('ai-insights-card')).tap();
      await expect(element(by.id('ai-chat')).toBeVisible();
    });

    it('should handle live ticker and notifications', async () => {
      await element(by.id('dashboard-tab')).tap();
      
      // Verify live ticker
      await expect(element(by.id('live-ticker'))).toBeVisible();
      
      // Test notification badge
      await element(by.id('notification-badge')).tap();
      await expect(element(by.id('notifications-panel'))).toBeVisible();
      
      // Mark notification as read
      await element(by.id('notification-item')).tap();
      await expect(element(by.id('notification-item'))).not.toBeVisible();
    });
  });

  describe('AI Chat Journey', () => {
    beforeEach(async () => {
      // Login first
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-auth-button')).tap();
    });

    it('should complete AI chat interaction flow', async () => {
      // Navigate to AI
      await element(by.id('ai-tab')).tap();
      
      // Verify chat interface
      await expect(element(by.id('chat-interface'))).toBeVisible();
      await expect(element(by.id('quick-prompts'))).toBeVisible();
      
      // Send a message
      await element(by.id('message-input')).typeText('Help me organize my tasks');
      await element(by.id('send-button')).tap();
      
      // Wait for AI response
      await waitFor(element(by.text('AI Assistant')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Verify response appears
      await expect(element(by.id('ai-response'))).toBeVisible();
      
      // Test quick prompts
      await element(by.id('quick-prompt-tasks')).tap();
      await expect(element(by.id('ai-response'))).toBeVisible();
      
      // Test memory tab
      await element(by.id('memory-tab')).tap();
      await expect(element(by.id('memory-list'))).toBeVisible();
      
      // Test twin tab
      await element(by.id('twin-tab')).tap();
      await expect(element(by.id('twin-interface'))).toBeVisible();
    });
  });

  describe('Health Tracking Journey', () => {
    beforeEach(async () => {
      // Login first
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-auth-button')).tap();
    });

    it('should track and view health metrics', async () => {
      // Navigate to health
      await element(by.id('health-tab')).tap();
      
      // Verify health dashboard
      await expect(element(by.id('health-dashboard'))).toBeVisible();
      await expect(element(by.id('health-stats'))).toBeVisible();
      
      // Add workout
      await element(by.id('add-workout-button')).tap();
      await element(by.id('workout-type-selector')).tap();
      await element(by.text('Running')).tap();
      await element(by.id('workout-duration-input')).typeText('30');
      await element(by.id('save-workout-button')).tap();
      
      // Verify workout appears
      await expect(element(by.text('Running - 30 min'))).toBeVisible();
      
      // View sleep analysis
      await element(by.id('sleep-card')).tap();
      await expect(element(by.id('sleep-details'))).toBeVisible();
      
      // Check energy levels
      await element(by.id('energy-card')).tap();
      await expect(element(by.id('energy-chart'))).toBeVisible();
      
      // View achievements
      await element(by.id('achievements-tab')).tap();
      await expect(element(by.id('achievements-list'))).toBeVisible();
    });
  });

  describe('Settings and Profile Journey', () => {
    beforeEach(async () => {
      // Login first
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-auth-button')).tap();
    });

    it('should manage user profile and settings', async () => {
      // Navigate to settings
      await element(by.id('settings-tab')).tap();
      
      // Edit profile
      await element(by.id('profile-section')).tap();
      await element(by.id('edit-profile-button')).tap();
      
      // Update name
      await element(by.id('name-input')).clearText();
      await element(by.id('name-input')).typeText('Jane Smith');
      
      // Update email
      await element(by.id('email-input')).clearText();
      await element(by.id('email-input')).typeText('jane@example.com');
      
      // Save changes
      await element(by.id('save-profile-button')).tap();
      
      // Verify changes
      await expect(element(by.text('Jane Smith'))).toBeVisible();
      
      // Test app lock settings
      await element(by.id('security-section')).tap();
      await element(by.id('app-lock-toggle')).tap();
      
      // Verify biometric prompt
      await expect(element(by.id('biometric-auth-button'))).toBeVisible();
      await element(by.id('biometric-auth-button')).tap();
      
      // Test theme settings
      await element(by.id('appearance-section')).tap();
      await element(by.id('theme-selector')).tap();
      await element(by.text('Dark')).tap();
      
      // Verify theme change
      await expect(element(by.id('app-container'))).toHaveStyle({
        backgroundColor: '#000000',
      });
      
      // Test notifications
      await element(by.id('notifications-section')).tap();
      await element(by.id('task-notifications-toggle')).tap();
      await element(by.id('achievement-notifications-toggle')).tap();
      
      // Export data
      await element(by.id('data-section')).tap();
      await element(by.id('export-data-button')).tap();
      
      // Verify export confirmation
      await expect(element(by.text('Data exported successfully'))).toBeVisible();
    });
  });

  describe('Error Handling Journey', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network failure
      await device.launchApp({
        launchArgs: { mockNetworkFailure: 'true' },
      });
      
      // Should show error state
      await expect(element(by.id('error-state'))).toBeVisible();
      await expect(element(by.text('Network Error'))).toBeVisible();
      
      // Test retry button
      await element(by.id('retry-button')).tap();
      
      // Should attempt to reload
      await expect(element(by.id('loading-state'))).toBeVisible();
    });

    it('should handle biometric authentication failures', async () => {
      // Mock biometric failure
      await device.launchApp({
        launchArgs: { mockBiometricFailure: 'true' },
      });
      
      // Should show fallback option
      await expect(element(by.id('biometric-fallback'))).toBeVisible();
      
      // Test PIN fallback
      await element(by.id('use-pin-button')).tap();
      await element(by.id('pin-input')).typeText('1234');
      await element(by.id('pin-submit')).tap();
      
      // Should authenticate successfully
      await expect(element(by.id('main-app'))).toBeVisible();
    });

    it('should handle data corruption', async () => {
      // Mock corrupted data
      await device.launchApp({
        launchArgs: { mockCorruptedData: 'true' },
      });
      
      // Should show data recovery screen
      await expect(element(by.id('data-recovery'))).toBeVisible();
      
      // Test data restore
      await element(by.id('restore-data-button')).tap();
      
      // Should show success message
      await expect(element(by.text('Data restored successfully'))).toBeVisible();
    });
  });

  describe('Performance Journey', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      await device.launchApp({
        launchArgs: { mockLargeDataset: 'true' },
      });
      
      // Login
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-auth-button')).tap();
      
      // Navigate to tasks with many items
      await element(by.id('tasks-tab')).tap();
      
      // Should load within reasonable time
      await waitFor(element(by.id('task-list')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Test scrolling performance
      await element(by.id('task-list')).scroll(200, 'down');
      await element(by.id('task-list')).scroll(200, 'up');
      
      // Should remain responsive
      await expect(element(by.id('task-list'))).toBeVisible();
    });

    it('should handle memory pressure', async () => {
      // Mock memory pressure
      await device.launchApp({
        launchArgs: { mockMemoryPressure: 'true' },
      });
      
      // App should remain functional
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-auth-button')).tap();
      
      // Should show memory warning
      await expect(element(by.id('memory-warning'))).toBeVisible();
      
      // Should continue working after warning
      await expect(element(by.id('main-app'))).toBeVisible();
    });
  });

  describe('Accessibility Journey', () => {
    it('should support screen readers', async () => {
      // Enable screen reader mode
      await device.launchApp({
        launchArgs: { enableScreenReader: 'true' },
      });
      
      // Login
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-auth-button')).tap();
      
      // Verify accessibility labels
      await expect(element(by.label('Welcome back'))).toBeVisible();
      await expect(element(by.label('Tasks tab'))).toBeVisible();
      await expect(element.by.label('Dashboard tab'))).toBeVisible();
      
      // Test navigation
      await element(by.label('Tasks tab')).tap();
      await expect(element(by.label('Add task'))).toBeVisible();
    });

    it('should support reduced motion', async () => {
      // Enable reduced motion
      await device.launchApp({
        launchArgs: { enableReducedMotion: 'true' },
      });
      
      // Login
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-auth-button')).tap();
      
      // Animations should be disabled
      await element(by.id('dashboard-tab')).tap();
      
      // Should not have animated transitions
      await expect(element(by.id('hero-card'))).toBeVisible();
    });
  });

  describe('Cross-Platform Journey', () => {
    it('should work consistently on iOS', async () => {
      if (device.getPlatform() === 'ios') {
        await element(by.id('login-button')).tap();
        
        // Test iOS-specific biometric (Face ID/Touch ID)
        await expect(element(by.id('ios-biometric-prompt'))).toBeVisible();
        
        // Test iOS navigation
        await element(by.swipe('up', 'slow', 0.5));
        await expect(element(by.id('bottom-navigation'))).toBeVisible();
      }
    });

    it('should work consistently on Android', async () => {
      if (device.getPlatform() === 'android') {
        await element(by.id('login-button')).tap();
        
        // Test Android-specific biometric (fingerprint)
        await expect(element(by.id('android-biometric-prompt'))).toBeVisible();
        
        // Test Android back button
        await device.pressBack();
        await expect(element(by.id('login-screen'))).toBeVisible();
      }
    });
  });
});

import { by, device, element, expect } from 'detox';
import { reloadApp } from 'detox-expo-helpers';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await reloadApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show setup screen on first launch', async () => {
    await expect(element(by.id('setup-screen'))).toBeVisible();
    await expect(element(by.text('Welcome to HyperVerse'))).toBeVisible();
    await expect(element(by.text('Your personal life operating system'))).toBeVisible();
  });

  it('should allow user to enter name and create profile', async () => {
    const nameInput = element(by.id('name-input'));
    await expect(nameInput).toBeVisible();
    
    await nameInput.typeText('Test User');
    await nameInput.tapReturnKey();
    
    const getStartedButton = element(by.id('get-started-button'));
    await expect(getStartedButton).toBeVisible();
    await getStartedButton.tap();
    
    // Should navigate to main app
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should validate empty name input', async () => {
    const nameInput = element(by.id('name-input'));
    const getStartedButton = element(by.id('get-started-button'));
    
    await getStartedButton.tap();
    
    // Should show error message
    await expect(element(by.text('Please enter your name'))).toBeVisible();
    await expect(nameInput).toBeVisible();
  });

  it('should handle optional email field', async () => {
    const nameInput = element.by.id('name-input');
    const emailInput = element(by.id('email-input'));
    const getStartedButton = element(by.id('get-started-button'));
    
    await nameInput.typeText('Test User');
    await emailInput.typeText('test@example.com');
    await getStartedButton.tap();
    
    // Should navigate successfully
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should persist user session after app restart', async () => {
    // First setup
    const nameInput = element(by.id('name-input'));
    const getStartedButton = element(by.id('get-started-button'));
    
    await nameInput.typeText('Persistent User');
    await getStartedButton.tap();
    
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Restart app
    await device.reloadReactNative();
    
    // Should go directly to home (skip setup)
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    await expect(element(by.text('Welcome to HyperVerse'))).not.toBeVisible();
  });
});

describe('Biometric Authentication', () => {
  beforeAll(async () => {
    await reloadApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show biometric prompt when enabled', async () => {
    // Navigate to settings
    await element(by.id('settings-tab')).tap();
    await element(by.id('biometric-setting')).tap();
    await element(by.id('enable-biometric')).tap();
    
    // Should show biometric prompt
    await waitFor(element(by.text('Enable biometric authentication')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should handle biometric authentication success', async () => {
    // Mock successful biometric authentication
    await device.matchElement(by.text('Enable biometric authentication'))
      .tap();
    
    // Should show success message
    await waitFor(element(by.text('Biometric authentication enabled')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should show app lock after enabling', async () => {
    // Enable app lock
    await element(by.id('settings-tab')).tap();
    await element(by.id('app-lock-setting')).tap();
    await element(by.id('enable-app-lock')).tap();
    await element(by.text('Enable app lock')).tap();
    
    // Restart app to trigger lock
    await device.reloadReactNative();
    
    // Should show biometric unlock screen
    await waitFor(element(by.text('Unlock HyperVerse')))
      .toBeVisible()
      .withTimeout(3000);
  });
});

describe('Profile Management', () => {
  beforeAll(async () => {
    await reloadApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should allow profile editing', async () => {
    // Navigate to settings
    await element(by.id('settings-tab')).tap();
    await element(by.id('profile-setting')).tap();
    
    const nameInput = element(by.id('profile-name-input'));
    await expect(nameInput).toBeVisible();
    await nameInput.clearText();
    await nameInput.typeText('Updated Name');
    
    const saveButton = element(by.id('save-profile-button'));
    await saveButton.tap();
    
    // Should show success message
    await waitFor(element(by.text('Profile updated')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should handle profile deletion', async () => {
    // Navigate to settings
    await element(by.id('settings-tab')).tap();
    await element(by.id('profile-setting')).tap();
    await element(by.id('delete-profile-button')).tap();
    
    // Should show confirmation dialog
    await waitFor(element(by.text('Delete Profile')))
      .toBeVisible()
      .withTimeout(3000);
    
    await element(by.text('Delete')).tap();
    
    // Should return to setup screen
    await waitFor(element(by.id('setup-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});

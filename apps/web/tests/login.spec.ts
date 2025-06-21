import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should allow a user to log in and redirect to the dashboard', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Make sure we are on the login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1')).toHaveText('Log In');

    // Use environment variables for credentials
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;

    if (!email || !password) {
      throw new Error('TEST_EMAIL and TEST_PASSWORD environment variables must be set.');
    }

    // Fill in the form
    await page.locator('input[id="email"]').fill(email);
    await page.locator('input[id="password"]').fill(password);

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // Assert that the URL is the dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Assert that the dashboard shows a welcome message with the user's email
    const welcomeMessage = page.locator('p');
    await expect(welcomeMessage).toContainText(`You are logged in as: ${email}`);
  });
}); 
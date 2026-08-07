import { expect, test } from '@playwright/test';

test.describe('End-to-End (Browser) Testing: Interactive Web Form Validation', () => {
  test('interacts with browser DOM form and displays live validation feedback', async ({ page }) => {
    // Serve interactive HTML form with live client-side validation logic
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Gigli E2E Form Validation Test</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .field { margin-bottom: 15px; }
            label { display: block; font-weight: bold; }
            input { width: 300px; padding: 8px; margin-top: 4px; }
            .error { color: red; font-size: 0.85rem; margin-top: 4px; }
            .success { color: green; font-weight: bold; margin-top: 15px; }
            button { padding: 10px 20px; background: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer; }
          </style>
        </head>
        <body>
          <h2>Gigli Validator E2E Interactive Form</h2>
          <form id="val-form">
            <div class="field">
              <label for="username">Username (min 3 chars)</label>
              <input id="username" name="username" type="text" />
              <div id="username-error" class="error"></div>
            </div>
            <div class="field">
              <label for="email">Email Address</label>
              <input id="email" name="email" type="text" />
              <div id="email-error" class="error"></div>
            </div>
            <div class="field">
              <label for="age">Age (min 18)</label>
              <input id="age" name="age" type="text" />
              <div id="age-error" class="error"></div>
            </div>
            <button id="submit-btn" type="submit">Submit Registration</button>
            <div id="success-banner" class="success" style="display: none;">Validation Succeeded!</div>
          </form>

          <script>
            // Client-side validation function simulating Gigli rules
            function validateInput(data) {
              const errors = {};
              if (!data.username || data.username.length < 3) {
                errors.username = 'Username must contain at least 3 characters';
              }
              const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
              if (!data.email || !emailRegex.test(data.email)) {
                errors.email = 'Invalid email address';
              }
              const numAge = Number(data.age);
              if (isNaN(numAge) || numAge < 18) {
                errors.age = 'Must be an integer >= 18';
              }
              return { success: Object.keys(errors).length === 0, errors };
            }

            document.getElementById('val-form').addEventListener('submit', function(e) {
              e.preventDefault();
              document.getElementById('username-error').innerText = '';
              document.getElementById('email-error').innerText = '';
              document.getElementById('age-error').innerText = '';
              document.getElementById('success-banner').style.display = 'none';

              const data = {
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                age: document.getElementById('age').value
              };

              const res = validateInput(data);
              if (!res.success) {
                if (res.errors.username) document.getElementById('username-error').innerText = res.errors.username;
                if (res.errors.email) document.getElementById('email-error').innerText = res.errors.email;
                if (res.errors.age) document.getElementById('age-error').innerText = res.errors.age;
              } else {
                document.getElementById('success-banner').style.display = 'block';
              }
            });
          </script>
        </body>
      </html>
    `;

    await page.setContent(htmlContent);

    // Verify initial render
    await expect(page.locator('h2')).toHaveText('Gigli Validator E2E Interactive Form');

    // 1. Submit invalid data and verify DOM error messages
    await page.fill('#username', 'ab');
    await page.fill('#email', 'invalid-email');
    await page.fill('#age', '16');
    await page.click('#submit-btn');

    await expect(page.locator('#username-error')).toHaveText('Username must contain at least 3 characters');
    await expect(page.locator('#email-error')).toHaveText('Invalid email address');
    await expect(page.locator('#age-error')).toHaveText('Must be an integer >= 18');
    await expect(page.locator('#success-banner')).toBeHidden();

    // 2. Submit valid data and verify DOM success message
    await page.fill('#username', 'john_doe');
    await page.fill('#email', 'john@example.com');
    await page.fill('#age', '25');
    await page.click('#submit-btn');

    await expect(page.locator('#username-error')).toHaveText('');
    await expect(page.locator('#email-error')).toHaveText('');
    await expect(page.locator('#age-error')).toHaveText('');
    await expect(page.locator('#success-banner')).toBeVisible();
    await expect(page.locator('#success-banner')).toHaveText('Validation Succeeded!');
  });
});

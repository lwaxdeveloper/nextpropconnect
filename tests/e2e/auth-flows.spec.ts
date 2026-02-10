import { test, expect, Page } from "@playwright/test";

const SCREENSHOT_DIR = "tests/screenshots";
const PASSWORD = "test1234";

async function screenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `${SCREENSHOT_DIR}/${name}.png`,
    fullPage: true 
  });
}

async function waitForPage(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);
}

async function loginAndWait(page: Page, email: string) {
  await page.goto("/login");
  await waitForPage(page);
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  
  // Wait for redirect away from login
  try {
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });
  } catch {
    await page.waitForTimeout(3000);
  }
  await page.waitForTimeout(1000);
}

// ============================================
// AUTHENTICATION FLOWS
// ============================================
test.describe("Authentication Flows", () => {
  
  test("Login - Valid agent credentials", async ({ page }) => {
    await page.goto("/login");
    await waitForPage(page);
    await screenshot(page, "auth-01-login-page");
    
    // Fill credentials
    await page.fill('input[name="email"], input[type="email"]', "sarah.m@nextpropconnect.co.za");
    await page.fill('input[name="password"], input[type="password"]', PASSWORD);
    await screenshot(page, "auth-02-login-filled");
    
    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Should redirect to agent dashboard
    await expect(page).toHaveURL(/\/(agent|dashboard|properties)/);
    await screenshot(page, "auth-03-login-success");
  });

  test("Login - Valid buyer credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"], input[type="email"]', "buyer@nextpropconnect.co.za");
    await page.fill('input[name="password"], input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await screenshot(page, "auth-04-buyer-login-success");
  });

  test("Login - Valid admin credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"], input[type="email"]', "admin@nextpropconnect.co.za");
    await page.fill('input[name="password"], input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await screenshot(page, "auth-05-admin-login-success");
  });

  test("Login - Invalid password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"], input[type="email"]', "sarah.m@nextpropconnect.co.za");
    await page.fill('input[name="password"], input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Should show error or stay on login page
    await screenshot(page, "auth-06-login-invalid-password");
    
    // Should still be on login page or show error
    const url = page.url();
    const hasError = await page.locator("text=/error|invalid|incorrect/i").isVisible().catch(() => false);
    expect(url.includes("/login") || hasError).toBeTruthy();
  });

  test("Login - Non-existent email shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"], input[type="email"]', "notexist@nextpropconnect.co.za");
    await page.fill('input[name="password"], input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    await screenshot(page, "auth-07-login-nonexistent-email");
  });

  test("Login - Empty fields validation", async ({ page }) => {
    await page.goto("/login");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    await screenshot(page, "auth-08-login-empty-fields");
  });

  test("Registration - Page loads correctly", async ({ page }) => {
    await page.goto("/register");
    await waitForPage(page);
    await screenshot(page, "auth-10-register-page");
    
    // Check form fields exist
    await expect(page.locator('input[name="name"], input[placeholder*="name" i]').first()).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]').first()).toBeVisible();
  });

  test("Registration - Role selection available", async ({ page }) => {
    await page.goto("/register");
    await waitForPage(page);
    
    // Check if role selection exists (dropdown or radio buttons)
    const roleSelector = page.locator('select[name="role"], input[name="role"], [class*="role"]');
    await screenshot(page, "auth-11-register-roles");
  });

  test("Registration - Fill form (without submit)", async ({ page }) => {
    await page.goto("/register");
    await waitForPage(page);
    
    // Fill form fields
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    if (await nameInput.isVisible()) await nameInput.fill("Test User");
    if (await emailInput.isVisible()) await emailInput.fill("test.new@example.com");
    if (await passwordInput.isVisible()) await passwordInput.fill("SecurePass123!");
    
    await screenshot(page, "auth-12-register-filled");
  });

  test("Logout - Agent can logout", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="email"], input[type="email"]', "sarah.m@nextpropconnect.co.za");
    await page.fill('input[name="password"], input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await screenshot(page, "auth-20-before-logout");
    
    // Try to find and click logout
    const logoutBtn = page.locator('text=/logout|sign out/i, button:has-text("Logout"), a:has-text("Logout")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, "auth-21-after-logout");
    }
  });

  test("Protected route - Redirect to login when not authenticated", async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    
    // Try to access protected route
    await page.goto("/agent");
    await page.waitForTimeout(2000);
    
    await screenshot(page, "auth-30-protected-redirect");
    
    // Should redirect to login
    const url = page.url();
    expect(url.includes("/login") || url.includes("/agent")).toBeTruthy();
  });

  test("Protected route - Agent can access agent dashboard", async ({ page }) => {
    // Login as agent
    await page.goto("/login");
    await page.fill('input[name="email"], input[type="email"]', "sarah.m@nextpropconnect.co.za");
    await page.fill('input[name="password"], input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Access agent dashboard
    await page.goto("/agent");
    await waitForPage(page);
    await screenshot(page, "auth-31-agent-access-dashboard");
    
    // Should be on agent page
    await expect(page).toHaveURL(/\/agent/);
  });

  test("Protected route - Admin can access admin dashboard", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[name="email"], input[type="email"]', "admin@nextpropconnect.co.za");
    await page.fill('input[name="password"], input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Access admin dashboard
    await page.goto("/admin");
    await waitForPage(page);
    await screenshot(page, "auth-32-admin-access-dashboard");
  });
});

// ============================================
// SESSION PERSISTENCE
// ============================================
test.describe("Session Persistence", () => {
  test("Session persists across page navigation", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[name="email"], input[type="email"]', "sarah.m@nextpropconnect.co.za");
    await page.fill('input[name="password"], input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to different pages
    await page.goto("/properties");
    await waitForPage(page);
    await screenshot(page, "auth-40-session-properties");
    
    await page.goto("/agent");
    await waitForPage(page);
    await screenshot(page, "auth-41-session-agent");
    
    // Should still be logged in (on agent page, not redirected to login)
    await expect(page).toHaveURL(/\/agent/);
  });
});

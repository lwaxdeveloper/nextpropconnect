import { test as setup, expect } from "@playwright/test";
import path from "path";

const USERS = {
  agent: {
    email: "sarah.m@nextpropconnect.co.za",
    password: "test1234",
    storageState: path.join(__dirname, "../.auth/agent.json"),
  },
  admin: {
    email: "admin@nextpropconnect.co.za", 
    password: "test1234",
    storageState: path.join(__dirname, "../.auth/admin.json"),
  },
  seller: {
    email: "owner@nextpropconnect.co.za",
    password: "test1234",
    storageState: path.join(__dirname, "../.auth/seller.json"),
  },
};

// Authenticate as agent
setup("authenticate as agent", async ({ page }) => {
  const user = USERS.agent;
  
  await page.goto("/login");
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL(/\/(agent|dashboard|properties)/);
  
  // Save authentication state
  await page.context().storageState({ path: user.storageState });
});

// Authenticate as admin
setup("authenticate as admin", async ({ page }) => {
  const user = USERS.admin;
  
  await page.goto("/login");
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(admin|dashboard)/);
  await page.context().storageState({ path: user.storageState });
});

// Authenticate as seller
setup("authenticate as seller", async ({ page }) => {
  const user = USERS.seller;
  
  await page.goto("/login");
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/(dashboard|properties)/);
  await page.context().storageState({ path: user.storageState });
});

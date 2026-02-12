import { test, expect, Page } from "@playwright/test";

const SCREENSHOT_DIR = "tests/screenshots";

// Test users - all use password: test1234
const USERS = {
  admin: "admin@propconnect.co.za",
  agent: "sarah.m@propconnect.co.za",
  buyer: "buyer@propconnect.co.za",
  renter: "renter@propconnect.co.za",
  seller: "owner@propconnect.co.za", // Private seller
  landlord: "landlord@propconnect.co.za",
};

const PASSWORD = "test1234";

// Helper functions
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

// More robust page wait - doesn't hang on networkidle
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  // Give time for JS to hydrate without waiting for all network requests
  await page.waitForTimeout(1500);
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await waitForPage(page);
  
  // Fill and submit
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  
  // Wait for redirect away from login page (up to 15 seconds)
  try {
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
  } catch {
    // If redirect didn't happen, wait a bit more
    await page.waitForTimeout(5000);
  }
  
  // Wait for page to load after login redirect - use domcontentloaded instead of networkidle
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1500);
}

// Ensure we're not on login page before taking screenshot
async function ensureLoggedIn(page: Page) {
  const url = page.url();
  if (url.includes("/login")) {
    console.log("Still on login page, waiting...");
    await page.waitForTimeout(3000);
  }
}

// ============================================
// VISITOR JOURNEY (Unauthenticated)
// ============================================
test.describe("1. Visitor Journey", () => {
  test("1.1 Homepage loads", async ({ page }) => {
    await page.goto("/");
    await waitForPage(page);
    await screenshot(page, "01-visitor-homepage");
    
    await expect(page).toHaveTitle(/NextPropConnect/i);
  });

  test("1.2 Browse property listings", async ({ page }) => {
    await page.goto("/properties");
    await waitForPage(page);
    await screenshot(page, "02-visitor-properties");
  });

  test("1.3 View property detail", async ({ page }) => {
    // Go directly to a known property
    await page.goto("/properties/44");
    await waitForPageLoad(page);
    await screenshot(page, "03-visitor-property-detail");
  });

  test("1.4 View pricing page", async ({ page }) => {
    await page.goto("/pricing");
    await waitForPageLoad(page);
    await screenshot(page, "04-visitor-pricing");
    
    // More specific check - look for pricing tier text
    const hasPricingContent = await page.locator('text=/Free|Starter|Pro|Agency/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasPricingContent || await page.locator('[class*="pricing"], [class*="plan"], [class*="tier"]').count() > 0).toBeTruthy();
  });

  test("1.5 View agent profile", async ({ page }) => {
    // Go to a specific agent profile
    await page.goto("/agents/3");
    await waitForPageLoad(page);
    await screenshot(page, "05-visitor-agent-profile");
  });

  test("1.6 Registration page", async ({ page }) => {
    await page.goto("/register");
    await waitForPage(page);
    await screenshot(page, "06-visitor-register");
  });

  test("1.7 Login page", async ({ page }) => {
    await page.goto("/login");
    await waitForPage(page);
    await screenshot(page, "07-visitor-login");
  });
});

// ============================================
// BUYER JOURNEY
// ============================================
test.describe("2. Buyer Journey", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.buyer);
  });

  test("2.1 Buyer dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPageLoad(page);
    await ensureLoggedIn(page);
    await screenshot(page, "10-buyer-dashboard");
  });

  test("2.2 Search properties for sale", async ({ page }) => {
    await page.goto("/properties?listing_type=sale");
    await waitForPage(page);
    await screenshot(page, "11-buyer-search-sale");
  });

  test("2.3 Filter by price & bedrooms", async ({ page }) => {
    await page.goto("/properties?min_price=500000&max_price=2000000&bedrooms=3");
    await waitForPage(page);
    await screenshot(page, "12-buyer-filtered");
  });

  test("2.4 Save property alert", async ({ page }) => {
    await page.goto("/alerts");
    await waitForPageLoad(page);
    await screenshot(page, "13-buyer-alerts");
  });

  test("2.5 Contact agent", async ({ page }) => {
    await page.goto("/properties");
    await waitForPage(page);
    
    const propertyLink = page.locator('a[href^="/properties/"]').first();
    if (await propertyLink.isVisible()) {
      await propertyLink.click();
      await waitForPage(page);
      await screenshot(page, "14-buyer-contact-agent");
    }
  });

  test("2.6 View messages", async ({ page }) => {
    await page.goto("/messages");
    await waitForPage(page);
    await screenshot(page, "15-buyer-messages");
  });
});

// ============================================
// RENTER JOURNEY
// ============================================
test.describe("3. Renter Journey", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.renter);
  });

  test("3.1 Search rentals", async ({ page }) => {
    await page.goto("/properties?listing_type=rent");
    await waitForPage(page);
    await screenshot(page, "20-renter-search-rentals");
  });

  test("3.2 Filter affordable rentals", async ({ page }) => {
    await page.goto("/properties?listing_type=rent&max_price=15000");
    await waitForPage(page);
    await screenshot(page, "21-renter-affordable");
  });

  test("3.3 View rental property", async ({ page }) => {
    await page.goto("/properties?listing_type=rent");
    await waitForPage(page);
    
    const propertyLink = page.locator('a[href^="/properties/"]').first();
    if (await propertyLink.isVisible()) {
      await propertyLink.click();
      await waitForPage(page);
      await screenshot(page, "22-renter-property-detail");
    }
  });

  test("3.4 Create rental alert", async ({ page }) => {
    await page.goto("/alerts");
    await waitForPageLoad(page);
    await screenshot(page, "23-renter-alerts");
  });
});

// ============================================
// PRIVATE SELLER JOURNEY
// ============================================
test.describe("4. Private Seller Journey", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.seller);
  });

  test("4.1 Seller dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPageLoad(page);
    await ensureLoggedIn(page);
    await screenshot(page, "30-seller-dashboard");
  });

  test("4.2 Create new listing", async ({ page }) => {
    await page.goto("/properties/new");
    await waitForPageLoad(page);
    await ensureLoggedIn(page);
    await screenshot(page, "31-seller-new-listing");
  });

  test("4.3 View my listings", async ({ page }) => {
    await page.goto("/properties");
    await waitForPageLoad(page);
    await ensureLoggedIn(page);
    await screenshot(page, "32-seller-my-listings");
  });

  test("4.4 View inquiries/messages", async ({ page }) => {
    await page.goto("/messages");
    await waitForPageLoad(page);
    await ensureLoggedIn(page);
    await screenshot(page, "33-seller-messages");
  });

  test("4.5 View pricing for sellers", async ({ page }) => {
    await page.goto("/pricing");
    await waitForPage(page);
    await screenshot(page, "34-seller-pricing");
  });
});

// ============================================
// LANDLORD JOURNEY
// ============================================
test.describe("5. Landlord Journey", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.landlord);
  });

  test("5.1 Landlord dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPageLoad(page);
    await ensureLoggedIn(page);
    await screenshot(page, "40-landlord-dashboard");
  });

  test("5.2 Create rental listing", async ({ page }) => {
    await page.goto("/properties/new");
    await waitForPageLoad(page);
    await ensureLoggedIn(page);
    await screenshot(page, "41-landlord-new-rental");
  });

  test("5.3 View rental inquiries", async ({ page }) => {
    await page.goto("/messages");
    await waitForPageLoad(page);
    await ensureLoggedIn(page);
    await screenshot(page, "42-landlord-inquiries");
  });

  test("5.4 Manage properties", async ({ page }) => {
    await page.goto("/properties");
    await waitForPageLoad(page);
    await ensureLoggedIn(page);
    await screenshot(page, "43-landlord-properties");
  });
});

// ============================================
// AGENT JOURNEY
// ============================================
test.describe("6. Agent Journey", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.agent);
  });

  test("6.1 Agent dashboard overview", async ({ page }) => {
    await page.goto("/agent");
    await waitForPage(page);
    await screenshot(page, "50-agent-dashboard");
  });

  test("6.2 Manage leads", async ({ page }) => {
    await page.goto("/agent/leads");
    await waitForPage(page);
    await screenshot(page, "51-agent-leads");
  });

  test("6.3 View analytics", async ({ page }) => {
    await page.goto("/agent/analytics");
    await waitForPage(page);
    await screenshot(page, "52-agent-analytics");
  });

  test("6.4 WhatsApp conversations", async ({ page }) => {
    await page.goto("/agent/conversations");
    await waitForPage(page);
    await screenshot(page, "53-agent-whatsapp");
  });

  test("6.5 Bulk messaging", async ({ page }) => {
    await page.goto("/agent/bulk-message");
    await waitForPage(page);
    await screenshot(page, "54-agent-bulk-message");
  });

  test("6.6 Commission tracking", async ({ page }) => {
    await page.goto("/agent/commissions");
    await waitForPage(page);
    await screenshot(page, "55-agent-commissions");
  });

  test("6.7 Social post generator", async ({ page }) => {
    await page.goto("/agent/social");
    await waitForPage(page);
    await screenshot(page, "56-agent-social");
  });

  test("6.8 Flyer generator", async ({ page }) => {
    await page.goto("/agent/flyer");
    await waitForPage(page);
    await screenshot(page, "57-agent-flyer");
  });

  test("6.9 Team management", async ({ page }) => {
    await page.goto("/agent/team");
    await waitForPage(page);
    await screenshot(page, "58-agent-team");
  });

  test("6.10 Billing & subscription", async ({ page }) => {
    await page.goto("/agent/billing");
    await waitForPage(page);
    await screenshot(page, "59-agent-billing");
  });

  test("6.11 Profile settings", async ({ page }) => {
    await page.goto("/agent/profile");
    await waitForPage(page);
    await screenshot(page, "60-agent-profile");
  });

  test("6.12 Create new listing", async ({ page }) => {
    await page.goto("/properties/new");
    await waitForPage(page);
    await screenshot(page, "61-agent-new-listing");
  });

  test("6.13 Message templates", async ({ page }) => {
    await page.goto("/agent/templates");
    await waitForPage(page);
    await screenshot(page, "62-agent-templates");
  });
});

// ============================================
// ADMIN JOURNEY
// ============================================
test.describe("7. Admin Journey", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.admin);
  });

  test("7.1 Admin dashboard", async ({ page }) => {
    await page.goto("/admin");
    await waitForPage(page);
    await screenshot(page, "70-admin-dashboard");
  });

  test("7.2 User management", async ({ page }) => {
    await page.goto("/admin");
    await waitForPage(page);
    await screenshot(page, "71-admin-users");
  });

  test("7.3 View all properties", async ({ page }) => {
    await page.goto("/properties");
    await waitForPage(page);
    await screenshot(page, "72-admin-properties");
  });
});

// ============================================
// SUBSCRIPTION JOURNEY
// ============================================
test.describe("8. Subscription Journey", () => {
  test("8.1 View subscription plans", async ({ page }) => {
    await page.goto("/pricing");
    await waitForPage(page);
    await screenshot(page, "80-subscription-pricing");
  });

  test("8.2 Subscribe to Starter", async ({ page }) => {
    await login(page, USERS.agent);
    await page.goto("/subscribe/starter");
    await waitForPage(page);
    await screenshot(page, "81-subscribe-starter");
  });

  test("8.3 Subscribe to Pro", async ({ page }) => {
    await login(page, USERS.agent);
    await page.goto("/subscribe/pro");
    await waitForPage(page);
    await screenshot(page, "82-subscribe-pro");
  });

  test("8.4 Subscribe to Agency", async ({ page }) => {
    await login(page, USERS.agent);
    await page.goto("/subscribe/agency");
    await waitForPage(page);
    await screenshot(page, "83-subscribe-agency");
  });
});

// ============================================
// MOBILE RESPONSIVE
// ============================================
test.describe("9. Mobile Responsive", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("9.1 Mobile homepage", async ({ page }) => {
    await page.goto("/");
    await waitForPage(page);
    await screenshot(page, "90-mobile-homepage");
  });

  test("9.2 Mobile property list", async ({ page }) => {
    await page.goto("/properties");
    await waitForPage(page);
    await screenshot(page, "91-mobile-properties");
  });

  test("9.3 Mobile pricing", async ({ page }) => {
    await page.goto("/pricing");
    await waitForPage(page);
    await screenshot(page, "92-mobile-pricing");
  });

  test("9.4 Mobile agent dashboard", async ({ page }) => {
    await login(page, USERS.agent);
    await page.goto("/agent");
    await waitForPage(page);
    await screenshot(page, "93-mobile-agent-dashboard");
  });

  test("9.5 Mobile login", async ({ page }) => {
    await page.goto("/login");
    await waitForPage(page);
    await screenshot(page, "94-mobile-login");
  });
});

// ============================================
// RENTAL MANAGEMENT (Phase 7)
// ============================================
test.describe("10. Rental Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.agent); // Use agent user for rentals
  });

  test("10.1 Rentals dashboard", async ({ page }) => {
    await page.goto("/agent/rentals");
    await waitForPageLoad(page);
    await screenshot(page, "100-rentals-dashboard");
  });

  test("10.2 Tenants list", async ({ page }) => {
    await page.goto("/agent/rentals/tenants");
    await waitForPageLoad(page);
    await screenshot(page, "101-rentals-tenants");
  });

  test("10.3 Add tenant form", async ({ page }) => {
    await page.goto("/agent/rentals/tenants/new");
    await waitForPageLoad(page);
    await screenshot(page, "102-rentals-add-tenant");
  });

  test("10.4 Payments overview", async ({ page }) => {
    await page.goto("/agent/rentals/payments");
    await waitForPageLoad(page);
    await screenshot(page, "103-rentals-payments");
  });

  test("10.5 Maintenance requests", async ({ page }) => {
    await page.goto("/agent/rentals/maintenance");
    await waitForPageLoad(page);
    await screenshot(page, "104-rentals-maintenance");
  });
});

// ============================================
// TENANT PORTAL (Phase 7)
// ============================================
test.describe("11. Tenant Portal", () => {
  test("11.1 Tenant portal page", async ({ page }) => {
    await login(page, USERS.renter);
    await page.goto("/tenant");
    await waitForPageLoad(page);
    await screenshot(page, "110-tenant-portal");
  });
});

// ============================================
// REVIEWS & TRUST (Phase 5)
// ============================================
test.describe("12. Reviews & Trust", () => {
  test("12.1 Agent reviews dashboard", async ({ page }) => {
    await login(page, USERS.agent);
    await page.goto("/agent/reviews");
    await waitForPageLoad(page);
    await screenshot(page, "120-agent-reviews");
  });

  test("12.2 Leave review for agent", async ({ page }) => {
    await login(page, USERS.buyer);
    // Go to an agent profile and look for review option
    await page.goto("/agents/2");
    await waitForPageLoad(page);
    await screenshot(page, "121-leave-review");
  });

  test("12.3 Admin moderation page", async ({ page }) => {
    await login(page, USERS.admin);
    await page.goto("/admin/moderation");
    await waitForPageLoad(page);
    await screenshot(page, "122-admin-moderation");
  });
});

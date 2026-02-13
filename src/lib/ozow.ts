/**
 * Ozow Payment Integration
 * 
 * Ozow is a South African instant EFT payment provider.
 * Much cheaper than card payments (~1% vs 2.9%)
 * 
 * Flow:
 * 1. Create payment hash with transaction details
 * 2. Redirect user to Ozow payment page
 * 3. User selects bank and completes payment
 * 4. Ozow calls webhook + redirects back
 */

import crypto from "crypto";

// Configuration
const OZOW_SITE_CODE = process.env.OZOW_SITE_CODE || "";
const OZOW_PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY || "";
const OZOW_API_KEY = process.env.OZOW_API_KEY || "";
const OZOW_TEST_MODE = process.env.OZOW_TEST_MODE === "true";

const OZOW_PAY_URL = OZOW_TEST_MODE
  ? "https://pay.ozow.com"
  : "https://pay.ozow.com";

export interface OzowPaymentRequest {
  transactionReference: string;
  amount: number; // In cents (R100 = 10000)
  bankReference: string;
  customer?: string;
  cancelUrl: string;
  errorUrl: string;
  successUrl: string;
  notifyUrl: string;
  isTest?: boolean;
}

export interface OzowPaymentResponse {
  paymentUrl: string;
  transactionId: string;
}

/**
 * Check if Ozow is configured
 */
export function isOzowConfigured(): boolean {
  return !!(OZOW_SITE_CODE && OZOW_PRIVATE_KEY);
}

/**
 * Generate Ozow payment hash
 * NOTE: Input should NOT be lowercased - Ozow expects original case
 * Only the final hash comparison is case-insensitive
 */
function generateHash(data: string): string {
  return crypto
    .createHash("sha512")
    .update(data)
    .digest("hex");
}

/**
 * Create Ozow payment URL
 */
export function createPaymentUrl(request: OzowPaymentRequest): string {
  const {
    transactionReference,
    amount,
    bankReference,
    customer,
    cancelUrl,
    errorUrl,
    successUrl,
    notifyUrl,
    isTest = OZOW_TEST_MODE,
  } = request;

  // Amount in Rands (Ozow expects decimal)
  const amountStr = (amount / 100).toFixed(2);

  // EXTREME LOGGING - Debug Ozow issues
  console.log("=".repeat(80));
  console.log("[Ozow] PAYMENT REQUEST DEBUG");
  console.log("=".repeat(80));
  console.log("[Ozow] Environment:");
  console.log("  OZOW_SITE_CODE:", OZOW_SITE_CODE ? `${OZOW_SITE_CODE.substring(0, 8)}...` : "NOT SET");
  console.log("  OZOW_PRIVATE_KEY:", OZOW_PRIVATE_KEY ? `${OZOW_PRIVATE_KEY.length} chars` : "NOT SET");
  console.log("  OZOW_TEST_MODE:", OZOW_TEST_MODE);
  console.log("  isTest param:", isTest);
  console.log("[Ozow] Request params:");
  console.log("  transactionReference:", transactionReference);
  console.log("  amount (cents):", amount);
  console.log("  amountStr (Rands):", amountStr);
  console.log("  bankReference:", bankReference);
  console.log("  customer:", customer);
  console.log("  cancelUrl:", cancelUrl);
  console.log("  errorUrl:", errorUrl);
  console.log("  successUrl:", successUrl);
  console.log("  notifyUrl:", notifyUrl);

  // Generate hash
  // According to Ozow docs: SiteCode + CountryCode + CurrencyCode + Amount + TransactionReference + BankReference + CancelUrl + ErrorUrl + SuccessUrl + NotifyUrl + IsTest + PrivateKey
  // Note: Customer/Optional fields are NOT included in hash
  const hashInputArray = [
    OZOW_SITE_CODE,
    "ZA",
    "ZAR",
    amountStr,
    transactionReference,
    bankReference,
    cancelUrl,
    errorUrl,
    successUrl,
    notifyUrl,
    isTest ? "true" : "false",
    OZOW_PRIVATE_KEY,
  ];
  
  console.log("[Ozow] Hash input array (without private key):");
  hashInputArray.slice(0, -1).forEach((val, i) => {
    console.log(`  [${i}]: "${val}"`);
  });
  console.log(`  [11]: [PRIVATE_KEY - ${OZOW_PRIVATE_KEY.length} chars]`);
  
  const hashInput = hashInputArray.join("");
  console.log("[Ozow] Hash input string length:", hashInput.length);
  console.log("[Ozow] Hash input (redacted):", hashInput.replace(OZOW_PRIVATE_KEY, "[PRIVATE_KEY]"));
  
  const hashCheck = generateHash(hashInput);
  console.log("[Ozow] Generated hash:", hashCheck);

  // Build payment URL
  const params = new URLSearchParams({
    SiteCode: OZOW_SITE_CODE,
    CountryCode: "ZA",
    CurrencyCode: "ZAR",
    Amount: amountStr,
    TransactionReference: transactionReference,
    BankReference: bankReference,
    Customer: customer || "",
    CancelUrl: cancelUrl,
    ErrorUrl: errorUrl,
    SuccessUrl: successUrl,
    NotifyUrl: notifyUrl,
    IsTest: isTest ? "true" : "false",
    HashCheck: hashCheck,
  });

  const fullUrl = `${OZOW_PAY_URL}?${params.toString()}`;
  console.log("[Ozow] Full payment URL:", fullUrl);
  console.log("=".repeat(80));

  return fullUrl;
}

/**
 * Verify Ozow webhook/callback hash
 */
export function verifyHash(data: Record<string, string>): boolean {
  const {
    SiteCode,
    TransactionId,
    TransactionReference,
    Amount,
    Status,
    Optional1,
    Optional2,
    Optional3,
    Optional4,
    Optional5,
    CurrencyCode,
    IsTest,
    StatusMessage,
    Hash,
  } = data;

  const hashInput = [
    SiteCode,
    TransactionId,
    TransactionReference,
    Amount,
    Status,
    Optional1 || "",
    Optional2 || "",
    Optional3 || "",
    Optional4 || "",
    Optional5 || "",
    CurrencyCode,
    IsTest,
    StatusMessage || "",
    OZOW_PRIVATE_KEY,
  ].join("");

  const expectedHash = generateHash(hashInput);
  return expectedHash.toLowerCase() === (Hash || "").toLowerCase();
}

/**
 * Payment status codes
 */
export const OZOW_STATUS = {
  COMPLETE: "Complete",
  CANCELLED: "Cancelled",
  ERROR: "Error",
  ABANDONED: "Abandoned",
  PENDING: "PendingInvestigation",
} as const;

/**
 * Subscription plans
 */
export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    price: 0,
    listings: 1,
    features: ["1 listing", "Basic support", "Standard visibility"],
  },
  starter: {
    name: "Starter",
    price: 29900, // R299/month in cents
    listings: 5,
    features: ["5 listings", "Email support", "Enhanced visibility", "Basic analytics"],
  },
  pro: {
    name: "Pro",
    price: 59900, // R599/month
    listings: 20,
    features: ["20 listings", "Priority support", "Featured badge", "Full analytics", "Bulk messaging"],
  },
  agency: {
    name: "Agency",
    price: 149900, // R1,499/month
    listings: 100,
    features: ["100 listings", "Dedicated support", "Team management", "White-label options", "API access"],
  },
} as const;

/**
 * Boost types
 */
export const BOOST_TYPES = {
  spotlight: {
    name: "Spotlight",
    price: 9900, // R99
    days: 7,
    description: "Featured on homepage for 7 days",
  },
  premium: {
    name: "Premium",
    price: 19900, // R199
    days: 14,
    description: "Top of search results for 14 days",
  },
  mega: {
    name: "Mega Boost",
    price: 49900, // R499
    days: 30,
    description: "Maximum visibility for 30 days",
  },
} as const;

/**
 * Private seller listing fee
 */
export const LISTING_FEES = {
  basic: {
    name: "Basic Listing",
    price: 49900, // R499
    days: 90,
    features: ["90 day listing", "Up to 10 photos", "Standard support"],
  },
  premium: {
    name: "Premium Listing",
    price: 99900, // R999
    days: 90,
    features: ["90 day listing", "Up to 20 photos", "AI description", "Social media promotion"],
  },
} as const;

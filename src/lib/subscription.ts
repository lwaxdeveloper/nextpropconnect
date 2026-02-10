import { query } from "./db";
import { SUBSCRIPTION_PLANS } from "./ozow";

export interface UserSubscription {
  plan: keyof typeof SUBSCRIPTION_PLANS;
  status: "active" | "cancelled" | "expired" | "suspended";
  isTrialing: boolean;
  trialEndsAt: Date | null;
  expiresAt: Date | null;
  listingsAllowed: number;
  listingsUsed: number;
  canCreateListing: boolean;
  features: readonly string[];
}

/**
 * Get subscription status for a user
 */
export async function getSubscription(userId: number): Promise<UserSubscription> {
  // Get subscription
  const subResult = await query(
    `SELECT plan, status, is_trial, trial_ends_at, expires_at
     FROM subscriptions 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId]
  );

  // Count active listings
  const listingsResult = await query(
    `SELECT COUNT(*) as count FROM properties 
     WHERE (user_id = $1 OR agent_id = $1) AND status = 'active'`,
    [userId]
  );

  const listingsUsed = parseInt(listingsResult.rows[0]?.count || "0");

  // Default to free plan
  if (subResult.rows.length === 0) {
    const freePlan = SUBSCRIPTION_PLANS.free;
    return {
      plan: "free",
      status: "active",
      isTrialing: false,
      trialEndsAt: null,
      expiresAt: null,
      listingsAllowed: freePlan.listings,
      listingsUsed,
      canCreateListing: listingsUsed < freePlan.listings,
      features: freePlan.features,
    };
  }

  const sub = subResult.rows[0];
  const planKey = (sub.plan as keyof typeof SUBSCRIPTION_PLANS) || "free";
  const planData = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free;

  // Check if subscription/trial is expired
  const now = new Date();
  const expiresAt = sub.expires_at ? new Date(sub.expires_at) : null;
  const trialEndsAt = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
  
  let status = sub.status as UserSubscription["status"];
  
  if (expiresAt && expiresAt < now && status === "active") {
    status = "expired";
    // Update in DB
    await query(
      `UPDATE subscriptions SET status = 'expired' WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
  }

  // If expired or suspended, revert to free plan limits
  const isActive = status === "active" || status === "cancelled"; // cancelled still has access until expires
  const effectivePlan = isActive ? planData : SUBSCRIPTION_PLANS.free;
  const effectiveListings = isActive ? planData.listings : SUBSCRIPTION_PLANS.free.listings;

  return {
    plan: isActive ? planKey : "free",
    status,
    isTrialing: sub.is_trial && trialEndsAt !== null && trialEndsAt > now,
    trialEndsAt,
    expiresAt,
    listingsAllowed: effectiveListings,
    listingsUsed,
    canCreateListing: listingsUsed < effectiveListings,
    features: effectivePlan.features,
  };
}

/**
 * Check if user can create a new listing
 */
export async function canCreateListing(userId: number): Promise<{ allowed: boolean; reason?: string }> {
  const sub = await getSubscription(userId);
  
  if (sub.canCreateListing) {
    return { allowed: true };
  }

  if (sub.status === "expired") {
    return { 
      allowed: false, 
      reason: "Your subscription has expired. Please renew to create new listings." 
    };
  }

  if (sub.status === "suspended") {
    return { 
      allowed: false, 
      reason: "Your account is suspended. Please contact support." 
    };
  }

  return { 
    allowed: false, 
    reason: `You've reached your plan limit of ${sub.listingsAllowed} listing${sub.listingsAllowed !== 1 ? "s" : ""}. Upgrade to list more properties.` 
  };
}

/**
 * Check if user has access to a premium feature
 */
export async function hasFeature(userId: number, feature: string): Promise<boolean> {
  const sub = await getSubscription(userId);
  return sub.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
}

/**
 * Get days until trial/subscription expires
 */
export function getDaysRemaining(date: Date | null): number {
  if (!date) return 0;
  const now = new Date();
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

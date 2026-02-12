import { query } from "./db";

export interface SubscriptionStatus {
  plan: "free" | "trial" | "starter" | "pro" | "agency";
  isActive: boolean;
  isTrial: boolean;
  trialDaysLeft: number | null;
  expiresAt: Date | null;
  features: {
    maxListings: number;
    maxPhotos: number;
    analytics: boolean;
    bulkMessaging: boolean;
    teamManagement: boolean;
    prioritySupport: boolean;
  };
}

const PLAN_FEATURES = {
  free: {
    maxListings: 1,
    maxPhotos: 5,
    analytics: false,
    bulkMessaging: false,
    teamManagement: false,
    prioritySupport: false,
  },
  trial: {
    // Trial gets Pro features
    maxListings: 20,
    maxPhotos: 30,
    analytics: true,
    bulkMessaging: true,
    teamManagement: false,
    prioritySupport: true,
  },
  starter: {
    maxListings: 5,
    maxPhotos: 15,
    analytics: true,
    bulkMessaging: false,
    teamManagement: false,
    prioritySupport: false,
  },
  pro: {
    maxListings: 20,
    maxPhotos: 30,
    analytics: true,
    bulkMessaging: true,
    teamManagement: false,
    prioritySupport: true,
  },
  agency: {
    maxListings: 100,
    maxPhotos: 50,
    analytics: true,
    bulkMessaging: true,
    teamManagement: true,
    prioritySupport: true,
  },
};

// Alias for backward compatibility
export const getSubscription = getSubscriptionStatus;

export async function getSubscriptionStatus(userId: number): Promise<SubscriptionStatus> {
  const result = await query(
    `SELECT subscription_plan, trial_started_at, trial_ends_at, subscription_ends_at 
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return {
      plan: "free",
      isActive: true,
      isTrial: false,
      trialDaysLeft: null,
      expiresAt: null,
      features: PLAN_FEATURES.free,
    };
  }

  const user = result.rows[0];
  const now = new Date();
  
  // Check trial status
  if (user.subscription_plan === "trial" && user.trial_ends_at) {
    const trialEnds = new Date(user.trial_ends_at);
    const isTrialActive = trialEnds > now;
    const trialDaysLeft = isTrialActive 
      ? Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (isTrialActive) {
      return {
        plan: "trial",
        isActive: true,
        isTrial: true,
        trialDaysLeft,
        expiresAt: trialEnds,
        features: PLAN_FEATURES.trial,
      };
    } else {
      // Trial expired, fall back to free
      return {
        plan: "free",
        isActive: true,
        isTrial: false,
        trialDaysLeft: 0,
        expiresAt: null,
        features: PLAN_FEATURES.free,
      };
    }
  }

  // Check paid subscription
  if (user.subscription_ends_at) {
    const subEnds = new Date(user.subscription_ends_at);
    const isSubActive = subEnds > now;

    if (isSubActive) {
      const plan = user.subscription_plan as keyof typeof PLAN_FEATURES;
      return {
        plan,
        isActive: true,
        isTrial: false,
        trialDaysLeft: null,
        expiresAt: subEnds,
        features: PLAN_FEATURES[plan] || PLAN_FEATURES.free,
      };
    }
  }

  // Default to free
  return {
    plan: "free",
    isActive: true,
    isTrial: false,
    trialDaysLeft: null,
    expiresAt: null,
    features: PLAN_FEATURES.free,
  };
}

export async function canCreateListing(userId: number): Promise<{ allowed: boolean; reason?: string }> {
  const status = await getSubscriptionStatus(userId);
  
  // Count current listings
  const countResult = await query(
    `SELECT COUNT(*) as count FROM properties WHERE user_id = $1 AND status != 'deleted'`,
    [userId]
  );
  const currentCount = parseInt(countResult.rows[0].count);

  if (currentCount >= status.features.maxListings) {
    if (status.isTrial) {
      return {
        allowed: false,
        reason: `Trial limit reached (${status.features.maxListings} listings). Upgrade to continue.`,
      };
    }
    return {
      allowed: false,
      reason: `Plan limit reached (${status.features.maxListings} listings). Upgrade for more.`,
    };
  }

  return { allowed: true };
}

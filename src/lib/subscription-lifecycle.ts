/**
 * Subscription Lifecycle Management
 * 
 * Handles:
 * - Trial expiry notifications
 * - Payment reminders
 * - Grace period → Soft lock → Downgrade → Suspend
 * - Referral rewards
 */

import { query } from "./db";
import { sendEmail } from "./email";
import { SUBSCRIPTION_PLANS } from "./ozow";

// Lifecycle stages (days after expiry)
const LIFECYCLE = {
  REMINDER_BEFORE: 7,    // Remind 7 days before expiry
  REMINDER_ON: 0,        // Remind on expiry day
  GRACE_PERIOD: 7,       // 7 days grace after expiry
  SOFT_LOCK: 14,         // Soft lock at 14 days (can't create new listings)
  DOWNGRADE: 21,         // Downgrade to free at 21 days
  SUSPEND: 30,           // Suspend account at 30 days
};

interface SubscriptionCheck {
  id: number;
  userId: number;
  email: string;
  name: string;
  plan: string;
  status: string;
  expiresAt: Date;
  isTrialing: boolean;
  trialEndsAt: Date | null;
  daysUntilExpiry: number;
  daysOverdue: number;
}

/**
 * Process all subscription lifecycle events
 * Run this as a daily cron job
 */
export async function processSubscriptionLifecycle(): Promise<{
  reminders: number;
  gracePeriod: number;
  softLocked: number;
  downgraded: number;
  suspended: number;
}> {
  const stats = {
    reminders: 0,
    gracePeriod: 0,
    softLocked: 0,
    downgraded: 0,
    suspended: 0,
  };

  // Get all active/cancelled subscriptions
  const result = await query(`
    SELECT s.id, s.user_id, s.plan, s.status, s.expires_at, 
           s.is_trial, s.trial_ends_at,
           u.email, u.name,
           EXTRACT(DAY FROM s.expires_at - NOW()) as days_until_expiry,
           EXTRACT(DAY FROM NOW() - s.expires_at) as days_overdue
    FROM subscriptions s
    JOIN users u ON s.user_id = u.id
    WHERE s.status IN ('active', 'cancelled', 'grace', 'soft_locked')
    ORDER BY s.expires_at ASC
  `);

  for (const row of result.rows) {
    const sub: SubscriptionCheck = {
      id: row.id,
      userId: row.user_id,
      email: row.email,
      name: row.name,
      plan: row.plan,
      status: row.status,
      expiresAt: new Date(row.expires_at),
      isTrialing: row.is_trial,
      trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at) : null,
      daysUntilExpiry: parseInt(row.days_until_expiry) || 0,
      daysOverdue: parseInt(row.days_overdue) || 0,
    };

    // Trial expiring soon
    if (sub.isTrialing && sub.trialEndsAt) {
      const trialDaysRemaining = Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (trialDaysRemaining === 7) {
        await sendTrialExpiryReminder(sub, 7);
        stats.reminders++;
      } else if (trialDaysRemaining === 3) {
        await sendTrialExpiryReminder(sub, 3);
        stats.reminders++;
      } else if (trialDaysRemaining === 1) {
        await sendTrialExpiryReminder(sub, 1);
        stats.reminders++;
      }
    }

    // Payment reminders (before expiry)
    if (sub.daysUntilExpiry === LIFECYCLE.REMINDER_BEFORE && sub.status === "active") {
      await sendPaymentReminder(sub, LIFECYCLE.REMINDER_BEFORE);
      stats.reminders++;
    }

    // Expired - enter grace period
    if (sub.daysOverdue >= 1 && sub.daysOverdue < LIFECYCLE.GRACE_PERIOD && sub.status === "active") {
      await query(`UPDATE subscriptions SET status = 'grace' WHERE id = $1`, [sub.id]);
      await sendGracePeriodNotice(sub);
      stats.gracePeriod++;
    }

    // Soft lock (can't create new listings, but existing ones remain visible)
    if (sub.daysOverdue >= LIFECYCLE.SOFT_LOCK && sub.daysOverdue < LIFECYCLE.DOWNGRADE && sub.status === "grace") {
      await query(`UPDATE subscriptions SET status = 'soft_locked' WHERE id = $1`, [sub.id]);
      await sendSoftLockNotice(sub);
      stats.softLocked++;
    }

    // Downgrade to free plan
    if (sub.daysOverdue >= LIFECYCLE.DOWNGRADE && sub.daysOverdue < LIFECYCLE.SUSPEND && sub.status === "soft_locked") {
      await query(`
        UPDATE subscriptions 
        SET status = 'expired', plan = 'free', price_monthly = 0 
        WHERE id = $1
      `, [sub.id]);
      await sendDowngradeNotice(sub);
      stats.downgraded++;
    }

    // Suspend account (hide all listings)
    if (sub.daysOverdue >= LIFECYCLE.SUSPEND && sub.status !== "suspended") {
      await query(`UPDATE subscriptions SET status = 'suspended' WHERE id = $1`, [sub.id]);
      // Hide all user's listings
      await query(`UPDATE properties SET status = 'suspended' WHERE user_id = $1`, [sub.userId]);
      await sendSuspendNotice(sub);
      stats.suspended++;
    }
  }

  console.log(`[Lifecycle] Processed: ${JSON.stringify(stats)}`);
  return stats;
}

/**
 * Process referral rewards when a referred user makes their first payment
 */
export async function processReferralReward(paymentUserId: number, paymentAmount: number): Promise<void> {
  // Check if this user was referred
  const referralResult = await query(`
    SELECT r.id, r.referrer_id, r.code, u.email as referrer_email, u.name as referrer_name
    FROM referrals r
    JOIN users u ON r.referrer_id = u.id
    WHERE r.referred_id = $1 AND r.status = 'pending'
    LIMIT 1
  `, [paymentUserId]);

  if (referralResult.rows.length === 0) return;

  const referral = referralResult.rows[0];

  // Credit referrer with 1 month free (use the plan price)
  const planPrice = paymentAmount; // Or could be fixed amount
  const creditAmount = Math.min(planPrice, 59900); // Cap at Pro plan price

  // Update referral status
  await query(`
    UPDATE referrals 
    SET status = 'credited', credit_amount = $1, credited_at = NOW()
    WHERE id = $2
  `, [creditAmount, referral.id]);

  // Extend referrer's subscription by 1 month
  await query(`
    UPDATE subscriptions 
    SET expires_at = expires_at + INTERVAL '1 month'
    WHERE user_id = $1 AND status IN ('active', 'grace')
  `, [referral.referrer_id]);

  // Send notification email
  await sendEmail({
    to: referral.referrer_email,
    subject: "🎉 You earned a referral reward!",
    text: `Hi ${referral.referrer_name},

Great news! Someone you referred just subscribed to NextPropConnect.

Your reward: 1 month added to your subscription!

Keep sharing your referral link to earn more rewards.

Thanks for spreading the word!
The NextPropConnect Team`,
    html: `
      <h2>🎉 Referral Reward Earned!</h2>
      <p>Hi ${referral.referrer_name},</p>
      <p>Great news! Someone you referred just subscribed to NextPropConnect.</p>
      <p><strong>Your reward:</strong> 1 month added to your subscription!</p>
      <p>Keep sharing your referral link to earn more rewards.</p>
      <p>Thanks for spreading the word!<br>The NextPropConnect Team</p>
    `,
  });

  console.log(`[Referral] Credited ${referral.referrer_id} for referring ${paymentUserId}`);
}

// Email notification helpers
async function sendTrialExpiryReminder(sub: SubscriptionCheck, daysLeft: number): Promise<void> {
  const planData = SUBSCRIPTION_PLANS[sub.plan as keyof typeof SUBSCRIPTION_PLANS];
  
  await sendEmail({
    to: sub.email,
    subject: `⏰ Your NextPropConnect trial ends in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`,
    text: `Hi ${sub.name},

Your free trial of NextPropConnect ${planData?.name || sub.plan} ends in ${daysLeft} day${daysLeft > 1 ? "s" : ""}.

To continue enjoying all features without interruption, subscribe now at:
https://nextnextpropconnect.co.za/pricing

What you'll keep:
${planData?.features.map(f => `• ${f}`).join("\n") || "• All Pro features"}

Don't lose your momentum!
The NextPropConnect Team`,
    html: `
      <h2>⏰ Trial Ending Soon</h2>
      <p>Hi ${sub.name},</p>
      <p>Your free trial of NextPropConnect <strong>${planData?.name || sub.plan}</strong> ends in <strong>${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong>.</p>
      <p><a href="https://nextnextpropconnect.co.za/pricing" style="background:#E95420;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Subscribe Now</a></p>
      <p>Don't lose your momentum!<br>The NextPropConnect Team</p>
    `,
  });
}

async function sendPaymentReminder(sub: SubscriptionCheck, daysLeft: number): Promise<void> {
  await sendEmail({
    to: sub.email,
    subject: `📅 Your NextPropConnect subscription renews in ${daysLeft} days`,
    text: `Hi ${sub.name},

Your NextPropConnect subscription will renew in ${daysLeft} days.

If you need to update your payment method or have any questions, visit your billing page:
https://nextnextpropconnect.co.za/agent/billing

The NextPropConnect Team`,
    html: `
      <h2>📅 Subscription Renewal Reminder</h2>
      <p>Hi ${sub.name},</p>
      <p>Your NextPropConnect subscription will renew in <strong>${daysLeft} days</strong>.</p>
      <p><a href="https://nextnextpropconnect.co.za/agent/billing">Manage Billing</a></p>
      <p>The NextPropConnect Team</p>
    `,
  });
}

async function sendGracePeriodNotice(sub: SubscriptionCheck): Promise<void> {
  await sendEmail({
    to: sub.email,
    subject: "⚠️ Your NextPropConnect subscription has expired",
    text: `Hi ${sub.name},

Your NextPropConnect subscription has expired. You have ${LIFECYCLE.GRACE_PERIOD} days to renew before your account is affected.

Renew now: https://nextnextpropconnect.co.za/pricing

What happens if you don't renew:
• Day ${LIFECYCLE.SOFT_LOCK}: You won't be able to create new listings
• Day ${LIFECYCLE.DOWNGRADE}: Your account will be downgraded to Free
• Day ${LIFECYCLE.SUSPEND}: Your listings will be hidden

Don't lose your hard work!
The NextPropConnect Team`,
    html: `
      <h2>⚠️ Subscription Expired</h2>
      <p>Hi ${sub.name},</p>
      <p>Your NextPropConnect subscription has expired. You have <strong>${LIFECYCLE.GRACE_PERIOD} days</strong> to renew.</p>
      <p><a href="https://nextnextpropconnect.co.za/pricing" style="background:#E95420;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Renew Now</a></p>
      <p>The NextPropConnect Team</p>
    `,
  });
}

async function sendSoftLockNotice(sub: SubscriptionCheck): Promise<void> {
  await sendEmail({
    to: sub.email,
    subject: "🔒 Your NextPropConnect account is restricted",
    text: `Hi ${sub.name},

Your NextPropConnect account has been restricted due to non-payment.

You can no longer create new listings. Renew now to restore full access:
https://nextnextpropconnect.co.za/pricing

The NextPropConnect Team`,
    html: `
      <h2>🔒 Account Restricted</h2>
      <p>Hi ${sub.name},</p>
      <p>Your NextPropConnect account has been restricted. You cannot create new listings.</p>
      <p><a href="https://nextnextpropconnect.co.za/pricing" style="background:#E95420;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Restore Access</a></p>
    `,
  });
}

async function sendDowngradeNotice(sub: SubscriptionCheck): Promise<void> {
  await sendEmail({
    to: sub.email,
    subject: "📉 Your NextPropConnect account has been downgraded",
    text: `Hi ${sub.name},

Your NextPropConnect account has been downgraded to the Free plan due to non-payment.

You can only maintain 1 active listing. Additional listings have been paused.

Upgrade to restore all your listings: https://nextnextpropconnect.co.za/pricing

The NextPropConnect Team`,
    html: `
      <h2>📉 Account Downgraded</h2>
      <p>Hi ${sub.name},</p>
      <p>Your account has been downgraded to the <strong>Free plan</strong>.</p>
      <p>You can only maintain 1 active listing. Additional listings have been paused.</p>
      <p><a href="https://nextnextpropconnect.co.za/pricing" style="background:#E95420;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Upgrade Now</a></p>
    `,
  });
}

async function sendSuspendNotice(sub: SubscriptionCheck): Promise<void> {
  await sendEmail({
    to: sub.email,
    subject: "⛔ Your NextPropConnect account has been suspended",
    text: `Hi ${sub.name},

Your NextPropConnect account has been suspended due to extended non-payment.

All your listings have been hidden from public view.

To reactivate your account and restore your listings, please subscribe:
https://nextnextpropconnect.co.za/pricing

The NextPropConnect Team`,
    html: `
      <h2>⛔ Account Suspended</h2>
      <p>Hi ${sub.name},</p>
      <p>Your NextPropConnect account has been suspended. All listings are hidden.</p>
      <p><a href="https://nextnextpropconnect.co.za/pricing" style="background:#E95420;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Reactivate Account</a></p>
    `,
  });
}

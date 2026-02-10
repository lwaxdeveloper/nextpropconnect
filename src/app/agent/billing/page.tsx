"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  Receipt, 
  AlertCircle, 
  Check, 
  Download,
  Clock,
  Zap,
  Users,
  ArrowRight,
  Gift
} from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/ozow";

interface Subscription {
  id: number;
  plan: string;
  status: string;
  price_monthly: number;
  started_at: string;
  expires_at: string;
  cancelled_at: string | null;
  is_trial: boolean;
  trial_ends_at: string | null;
}

interface Payment {
  id: number;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  pdf_url: string | null;
}

type PlanKey = keyof typeof SUBSCRIPTION_PLANS;

function formatPrice(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA")}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDaysRemaining(date: string): number {
  const expires = new Date(date);
  const now = new Date();
  return Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function BillingPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [referralStats, setReferralStats] = useState({ count: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  async function fetchBillingData() {
    try {
      const res = await fetch("/api/billing");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
        setPayments(data.payments || []);
        setInvoices(data.invoices || []);
        setReferralCode(data.referralCode || "");
        setReferralStats(data.referralStats || { count: 0, earnings: 0 });
      }
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm("Are you sure you want to cancel your subscription? You'll retain access until the end of your billing period.")) {
      return;
    }
    
    setCancelling(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (res.ok) {
        fetchBillingData();
      }
    } catch (error) {
      console.error("Failed to cancel:", error);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan as PlanKey | undefined;
  const planData = currentPlan ? SUBSCRIPTION_PLANS[currentPlan] : SUBSCRIPTION_PLANS.free;
  const daysRemaining = subscription?.expires_at ? getDaysRemaining(subscription.expires_at) : 0;
  const isTrialing = subscription?.is_trial && subscription?.trial_ends_at;
  const trialDaysRemaining = isTrialing && subscription?.trial_ends_at 
    ? getDaysRemaining(subscription.trial_ends_at) 
    : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
        <CreditCard className="w-6 h-6" />
        Billing & Subscription
      </h1>

      {/* Trial Banner */}
      {isTrialing && trialDaysRemaining > 0 && (
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-4 text-white flex items-center gap-4">
          <Gift className="w-8 h-8" />
          <div className="flex-1">
            <p className="font-bold">🎉 Free Trial Active</p>
            <p className="text-sm opacity-90">
              {trialDaysRemaining} days remaining on your free trial. Enjoy full {planData.name} features!
            </p>
          </div>
          <button
            onClick={() => router.push("/pricing")}
            className="px-4 py-2 bg-white text-primary rounded-lg font-semibold text-sm hover:bg-white/90 transition"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Current Plan</p>
              <h2 className="text-2xl font-bold text-dark">{planData.name}</h2>
              {subscription?.status === "active" && (
                <span className="inline-flex items-center gap-1 text-sm text-green-600 mt-1">
                  <Check className="w-4 h-4" /> Active
                </span>
              )}
              {subscription?.status === "cancelled" && (
                <span className="inline-flex items-center gap-1 text-sm text-amber-600 mt-1">
                  <Clock className="w-4 h-4" /> Cancels {formatDate(subscription.expires_at)}
                </span>
              )}
            </div>
            <div className="text-right">
              {planData.price === 0 ? (
                <p className="text-2xl font-bold text-dark">Free</p>
              ) : (
                <>
                  <p className="text-2xl font-bold text-dark">{formatPrice(planData.price)}</p>
                  <p className="text-sm text-gray-500">/month</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500">Listings Allowed</p>
              <p className="text-lg font-bold text-dark">{planData.listings}</p>
            </div>
            {subscription?.expires_at && (
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500">Next Billing</p>
                <p className="text-lg font-bold text-dark">{formatDate(subscription.expires_at)}</p>
              </div>
            )}
            {subscription?.started_at && (
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500">Member Since</p>
                <p className="text-lg font-bold text-dark">{formatDate(subscription.started_at)}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {currentPlan !== "agency" && (
              <button
                onClick={() => router.push("/pricing")}
                className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> Upgrade Plan
              </button>
            )}
            {subscription && subscription.status === "active" && planData.price > 0 && !isTrialing && (
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="px-4 py-3 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Referral Program */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-dark mb-1">Referral Program</h3>
            <p className="text-sm text-gray-500 mb-3">
              Earn 1 month free for every agent you refer who subscribes!
            </p>
            
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={`https://nextnextpropconnect.co.za/register?ref=${referralCode}`}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://nextnextpropconnect.co.za/register?ref=${referralCode}`);
                }}
                className="px-4 py-2 bg-dark text-white rounded-lg text-sm font-medium hover:bg-dark/90 transition"
              >
                Copy
              </button>
            </div>

            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-gray-500">Referrals</p>
                <p className="font-bold text-dark">{referralStats.count}</p>
              </div>
              <div>
                <p className="text-gray-500">Credits Earned</p>
                <p className="font-bold text-dark">{formatPrice(referralStats.earnings)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-dark flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Payment History
          </h3>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No payments yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payments.map((payment) => (
              <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-dark capitalize">
                    {payment.type === "subscription" 
                      ? `${(payment.metadata?.plan as string) || "Plan"} Subscription`
                      : payment.type === "boost"
                      ? `${(payment.metadata?.boostType as string) || "Boost"} - Property`
                      : payment.type
                    }
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(payment.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-dark">{formatPrice(payment.amount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    payment.status === "completed" 
                      ? "bg-green-100 text-green-700"
                      : payment.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-dark">Invoices</h3>
          </div>

          <div className="divide-y divide-gray-100">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-dark">{invoice.invoice_number}</p>
                  <p className="text-sm text-gray-500">Due {formatDate(invoice.due_date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    invoice.status === "paid" 
                      ? "bg-green-100 text-green-700"
                      : invoice.status === "overdue"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {invoice.status}
                  </span>
                  <p className="font-bold text-dark">{formatPrice(invoice.amount)}</p>
                  {invoice.pdf_url && (
                    <a
                      href={invoice.pdf_url}
                      className="p-2 text-gray-400 hover:text-primary transition"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Prompt for Free Users */}
      {(!subscription || planData.price === 0) && (
        <div className="bg-gradient-to-br from-dark to-dark/90 rounded-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Unlock More Features</h3>
          <p className="opacity-80 mb-4">
            Upgrade to list more properties, access analytics, and grow your business.
          </p>
          <button
            onClick={() => router.push("/pricing")}
            className="px-6 py-3 bg-white text-dark rounded-lg font-semibold hover:bg-white/90 transition flex items-center gap-2"
          >
            View Plans <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

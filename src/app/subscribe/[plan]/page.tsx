"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS } from "@/lib/ozow";
import { Check, CreditCard, Building2 } from "lucide-react";

type PlanKey = keyof typeof SUBSCRIPTION_PLANS;

function formatPrice(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA")}`;
}

export default function SubscribePage() {
  const params = useParams();
  const router = useRouter();
  const planKey = params.plan as PlanKey;
  const plan = SUBSCRIPTION_PLANS[planKey];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!plan || plan.price === 0) {
      router.push("/pricing");
    }
  }, [plan, router]);

  if (!plan || plan.price === 0) {
    return null;
  }

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscription",
          plan: planKey,
          amount: plan.price,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Payment failed");
      }

      const data = await res.json();
      
      if (data.paymentUrl) {
        // Redirect to Ozow
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-primary p-6 text-white text-center">
            <h1 className="text-2xl font-bold mb-1">Subscribe to {plan.name}</h1>
            <p className="opacity-90">
              {formatPrice(plan.price)}/month
            </p>
          </div>

          {/* Plan Details */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-dark mb-3">What's included:</h2>
            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Method */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-dark mb-3">Payment Method</h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary bg-primary/5">
                <Building2 className="w-6 h-6 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-dark">Instant EFT (Ozow)</p>
                  <p className="text-xs text-gray-500">Pay directly from your bank account</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 opacity-50 cursor-not-allowed">
                <CreditCard className="w-6 h-6 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-400">Card Payment</p>
                  <p className="text-xs text-gray-400">Coming soon</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Monthly subscription</span>
              <span className="font-bold text-dark">{formatPrice(plan.price)}</span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : `Pay ${formatPrice(plan.price)}`}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              By subscribing, you agree to our Terms of Service. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Secured by Ozow</span>
        </div>
      </div>
    </div>
  );
}

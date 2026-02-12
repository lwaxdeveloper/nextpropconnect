import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { SUBSCRIPTION_PLANS } from "@/lib/ozow";
import Link from "next/link";
import { Check } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pricing — NextPropConnect SA",
  description: "Choose the right plan for your property business",
};

function formatPrice(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA")}`;
}

export default async function PricingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  let currentPlan = "free";
  
  if (isLoggedIn) {
    const userId = parseInt((session.user as { id?: string }).id || "0");
    const subResult = await query(
      `SELECT plan FROM subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );
    if (subResult.rows.length > 0) {
      currentPlan = subResult.rows[0].plan;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-dark mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
            const isPopular = key === "pro";
            return (
              <div
                key={key}
                className={`bg-white rounded-2xl p-6 border-2 transition hover:shadow-lg ${
                  isPopular ? "border-primary shadow-lg relative" : "border-gray-100"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <h3 className="text-xl font-bold text-dark mb-2">{plan.name}</h3>
                <div className="mb-4">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-black text-dark">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-dark">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-gray-500">/month</span>
                    </>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  Up to {plan.listings} listing{plan.listings !== 1 ? "s" : ""}
                </p>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isLoggedIn ? (
                  key === currentPlan ? (
                    <div className="block w-full py-3 rounded-xl font-semibold text-center bg-gray-100 text-gray-500">
                      ✓ Current Plan
                    </div>
                  ) : (
                    <Link
                      href={`/subscribe/${key}`}
                      className={`block w-full py-3 rounded-xl font-semibold text-center transition ${
                        isPopular
                          ? "bg-primary text-white hover:bg-primary/90"
                          : "bg-dark text-white hover:bg-dark/90"
                      }`}
                    >
                      {key === "free" ? "Downgrade" : "Upgrade Now"}
                    </Link>
                  )
                ) : (
                  <Link
                    href="/register"
                    className={`block w-full py-3 rounded-xl font-semibold text-center transition ${
                      isPopular
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "bg-dark text-white hover:bg-dark/90"
                    }`}
                  >
                    Sign Up Free
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Private Sellers Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-dark mb-2">Selling Without an Agent?</h2>
            <p className="text-gray-500">
              List your property and reach thousands of buyers directly
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-dark mb-2">Basic Listing</h3>
              <p className="text-2xl font-black text-dark mb-2">R499</p>
              <p className="text-sm text-gray-500 mb-4">One-time fee • 90 days</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Up to 10 photos
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Standard support
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Chat with buyers
                </li>
              </ul>
              <Link
                href={isLoggedIn ? "/properties/new?plan=basic" : "/register"}
                className="block w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-center font-medium hover:bg-gray-200 transition"
              >
                List Property
              </Link>
            </div>

            <div className="border-2 border-primary rounded-xl p-6 relative">
              <div className="absolute -top-3 left-4 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded">
                RECOMMENDED
              </div>
              <h3 className="font-bold text-dark mb-2">Premium Listing</h3>
              <p className="text-2xl font-black text-dark mb-2">R999</p>
              <p className="text-sm text-gray-500 mb-4">One-time fee • 90 days</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Up to 20 photos
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> AI description writer
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Social media promotion
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Priority support
                </li>
              </ul>
              <Link
                href={isLoggedIn ? "/properties/new?plan=premium" : "/register"}
                className="block w-full py-2 bg-primary text-white rounded-lg text-center font-medium hover:bg-primary/90 transition"
              >
                List Property
              </Link>
            </div>
          </div>
        </div>

        {/* Boost Section */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Need More Visibility?</h2>
          <p className="opacity-90 mb-6">
            Boost your listing to the top of search results and homepage
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/20 backdrop-blur rounded-xl px-6 py-3">
              <p className="font-bold">Spotlight</p>
              <p className="text-sm opacity-90">R99 / 7 days</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl px-6 py-3">
              <p className="font-bold">Premium</p>
              <p className="text-sm opacity-90">R199 / 14 days</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl px-6 py-3">
              <p className="font-bold">Mega Boost</p>
              <p className="text-sm opacity-90">R499 / 30 days</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-dark mb-4">Questions?</h2>
          <p className="text-gray-500">
            Contact us at{" "}
            <a href="mailto:support@nextpropconnect.co.za" className="text-primary hover:underline">
              support@nextpropconnect.co.za
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

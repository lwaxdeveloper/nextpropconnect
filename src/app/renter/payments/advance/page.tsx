"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AdvancePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"rent" | "deposit" | "custom">("rent");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for type param
    const typeParam = searchParams.get("type");
    if (typeParam === "deposit") {
      setPaymentType("deposit");
    }
    fetchTenantInfo();
  }, [searchParams]);

  const fetchTenantInfo = async () => {
    try {
      const res = await fetch("/api/renter/tenant-info");
      if (res.ok) {
        const data = await res.json();
        setTenant(data);
        // Set amount based on type param or default to rent
        const typeParam = searchParams.get("type");
        if (typeParam === "deposit" && data) {
          setAmount((data.deposit_amount || data.rent_amount).toString());
        } else if (data.rent_amount) {
          setAmount(data.rent_amount.toString());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentTypeChange = (type: "rent" | "deposit" | "custom") => {
    setPaymentType(type);
    if (type === "rent" && tenant?.rent_amount) {
      setAmount(tenant.rent_amount.toString());
    } else if (type === "deposit" && tenant) {
      setAmount((tenant.deposit_amount || tenant.rent_amount).toString());
    } else if (type === "custom") {
      setAmount("");
    }
  };

  const handlePay = async () => {
    setError(null);
    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount < 100) {
      setError("Minimum payment amount is R100");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/renter/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payAmount,
          payment_type: paymentType,
          description: paymentType === "rent" 
            ? "Rent Payment (Advance)" 
            : paymentType === "deposit" 
            ? "Security Deposit"
            : "Custom Payment"
        }),
      });

      const data = await res.json();
      if (data.redirectUrl) {
        // Redirect to Ozow payment
        window.location.href = data.redirectUrl;
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to initiate payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-6 md:p-8 pb-24 md:pb-8">
        <div className="max-w-xl mx-auto text-center py-20">
          <div className="text-6xl mb-4">💳</div>
          <h1 className="text-2xl font-bold mb-2">No Active Rental</h1>
          <p className="text-gray-500 mb-6">You need an active rental to make payments.</p>
          <Link href="/renter" className="text-primary hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <Link href="/renter/payments" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          ← Back to Payments
        </Link>

        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💳</span>
            </div>
            <h1 className="text-2xl font-bold">Make a Payment</h1>
            <p className="text-gray-500">{tenant.property_title}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Payment Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Payment Type</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handlePaymentTypeChange("rent")}
                className={`p-4 rounded-xl border-2 text-center transition ${
                  paymentType === "rent"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl block mb-1">🏠</span>
                <span className="text-sm font-medium">Rent</span>
              </button>
              <button
                onClick={() => handlePaymentTypeChange("deposit")}
                className={`p-4 rounded-xl border-2 text-center transition ${
                  paymentType === "deposit"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl block mb-1">🔒</span>
                <span className="text-sm font-medium">Deposit</span>
              </button>
              <button
                onClick={() => handlePaymentTypeChange("custom")}
                className={`p-4 rounded-xl border-2 text-center transition ${
                  paymentType === "custom"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl block mb-1">✏️</span>
                <span className="text-sm font-medium">Custom</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-medium">R</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="100"
                step="0.01"
                className="w-full pl-10 pr-4 py-4 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none"
                disabled={paymentType !== "custom"}
              />
            </div>
            {paymentType !== "custom" && (
              <p className="text-xs text-gray-500 mt-2">
                Amount is fixed for {paymentType} payments. Select "Custom" to enter a different amount.
              </p>
            )}
          </div>

          {/* Quick Amounts (for custom) */}
          {paymentType === "custom" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Select</label>
              <div className="flex flex-wrap gap-2">
                {[500, 1000, 2000, 5000, tenant?.rent_amount].filter(Boolean).map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Payment Amount</span>
              <span className="font-medium">{amount ? formatCurrency(parseFloat(amount)) : "R0"}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Payment Type</span>
              <span className="font-medium capitalize">{paymentType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Property</span>
              <span className="font-medium text-right truncate max-w-[60%]">{tenant.property_title}</span>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePay}
            disabled={processing || !amount || parseFloat(amount) < 100}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <span>Pay with Ozow</span>
                <span className="text-xl">→</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            Secure payment powered by Ozow. EFT, Instant EFT & Card accepted.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function PaySpecificPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const paymentId = params.id;
  
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayment();
  }, [paymentId]);

  const fetchPayment = async () => {
    try {
      const res = await fetch(`/api/renter/payments/${paymentId}`);
      if (res.ok) {
        const data = await res.json();
        setPayment(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/renter/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payment.amount,
          payment_type: "rent",
          payment_id: paymentId,
          description: `Rent Payment - ${new Date(payment.due_date).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}`
        }),
      });

      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to initiate payment");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="p-6 md:p-8 pb-24 md:pb-8">
        <div className="max-w-xl mx-auto text-center py-20">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-2xl font-bold mb-2">Payment Not Found</h1>
          <p className="text-gray-500 mb-6">This payment doesn't exist or has already been processed.</p>
          <Link href="/renter/payments" className="text-primary hover:underline">← Back to Payments</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto">
        <Link href="/renter/payments" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          ← Back to Payments
        </Link>

        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6 md:p-8">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              payment.status === 'overdue' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <span className="text-3xl">{payment.status === 'overdue' ? '⚠️' : '📅'}</span>
            </div>
            <h1 className="text-2xl font-bold">
              {payment.status === 'overdue' ? 'Overdue Payment' : 'Pay Rent'}
            </h1>
            <p className="text-gray-500">
              Due: {new Date(payment.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Amount Display */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
            <p className="text-sm text-gray-500 mb-1">Amount Due</p>
            <p className="text-4xl font-bold text-primary">{formatCurrency(payment.amount)}</p>
            {payment.status === 'overdue' && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                ⚠️ This payment is overdue
              </p>
            )}
          </div>

          {/* Payment Details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Type</span>
              <span className="font-medium">Rent</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Due Date</span>
              <span className="font-medium">
                {new Date(payment.due_date).toLocaleDateString('en-ZA')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium ${
                payment.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </span>
            </div>
            {payment.payment_reference && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Reference</span>
                <span className="font-mono text-xs">{payment.payment_reference}</span>
              </div>
            )}
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <span>Pay {formatCurrency(payment.amount)}</span>
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

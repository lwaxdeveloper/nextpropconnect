import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-gray-400" />
        </div>

        <h1 className="text-2xl font-bold text-dark mb-2">Payment Cancelled</h1>
        <p className="text-gray-500 mb-6">
          Your payment was cancelled. No charges have been made.
        </p>

        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition"
          >
            View Plans
          </Link>
          <Link
            href="/"
            className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function PaymentErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-dark mb-2">Payment Failed</h1>
        <p className="text-gray-500 mb-6">
          Something went wrong with your payment. Please try again or contact support.
        </p>

        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition"
          >
            Try Again
          </Link>
          <a
            href="mailto:support@nextpropconnect.co.za"
            className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

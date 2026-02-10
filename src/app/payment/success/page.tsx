import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; demo?: string }>;
}) {
  const params = await searchParams;
  const isDemo = params.demo === "true";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-dark mb-2">Payment Successful!</h1>
        <p className="text-gray-500 mb-6">
          {isDemo
            ? "Demo payment processed successfully."
            : "Thank you for your payment. Your account has been upgraded."}
        </p>

        {params.ref && (
          <p className="text-xs text-gray-400 mb-6">
            Reference: {params.ref}
          </p>
        )}

        <div className="space-y-3">
          <Link
            href="/agent"
            className="block w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/properties"
            className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            View Listings
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export default async function PaymentErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; message?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-lg mx-auto text-center">
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-lg p-8 md:p-12">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✗</span>
          </div>
          
          <h1 className="text-2xl font-bold text-red-800 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            {params.message || "Something went wrong with your payment. Please try again or contact support."}
          </p>

          {params.ref && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500">Reference Number</p>
              <p className="font-mono font-bold text-lg">{params.ref}</p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/renter/payments/advance"
              className="block w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition"
            >
              Try Again
            </Link>
            <Link
              href="/renter/payments"
              className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              View Payment History
            </Link>
            <a
              href="mailto:support@nextpropconnect.co.za"
              className="block text-primary text-sm hover:underline"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

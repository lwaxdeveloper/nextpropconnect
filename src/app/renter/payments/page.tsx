import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RenterPaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string };
  const userId = parseInt(user.id || "0");

  // Get tenant info
  const tenantResult = await query(
    `SELECT t.id, t.rent_amount, t.rent_due_day, t.deposit_amount, t.deposit_paid, p.title as property_title
     FROM tenants t
     JOIN properties p ON t.property_id = p.id
     WHERE t.user_id = $1 AND t.status = 'active'
     LIMIT 1`,
    [userId]
  );
  const tenant = tenantResult.rows[0];

  if (!tenant) {
    return (
      <div className="p-6 md:p-8 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="text-6xl mb-4">💳</div>
          <h1 className="text-2xl font-bold mb-2">No Active Rental</h1>
          <p className="text-gray-500 mb-6">You need an active rental to view payments.</p>
          <Link href="/renter" className="text-primary hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Get all payments
  const paymentsResult = await query(
    `SELECT * FROM rent_payments 
     WHERE tenant_id = $1 
     ORDER BY due_date DESC`,
    [tenant.id]
  );
  const payments = paymentsResult.rows;

  const pendingPayments = payments.filter((p: any) => p.status === 'pending');
  const paidPayments = payments.filter((p: any) => p.status === 'paid');
  const overduePayments = payments.filter((p: any) => p.status === 'overdue');

  // Calculate next month's payment date
  const today = new Date();
  const nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, tenant.rent_due_day);

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">💳 Payments</h1>
            <p className="text-gray-500 text-sm">{tenant.property_title}</p>
          </div>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 text-right">
            <p className="text-sm text-gray-500">Monthly Rent</p>
            <p className="text-2xl font-bold text-primary">{formatPrice(tenant.rent_amount)}</p>
            <p className="text-xs text-gray-400">Due on the {tenant.rent_due_day}{getOrdinal(tenant.rent_due_day)}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Pay Now / Pay in Advance */}
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white">
            <h3 className="font-bold text-lg mb-2">
              {pendingPayments.length > 0 ? '⚠️ Payment Due' : '✨ Pay in Advance'}
            </h3>
            <p className="text-white/80 text-sm mb-4">
              {pendingPayments.length > 0 
                ? `You have ${pendingPayments.length} pending payment${pendingPayments.length > 1 ? 's' : ''}`
                : 'Get ahead of your rent by paying early'}
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{formatPrice(tenant.rent_amount)}</p>
                <p className="text-white/60 text-sm">
                  {pendingPayments.length > 0 
                    ? `Due: ${new Date(pendingPayments[0].due_date).toLocaleDateString('en-ZA')}`
                    : `Next: ${nextDueDate.toLocaleDateString('en-ZA')}`}
                </p>
              </div>
              <Link
                href={pendingPayments.length > 0 ? `/renter/payments/${pendingPayments[0].id}/pay` : '/renter/payments/advance'}
                className="px-6 py-3 bg-white text-primary rounded-xl font-bold hover:bg-white/90 transition"
              >
                Pay Now
              </Link>
            </div>
          </div>

          {/* Deposit Status */}
          <div className={`rounded-2xl p-6 ${tenant.deposit_paid ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'}`}>
            <h3 className={`font-bold text-lg mb-2 ${tenant.deposit_paid ? 'text-green-800' : 'text-yellow-800'}`}>
              {tenant.deposit_paid ? '✓ Deposit Paid' : '⚠️ Deposit Outstanding'}
            </h3>
            <p className={`text-sm mb-4 ${tenant.deposit_paid ? 'text-green-700' : 'text-yellow-700'}`}>
              {tenant.deposit_paid 
                ? 'Your security deposit has been paid'
                : 'Security deposit is required'}
            </p>
            <div className="flex items-center justify-between">
              <p className={`text-2xl font-bold ${tenant.deposit_paid ? 'text-green-800' : 'text-yellow-800'}`}>
                {formatPrice(tenant.deposit_amount || tenant.rent_amount)}
              </p>
              {!tenant.deposit_paid && (
                <Link 
                  href="/renter/payments/advance?type=deposit"
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition"
                >
                  Pay Deposit
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border-2 border-yellow-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
              <span className="text-sm text-gray-600">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
          </div>
          <div className="bg-white rounded-xl border-2 border-red-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 bg-red-400 rounded-full"></span>
              <span className="text-sm text-gray-600">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{overduePayments.length}</p>
          </div>
          <div className="bg-white rounded-xl border-2 border-green-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              <span className="text-sm text-gray-600">Paid</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{paidPayments.length}</p>
          </div>
        </div>

        {/* Pending Payments */}
        {pendingPayments.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-yellow-200 shadow-md p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">⏳</span>
              Pending Payments
            </h2>
            <div className="space-y-3">
              {pendingPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                  <div>
                    <p className="font-bold text-lg">{formatPrice(payment.amount)}</p>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(payment.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <Link
                    href={`/renter/payments/${payment.id}/pay`}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
                  >
                    Pay Now
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">📋</span>
            Payment History
          </h2>
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment: any) => (
                    <tr key={payment.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-4">
                        {new Date(payment.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 font-medium">{formatPrice(payment.amount)}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-500">
                        {payment.payment_reference || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-400">No payment records yet</p>
              <p className="text-sm text-gray-400 mt-1">Your payment history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

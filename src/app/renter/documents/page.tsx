import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";
import DocumentsClient from "./DocumentsClient";

export const dynamic = "force-dynamic";

export default async function RenterDocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string };
  const userId = parseInt(user.id || "0");

  let tenant: any = null;
  let documents: any[] = [];

  try {
    // Get tenant info
    const tenantResult = await query(
      `SELECT t.id, t.lease_document_url, p.title as property_title
       FROM tenants t
       JOIN properties p ON t.property_id = p.id
       WHERE t.user_id = $1 AND t.status = 'active'
       LIMIT 1`,
      [userId]
    );
    tenant = tenantResult.rows[0] || null;

    if (tenant) {
      // Get uploaded documents
      const docsResult = await query(
        `SELECT * FROM tenant_documents WHERE tenant_id = $1`,
        [tenant.id]
      );
      documents = docsResult.rows;
    }
  } catch (err) {
    console.error("Documents page error:", err);
  }

  if (!tenant) {
    return (
      <div className="p-6 md:p-8 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-8 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-xl font-bold mb-2">No Active Rental</h2>
            <p className="text-gray-500 mb-6">You need an active rental to manage documents.</p>
            <Link href="/renter" className="text-primary hover:underline">← Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DocumentsClient 
      tenant={tenant} 
      initialDocuments={documents} 
    />
  );
}

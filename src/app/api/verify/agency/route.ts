import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id?: string }).id || "0");

  try {
    const data = await request.json();
    const {
      companyName,
      tradingName,
      registrationNumber,
      vatNumber,
      physicalAddress,
      city,
      province,
      postalCode,
      directorName,
      directorIdNumber,
      directorEmail,
      directorPhone,
      eaabNumber,
      fidelityFundNumber,
      beeLevel,
      cipcDocument,
      eaabCertificate,
      beeCertificate,
      bankLetter,
      directorId,
    } = data;

    // Validate required fields
    if (!companyName || !registrationNumber || !directorName || !directorIdNumber || !cipcDocument) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user has an agency
    const existingAgency = await query(
      `SELECT id, kyc_status FROM agencies WHERE owner_id = $1 OR admin_user_id = $1`,
      [userId]
    );

    let agencyId: number;

    if (existingAgency.rows.length > 0) {
      // Update existing agency
      agencyId = existingAgency.rows[0].id;
      
      if (existingAgency.rows[0].kyc_status === 'approved') {
        return NextResponse.json(
          { error: "Agency already verified" },
          { status: 400 }
        );
      }

      await query(
        `UPDATE agencies SET
           name = $1,
           registration_number = $2,
           vat_number = $3,
           address = $4,
           city = $5,
           province = $6,
           director_name = $7,
           director_id_number = $8,
           email = $9,
           phone = $10,
           eaab_number = $11,
           fidelity_fund_number = $12,
           bee_level = $13,
           kyc_status = 'pending',
           kyc_submitted_at = NOW(),
           kyc_documents = $14
         WHERE id = $15`,
        [
          companyName,
          registrationNumber,
          vatNumber || null,
          physicalAddress,
          city,
          province,
          directorName,
          directorIdNumber,
          directorEmail || null,
          directorPhone || null,
          eaabNumber,
          fidelityFundNumber || null,
          beeLevel || null,
          JSON.stringify({ cipcDocument, eaabCertificate, beeCertificate, bankLetter, directorId }),
          agencyId,
        ]
      );
    } else {
      // Create new agency
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const result = await query(
        `INSERT INTO agencies (
           name, slug, registration_number, vat_number, address, city, province,
           director_name, director_id_number, email, phone,
           eaab_number, fidelity_fund_number, bee_level,
           owner_id, admin_user_id, kyc_status, kyc_submitted_at, kyc_documents
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15, 'pending', NOW(), $16)
         RETURNING id`,
        [
          companyName,
          slug + '-' + Date.now().toString(36),
          registrationNumber,
          vatNumber || null,
          physicalAddress,
          city,
          province,
          directorName,
          directorIdNumber,
          directorEmail || null,
          directorPhone || null,
          eaabNumber,
          fidelityFundNumber || null,
          beeLevel || null,
          userId,
          JSON.stringify({ cipcDocument, eaabCertificate, beeCertificate, bankLetter, directorId }),
        ]
      );

      agencyId = result.rows[0].id;

      // Add user as agency owner member
      await query(
        `INSERT INTO agency_members (agency_id, user_id, role, status)
         VALUES ($1, $2, 'owner', 'active')
         ON CONFLICT DO NOTHING`,
        [agencyId, userId]
      );
    }

    // Create verification record
    const documents = [
      cipcDocument && { type: 'cipc', url: cipcDocument },
      directorId && { type: 'director_id', url: directorId },
      eaabCertificate && { type: 'eaab_certificate', url: eaabCertificate },
      beeCertificate && { type: 'bee_certificate', url: beeCertificate },
      bankLetter && { type: 'bank_letter', url: bankLetter },
    ].filter(Boolean);

    const metadata = {
      companyName,
      tradingName,
      registrationNumber,
      vatNumber,
      city,
      province,
      directorName,
      eaabNumber,
      fidelityFundNumber,
      beeLevel,
      agencyId,
    };

    await query(
      `INSERT INTO verifications (user_id, type, status, documents, metadata)
       VALUES ($1, 'agency', 'pending', $2, $3)`,
      [userId, JSON.stringify(documents), JSON.stringify(metadata)]
    );

    return NextResponse.json({
      success: true,
      agencyId,
      message: "Agency verification submitted successfully. We'll review your documents within 2-5 business days.",
    });
  } catch (error) {
    console.error("Agency verification error:", error);
    return NextResponse.json(
      { error: "Failed to submit verification" },
      { status: 500 }
    );
  }
}

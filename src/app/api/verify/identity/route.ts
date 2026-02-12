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
      fullName,
      idNumber,
      dateOfBirth,
      nationality,
      phone,
      eaabNumber,
      ffcNumber,
      idFront,
      idBack,
      selfie,
      proofOfAddress,
      eaabCertificate,
    } = data;

    // Validate required fields
    if (!fullName || !idNumber || !idFront || !selfie) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate SA ID number (basic check)
    if (!/^\d{13}$/.test(idNumber)) {
      return NextResponse.json(
        { error: "Invalid SA ID number format" },
        { status: 400 }
      );
    }

    // Check if user already has a pending or approved verification
    const existing = await query(
      `SELECT id, status FROM verifications 
       WHERE user_id = $1 AND type = 'identity' 
       ORDER BY submitted_at DESC LIMIT 1`,
      [userId]
    );

    if (existing.rows.length > 0) {
      const status = existing.rows[0].status;
      if (status === 'approved') {
        return NextResponse.json(
          { error: "Identity already verified" },
          { status: 400 }
        );
      }
      if (status === 'pending') {
        return NextResponse.json(
          { error: "Verification already pending review" },
          { status: 400 }
        );
      }
    }

    // Update user with KYC data
    await query(
      `UPDATE users SET 
         name = $1,
         id_number = $2,
         date_of_birth = $3,
         nationality = $4,
         phone = COALESCE($5, phone),
         kyc_status = 'pending',
         kyc_submitted_at = NOW()
       WHERE id = $6`,
      [fullName, idNumber, dateOfBirth || null, nationality, phone || null, userId]
    );

    // Update agent profile with EAAB/FFC numbers if provided
    if (eaabNumber || ffcNumber) {
      await query(
        `INSERT INTO agent_profiles (user_id, eaab_number, ffc_number)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET
           eaab_number = COALESCE($2, agent_profiles.eaab_number),
           ffc_number = COALESCE($3, agent_profiles.ffc_number)`,
        [userId, eaabNumber || null, ffcNumber || null]
      );
    }

    // Create verification record
    const documents = [
      { type: 'id_front', url: idFront },
      idBack && { type: 'id_back', url: idBack },
      { type: 'selfie', url: selfie },
      proofOfAddress && { type: 'proof_of_address', url: proofOfAddress },
      eaabCertificate && { type: 'eaab_certificate', url: eaabCertificate },
    ].filter(Boolean);

    const metadata = {
      fullName,
      idNumber: idNumber.slice(0, 6) + '******' + idNumber.slice(-2), // Masked
      dateOfBirth,
      nationality,
      phone,
      eaabNumber,
      ffcNumber,
    };

    await query(
      `INSERT INTO verifications (user_id, type, status, documents, metadata)
       VALUES ($1, 'identity', 'pending', $2, $3)`,
      [userId, JSON.stringify(documents), JSON.stringify(metadata)]
    );

    // TODO: In production, trigger SmileID or similar KYC provider here
    // For now, we're doing manual review

    return NextResponse.json({
      success: true,
      message: "Verification submitted successfully. We'll review your documents within 24-48 hours.",
    });
  } catch (error) {
    console.error("Identity verification error:", error);
    return NextResponse.json(
      { error: "Failed to submit verification" },
      { status: 500 }
    );
  }
}

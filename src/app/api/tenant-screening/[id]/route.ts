import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/tenant-screening/[id] - Get screening details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  const result = await query(
    `SELECT ts.*, 
      tenant.name as tenant_name,
      tenant.email as tenant_email,
      tenant.phone as tenant_phone,
      tenant.avatar_url as tenant_avatar,
      tenant.identity_verified as tenant_identity_verified,
      landlord.name as landlord_name,
      p.title as property_title,
      p.address as property_address,
      p.price as property_price
     FROM tenant_screenings ts
     JOIN users tenant ON ts.tenant_id = tenant.id
     JOIN users landlord ON ts.requested_by = landlord.id
     LEFT JOIN properties p ON ts.property_id = p.id
     WHERE ts.id = $1 AND (ts.tenant_id = $2 OR ts.requested_by = $2)`,
    [parseInt(id), userId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Screening not found' }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

// PATCH /api/tenant-screening/[id] - Tenant submits their info
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const body = await request.json();

  // Verify user is the tenant OR landlord
  const screeningResult = await query(
    'SELECT * FROM tenant_screenings WHERE id = $1',
    [parseInt(id)]
  );

  if (screeningResult.rows.length === 0) {
    return NextResponse.json({ error: 'Screening not found' }, { status: 404 });
  }

  const screening = screeningResult.rows[0];
  const isTenant = screening.tenant_id === userId;
  const isLandlord = screening.requested_by === userId;

  if (!isTenant && !isLandlord) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Tenant submitting their info
  if (isTenant) {
    const {
      employerName,
      jobTitle,
      monthlyIncome,
      employmentDocs,
      previousLandlordName,
      previousLandlordPhone,
      previousAddress,
    } = body;

    // Calculate affordability if we have income and property price
    let affordabilityRatio = null;
    let affordabilityPassed = null;
    
    if (monthlyIncome && screening.notes) {
      const rentMatch = screening.notes.match(/Monthly rent: R(\d+)/);
      if (rentMatch) {
        const rent = parseFloat(rentMatch[1]);
        affordabilityRatio = (rent / monthlyIncome) * 100;
        affordabilityPassed = affordabilityRatio <= 30; // Standard 30% rule
      }
    }

    await query(
      `UPDATE tenant_screenings SET
        employer_name = COALESCE($1, employer_name),
        job_title = COALESCE($2, job_title),
        monthly_income = COALESCE($3, monthly_income),
        employment_docs = COALESCE($4, employment_docs),
        previous_landlord_name = COALESCE($5, previous_landlord_name),
        previous_landlord_phone = COALESCE($6, previous_landlord_phone),
        previous_address = COALESCE($7, previous_address),
        affordability_ratio = COALESCE($8, affordability_ratio),
        affordability_passed = COALESCE($9, affordability_passed),
        status = 'submitted'
       WHERE id = $10`,
      [
        employerName, jobTitle, monthlyIncome,
        employmentDocs ? JSON.stringify(employmentDocs) : null,
        previousLandlordName, previousLandlordPhone, previousAddress,
        affordabilityRatio, affordabilityPassed,
        parseInt(id)
      ]
    );
  }

  // Landlord updating verification/recommendation
  if (isLandlord) {
    const {
      employmentVerified,
      rentalHistoryVerified,
      rentalReference,
      screeningScore,
      recommendation,
      notes,
    } = body;

    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramCount = 0;

    if (employmentVerified !== undefined) {
      updates.push(`employment_verified = $${++paramCount}`);
      values.push(employmentVerified);
    }
    if (rentalHistoryVerified !== undefined) {
      updates.push(`rental_history_verified = $${++paramCount}`);
      values.push(rentalHistoryVerified);
    }
    if (rentalReference) {
      updates.push(`rental_reference = $${++paramCount}`);
      values.push(rentalReference);
    }
    if (screeningScore !== undefined) {
      updates.push(`screening_score = $${++paramCount}`);
      values.push(screeningScore);
    }
    if (recommendation) {
      updates.push(`recommendation = $${++paramCount}`);
      values.push(recommendation);
    }
    if (notes) {
      updates.push(`notes = $${++paramCount}`);
      values.push(notes);
    }

    if (recommendation) {
      updates.push(`status = 'completed'`);
      updates.push(`completed_at = NOW()`);
    }

    if (updates.length > 0) {
      values.push(parseInt(id));
      await query(
        `UPDATE tenant_screenings SET ${updates.join(', ')} WHERE id = $${paramCount + 1}`,
        values
      );
    }
  }

  return NextResponse.json({ success: true });
}

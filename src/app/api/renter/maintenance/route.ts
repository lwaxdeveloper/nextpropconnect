import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get tenant
    const tenantResult = await query(
      `SELECT id, property_id, landlord_id FROM tenants WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );
    
    if (tenantResult.rows.length === 0) {
      return NextResponse.json({ error: 'No active tenancy found' }, { status: 400 });
    }

    const tenant = tenantResult.rows[0];
    const body = await request.json();
    const { category, title, description, priority, preferred_time } = body;

    if (!category || !title || !description) {
      return NextResponse.json({ error: 'Category, title, and description are required' }, { status: 400 });
    }

    // Create maintenance request
    const result = await query(
      `INSERT INTO maintenance_requests 
       (tenant_id, property_id, category, title, description, priority, preferred_access_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [tenant.id, tenant.property_id, category, title, description, priority || 'normal', preferred_time || null]
    );

    // TODO: Notify landlord via email/notification

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Maintenance request error:', error);
    return NextResponse.json({ error: 'Failed to submit maintenance request' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find active tenancy for this user
  const tenantResult = await query(
    `SELECT t.*, 
            p.title as property_title, 
            p.address as property_address,
            u.name as landlord_name,
            u.email as landlord_email
     FROM tenants t
     JOIN properties p ON t.property_id = p.id
     JOIN users u ON t.landlord_id = u.id
     WHERE t.user_id = $1 AND t.status = 'active'
     LIMIT 1`,
    [parseInt(session.user.id)]
  );

  if (tenantResult.rows.length === 0) {
    return NextResponse.json({ error: 'No active tenancy found' }, { status: 404 });
  }

  const tenant = tenantResult.rows[0];

  // Get next/current payment
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  
  const paymentResult = await query(
    `SELECT * FROM rent_payments 
     WHERE tenant_id = $1 AND TO_CHAR(due_date, 'YYYY-MM') = $2
     ORDER BY due_date DESC LIMIT 1`,
    [tenant.id, currentMonth]
  );

  let nextPayment = null;
  if (paymentResult.rows.length > 0) {
    const p = paymentResult.rows[0];
    nextPayment = {
      amount: p.amount,
      due_date: p.due_date,
      status: p.status,
    };
  } else {
    // Create a virtual next payment
    const dueDate = new Date(today.getFullYear(), today.getMonth(), tenant.rent_due_day);
    if (dueDate < today) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }
    nextPayment = {
      amount: tenant.rent_amount,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending',
    };
  }

  // Get recent payments
  const recentPayments = await query(
    `SELECT id, amount, due_date, paid_date, status 
     FROM rent_payments 
     WHERE tenant_id = $1 
     ORDER BY due_date DESC LIMIT 6`,
    [tenant.id]
  );

  // Get maintenance requests
  const maintenanceRequests = await query(
    `SELECT id, title, status, created_at 
     FROM maintenance_requests 
     WHERE tenant_id = $1 
     ORDER BY created_at DESC LIMIT 5`,
    [tenant.id]
  );

  return NextResponse.json({
    tenant: {
      id: tenant.id,
      property_title: tenant.property_title,
      property_address: tenant.property_address,
      rent_amount: tenant.rent_amount,
      rent_due_day: tenant.rent_due_day,
      lease_start: tenant.lease_start,
      lease_end: tenant.lease_end,
      landlord_name: tenant.landlord_name,
      landlord_email: tenant.landlord_email,
    },
    nextPayment,
    recentPayments: recentPayments.rows,
    maintenanceRequests: maintenanceRequests.rows,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Save a property
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please log in to save properties' }, { status: 401 });
    }

    const { id } = await params;
    const propertyId = parseInt(id);
    const userId = parseInt(session.user.id);

    // Check if property exists
    const propertyResult = await query(
      'SELECT id FROM properties WHERE id = $1',
      [propertyId]
    );

    if (propertyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check if already saved
    const existingResult = await query(
      'SELECT id FROM saved_properties WHERE user_id = $1 AND property_id = $2',
      [userId, propertyId]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json({ message: 'Already saved' }, { status: 200 });
    }

    // Save the property
    await query(
      'INSERT INTO saved_properties (user_id, property_id) VALUES ($1, $2)',
      [userId, propertyId]
    );

    return NextResponse.json({ message: 'Property saved' }, { status: 201 });
  } catch (error) {
    console.error('Save property error:', error);
    return NextResponse.json({ error: 'Failed to save property' }, { status: 500 });
  }
}

// Unsave a property
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const propertyId = parseInt(id);
    const userId = parseInt(session.user.id);

    await query(
      'DELETE FROM saved_properties WHERE user_id = $1 AND property_id = $2',
      [userId, propertyId]
    );

    return NextResponse.json({ message: 'Property unsaved' }, { status: 200 });
  } catch (error) {
    console.error('Unsave property error:', error);
    return NextResponse.json({ error: 'Failed to unsave property' }, { status: 500 });
  }
}

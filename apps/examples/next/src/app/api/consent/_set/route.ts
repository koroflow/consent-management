import { NextResponse } from 'next/server';
import { setConsentPreferences } from '~/app/actions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { preferences } = body;
    
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      );
    }
    
    const result = await setConsentPreferences(preferences);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error setting consent preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update consent preferences' },
      { status: 500 }
    );
  }
} 
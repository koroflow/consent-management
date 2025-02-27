import { NextResponse } from 'next/server';
import { getConsentStatus } from '~/app/actions';

/**
 * GET handler for the consent status endpoint
 * This now uses the new API structure with better-call
 */
export async function GET() {
	try {
		const consentStatus = await getConsentStatus();
		return NextResponse.json(consentStatus);
	} catch (error) {
		console.error('Error getting consent status:', error);
		return NextResponse.json(
			{ error: 'Failed to get consent status' },
			{ status: 500 }
		);
	}
}

import { NextResponse } from 'next/server';

/**
 * POST /api/auth/clear-tokens
 *
 * Clears HTTP-only cookies for access and refresh tokens.
 * This endpoint is called when logging out or when tokens expire.
 */
export async function POST() {
	const response = NextResponse.json({ success: true });

	// Clear both tokens by setting them to empty with immediate expiry
	response.cookies.set('accessToken', '', {
		httpOnly: true,
		secure: false, // Set to true in production with HTTPS
		sameSite: 'lax',
		path: '/',
		maxAge: 0,
	});

	response.cookies.set('refreshToken', '', {
		httpOnly: true,
		secure: false, // Set to true in production with HTTPS
		sameSite: 'lax',
		path: '/',
		maxAge: 0,
	});

	return response;
}

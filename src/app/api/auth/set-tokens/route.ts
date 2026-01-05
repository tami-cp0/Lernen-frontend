import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/set-tokens
 *
 * Sets HTTP-only cookies for access and refresh tokens.
 * This endpoint is called from the client after successful authentication.
 */
export async function POST(request: NextRequest) {
	try {
		const { accessToken, refreshToken } = await request.json();

		if (!accessToken || !refreshToken) {
			return NextResponse.json(
				{ error: 'Access token and refresh token are required' },
				{ status: 400 }
			);
		}

		const response = NextResponse.json({ success: true });

		// Set HTTP-only cookies
		// Note: In development (HTTP), secure flag is false. In production (HTTPS), it should be true.
		response.cookies.set('accessToken', accessToken, {
			httpOnly: true,
			secure: false, // Set to true in production with HTTPS
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24 * 7, // temporary
		});

		response.cookies.set('refreshToken', refreshToken, {
			httpOnly: true,
			secure: false, // Set to true in production with HTTPS
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24 * 7, // 7 days
		});

		return response;
	} catch (error) {
		console.error('Error setting tokens:', error);
		return NextResponse.json(
			{ error: 'Failed to set tokens' },
			{ status: 500 }
		);
	}
}

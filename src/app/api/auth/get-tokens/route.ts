import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/get-tokens
 *
 * Retrieves access and refresh tokens from HTTP-only cookies.
 * This is needed for server-side operations or when the client needs to know if tokens exist.
 */
export async function GET() {
	const cookieStore = await cookies();
	const accessToken = cookieStore.get('accessToken')?.value;
	const refreshToken = cookieStore.get('refreshToken')?.value;

	return NextResponse.json({
		accessToken: accessToken || null,
		refreshToken: refreshToken || null,
		hasTokens: !!(accessToken && refreshToken),
	});
}

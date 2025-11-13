/**
 * API Client with HTTP-only Cookie Token Management
 *
 * Simple wrapper that:
 * - Stores tokens in HTTP-only cookies
 * - Automatically refreshes expired tokens
 * - Redirects to auth page on refresh failure
 */

import { clientEnv } from '../../env.client';

const API_BASE_URL = clientEnv.apiUrl;

/**
 * Set authentication tokens in HTTP-only cookies
 */
export async function setAuthTokens(
	accessToken: string,
	refreshToken: string
): Promise<void> {
	await fetch('/api/auth/set-tokens', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ accessToken, refreshToken }),
	});
}

/**
 * Clear authentication tokens
 */
export async function clearAuthTokens(): Promise<void> {
	await fetch('/api/auth/clear-tokens', { method: 'POST' });
}

/**
 * Refresh access token using refresh token
 */
async function refreshToken(provider: string = 'email'): Promise<boolean> {
	try {
		const res = await fetch('/api/auth/get-tokens');
		const { refreshToken } = await res.json();

		if (!refreshToken) return false;

		const response = await fetch(
			`${API_BASE_URL}/api/v1/auth/refresh?provider=${provider}`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${refreshToken}`,
					'Content-Type': 'application/json',
				},
			}
		);

		if (!response.ok) return false;

		const data = await response.json();
		await setAuthTokens(data.data.accessToken, data.data.refreshToken);
		return true;
	} catch {
		return false;
	}
}

/**
 * Make an API request with automatic token handling
 *
 * @param route - API endpoint (e.g., 'users/profile')
 * @param method - HTTP method
 * @param body - Request body
 * @param provider - Auth provider for token refresh
 */
export async function apiRequest<T = unknown>(
	route: string,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
	body?: unknown,
	provider: string = 'email'
): Promise<T> {
	const makeRequest = async (token?: string) => {
		const headers: HeadersInit = { 'Content-Type': 'application/json' };
		if (token) headers['Authorization'] = `Bearer ${token}`;

		return fetch(`${API_BASE_URL}/api/v1/${route}`, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});
	};

	// Get current access token
	const tokensRes = await fetch('/api/auth/get-tokens');
	const { accessToken } = await tokensRes.json();

	let response = await makeRequest(accessToken);

	// If 401, try to refresh token
	if (response.status === 401) {
		const refreshed = await refreshToken(provider);

		if (!refreshed) {
			// Refresh failed - clear tokens and redirect
			await clearAuthTokens();
			if (typeof window !== 'undefined') {
				window.location.href = '/sign-in';
			}
			throw new Error('Authentication failed');
		}

		// Retry with new token
		const newTokensRes = await fetch('/api/auth/get-tokens');
		const { accessToken: newAccessToken } = await newTokensRes.json();
		response = await makeRequest(newAccessToken);
	}

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.message || `Request failed with status ${response.status}`
		);
	}

	return response.json();
}

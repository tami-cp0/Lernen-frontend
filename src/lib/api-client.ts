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

// Token cache to reduce redundant cookie reads
let tokenCache: { accessToken: string | null; timestamp: number } | null = null;
const TOKEN_CACHE_TTL = 5000; // 5 seconds cache

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
	// Clear token cache
	tokenCache = null;
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
		// Update token cache with new token
		tokenCache = { accessToken: data.data.accessToken, timestamp: Date.now() };
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
		const headers: HeadersInit = {};

		// Only set Content-Type for non-FormData bodies
		if (!(body instanceof FormData)) {
			headers['Content-Type'] = 'application/json';
		}

		if (token) headers['Authorization'] = `Bearer ${token}`;

		return fetch(`${API_BASE_URL}/api/v1/${route}`, {
			method,
			headers,
			body:
				body instanceof FormData
					? body
					: body
					? JSON.stringify(body)
					: undefined,
		});
	};

	// Get current access token (with caching to reduce redundant calls)
	let accessToken: string | undefined;
	
	// Check cache first
	if (tokenCache && Date.now() - tokenCache.timestamp < TOKEN_CACHE_TTL) {
		accessToken = tokenCache.accessToken || undefined;
	} else {
		// Cache miss or expired, fetch fresh token
		const tokensRes = await fetch('/api/auth/get-tokens');
		const tokenData = await tokensRes.json();
		accessToken = tokenData.accessToken || undefined;
		// Update cache
		tokenCache = { accessToken: tokenData.accessToken, timestamp: Date.now() };
	}

	let response = await makeRequest(accessToken);

	// If 401, try to refresh token
	if (response.status === 401) {
		const refreshed = await refreshToken(provider);

		if (!refreshed) {
			// Refresh failed - clear tokens and redirect immediately
			await clearAuthTokens();
			if (typeof window !== 'undefined') {
				window.location.replace('/sign-in');
			}
			// Prevent further execution
			return new Promise(() => {}) as Promise<T>;
		}

		// Retry with new token
		const newTokensRes = await fetch('/api/auth/get-tokens');
		const { accessToken: newAccessToken } = await newTokensRes.json();
		// Update cache with fresh token
		tokenCache = { accessToken: newAccessToken, timestamp: Date.now() };
		response = await makeRequest(newAccessToken);
	}

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		const error = new Error(
			errorData.message || `Request failed with status ${response.status}`
		) as Error & { response?: { status: number; data: unknown } };
		error.response = { status: response.status, data: errorData };

		// Silently throw 409 errors for chat routes (chat already exists)
		if (response.status === 409 && route.startsWith('chats')) {
			throw error;
		}

		// Log other errors
		console.error(`API Error [${method} ${route}]:`, error.message);
		throw error;
	}

	// Handle 204 No Content responses (no body to parse)
	if (response.status === 204) {
		return {} as T;
	}

	// Check if response has content before parsing JSON
	const contentType = response.headers.get('content-type');
	if (contentType && contentType.includes('application/json')) {
		return response.json();
	}

	// If no JSON content, return empty object
	return {} as T;
}

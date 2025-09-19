// This file is used to define environment variables that are safe to expose to the client-side code.
export const clientEnv = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  googleRedirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
};
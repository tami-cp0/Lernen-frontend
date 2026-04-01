import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Sign in | Lernen',
	description: 'Sign in to Lernen using a magic link or Google.',
	openGraph: {
		title: 'Sign in | Lernen',
		description: 'Sign in to Lernen using a magic link or Google.',
		images: ['/Abstract-Ripple-Effect.png'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Sign in | Lernen',
		description: 'Sign in to Lernen using a magic link or Google.',
		images: ['/Abstract-Ripple-Effect.png'],
	},
};

export default function SignInLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return children;
}

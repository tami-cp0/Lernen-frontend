import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Lernen',
	description: 'The intelligent learning tech',
	icons: {
		icon: '/favicon.svg',
	},
	openGraph: {
		title: 'Lernen',
		description: 'The intelligent learning tech',
		images: ['/Abstract-Ripple-Effect.png'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Lernen',
		description: 'The intelligent learning tech',
		images: ['/Abstract-Ripple-Effect.png'],
	},
};

export default function Home() {
	return <div>hello</div>;
}

// check if pdf is correct first
// check for corrupted pdfs
// add height to pdf viewer intersection observer api

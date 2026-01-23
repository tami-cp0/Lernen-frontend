import type { Metadata } from 'next';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/ibm-plex-mono/700.css';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
	title: 'Lernen',
	icons: {
		icon: '/favicon.svg',
	},
	description: 'The intelligent learning tech',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="font-sans antialiased">
				{/* <AuthProvider> */}
				{children}
				{/* </AuthProvider> */}
				<Toaster
					visibleToasts={5}
					position="top-center"
					toastOptions={{
						style: {
							background: '#252525',
							borderRadius: '12px',
						},
						classNames: {
							error: 'text-red-500',
						},
					}}
				/>
			</body>
		</html>
	);
}

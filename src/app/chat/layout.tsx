'use client';
import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from './components/Sidebar';
import { FileViewProvider, useFileView } from './context/FileViewContext';
import { SelectedDocsProvider } from './context/SelectedDocsContext';
import { UserProvider } from './context/UserContext';

// Dynamically import FileView to prevent SSR issues with PDF.js
const FileView = dynamic(() => import('./components/fileView'), { ssr: false });

function ChatLayoutContent({ children }: { children: ReactNode }) {
	const { selectedFile } = useFileView();

	return (
		<div className="h-screen w-screen flex flex-row">
			<Sidebar />

			<main className="flex-1 h-full bg-secondary flex justify-center items-center rounded-bl-xl rounded-tl-xl overflow-hidden">
				<div className="w-full flex h-full bg-background gap-1">
					<section
						className={`${
							selectedFile ? 'flex-1' : 'flex-1 w-full'
						} overflow-hidden bg-secondary rounded-xl min-w-90`}
					>
						{children}
					</section>
					{selectedFile && (
						<section className="flex-1 h-full rounded-bl-xl rounded-tl-xl bg-secondary overflow-x-auto min-w-90">
							<section className="font-mono text-md w-full rounded-t-xl h-15 shadow-[0_0.1px_10px_rgba(0,0,0,0.7)] p-4 flex items-center justify-center">
								{selectedFile.fileName}
							</section>
							<section className="h-[calc(100%-60px)] w-full p-2">
								<FileView />
							</section>
						</section>
					)}
				</div>
			</main>
		</div>
	);
}

export default function ChatLayout({ children }: { children: ReactNode }) {
	return (
		<UserProvider>
			<FileViewProvider>
				<SelectedDocsProvider>
					<ChatLayoutContent>{children}</ChatLayoutContent>
				</SelectedDocsProvider>
			</FileViewProvider>
		</UserProvider>
	);
}
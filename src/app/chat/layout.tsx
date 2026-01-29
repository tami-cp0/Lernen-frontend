'use client';
import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from './components/Sidebar';
import { FileViewProvider, useFileView } from './context/FileViewContext';
import { SelectedDocsProvider } from './context/SelectedDocsContext';
import { UserProvider } from './context/UserContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import MobileHeader from './components/Header';

// Dynamically import FileView to prevent SSR issues with PDF.js
const FileView = dynamic(() => import('./components/fileView'), { ssr: false });

function ChatLayoutContent({ children }: { children: ReactNode }) {
	const { selectedFile } = useFileView();
	const { isSidebarExpanded, setIsSidebarExpanded } = useSidebar();

	return (
		<div className="h-screen-safe w-screen flex flex-row">
			<MobileHeader />
			<Sidebar />

			<main className="flex-1 h-full bg-secondary flex justify-center items-center md:rounded-bl-xl md:rounded-tl-xl overflow-hidden">
				<div className="w-full flex h-full bg-background gap-1">
					<section
						className={`${
							selectedFile ? 'flex-1' : 'flex-1 w-full'
						} overflow-hidden bg-secondary md:rounded-xl min-w-90 relative`}
					>
						{isSidebarExpanded && (
							<div
								className="bg-background/50 absolute inset-0 z-40 md:hidden"
								onClick={() => setIsSidebarExpanded(false)}
							></div>
						)}
						{children}
					</section>
					{selectedFile && (
						<section className="hidden lg:block flex-1 h-full rounded-bl-xl rounded-tl-xl bg-secondary overflow-x-auto min-w-90">
							<section className="font-mono text-md w-full rounded-t-xl h-15 bg-background/85 backdrop-blur-sm p-4 flex items-center justify-center">
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
			<SidebarProvider>
				<FileViewProvider>
					<SelectedDocsProvider>
						<ChatLayoutContent>{children}</ChatLayoutContent>
					</SelectedDocsProvider>
				</FileViewProvider>
			</SidebarProvider>
		</UserProvider>
	);
}

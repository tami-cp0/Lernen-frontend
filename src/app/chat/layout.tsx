'use client';
import { ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import { FileViewProvider, useFileView } from './context/FileViewContext';
import { SelectedDocsProvider } from './context/SelectedDocsContext';
import { UserProvider } from './context/UserContext';

function ChatLayoutContent({ children }: { children: ReactNode }) {
	const { selectedFile } = useFileView();

	return (
		<div className="h-screen w-screen flex flex-row">
			<Sidebar />

			<main className="w-full h-full bg-secondary flex justify-center items-center rounded-bl-xl rounded-tl-xl">
				<div className="flex-1 flex h-full bg-background gap-1">
					<section
						className={`${
							selectedFile ? 'flex-1' : 'flex-1 w-full'
						} overflow-hidden bg-secondary rounded-xl`}
					>
						{children}
					</section>
					{selectedFile && (
						<section className="basis-1/2 h-full w-full rounded-bl-xl rounded-tl-xl bg-secondary">
							<section className=" font-mono text-md w-full rounded-t-xl h-15 shadow-[0_0.1px_10px_rgba(0,0,0,0.7)] p-4 flex items-center justify-center">
								{selectedFile.fileName}
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

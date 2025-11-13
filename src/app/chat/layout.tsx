'use client';
import { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from './components/Sidebar';

export default function ChatLayout({ children }: { children: ReactNode }) {
	const searchParams = useSearchParams();

	return (
		<div className="h-screen w-screen flex flex-row">
			<Sidebar />

			<main className="w-full h-full bg-secondary flex justify-center items-center rounded-bl-xl rounded-tl-xl">
				{searchParams.get('file') ? (
					<div className="flex-1 flex h-full bg-background gap-1">
						<section className="flex-1 overflow-hidden bg-secondary rounded-xl">
							{children}
						</section>
						<section className="basis-1/2 h-full w-full rounded-bl-xl rounded-tl-xl bg-secondary">
							<section className=" font-mono text-md w-full rounded-t-xl h-15 shadow-[0_0.1px_10px_rgba(0,0,0,0.7)] p-4 flex items-center justify-center">
								Filename
							</section>
						</section>
					</div>
				) : (
					children
				)}
			</main>
		</div>
	);
}

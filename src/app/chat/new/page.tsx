'use client';
import { Button } from '@/components/ui/button';
import MessageComposer from '../components/MessageComposer';
import { ThumbsUp, Copy, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const NewChatPage = () => {
	const [isHelpful, setIsHelpful] = useState<boolean | null>(null);

	const handleHelpfulClick = () => {
		setIsHelpful(true);
		// TODO: Send helpful feedback to backend
		console.log('Feedback: helpful');
	};

	const handleNotHelpfulClick = () => {
		setIsHelpful(false);
		// TODO: Send not helpful feedback to backend
		console.log('Feedback: not helpful');
	};

	const handleCopyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		// TODO: Show a toast notification
		console.log('Copied to clipboard');
	};

	return (
		<main className="relative flex-1 h-full flex flex-col justify-center items-center pb-5">
			<section className="font-mono text-md w-full rounded-t-xl h-15 shadow-[0_0.1px_10px_rgba(0,0,0,0.7)] p-4 flex items-center">
				as
			</section>
			{/* Scrollable content area */}
			<section className="mb-4 overflow-y-auto flex-1 w-full flex justify-center hidden-scrollbar md:custom-scrollbar">
				<div className="w-[78%] max-w-[1000px] flex flex-col gap-3">
					<div className="w-[70%] self-end font-sans text-md text-foregrond flex flex-col gap-2 mt-4">
						<p className="bg-background p-3 rounded-lg">
							Lorem ipsum dolor sit amet, consectetur adipiscing
							elit. Sed do eiusmod tempor incididunt ut labore et
							dolore magna aliqua. Ut enim ad minim veniam, quis
							nostrud exercitation ullamco laboris nisi ut aliquip
							ex ea commodo consequat. Duis aute irure dolor in
							reprehenderit in voluptate velit esse cillum dolore
							eu fugiat nulla pariatur. Excepteur sint occaecat
							cupidatat non proident, sunt in culpa qui officia
							deserunt mollit anim id est laborum.
						</p>
						<div className="text-secondary-lighter flex flex-row justify-end items-center">
							<button
								onClick={() =>
									handleCopyToClipboard(
										'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
									)
								}
								className="transition-colors cursor-pointer hover:text-foreground"
							>
								<Copy size={16} />
							</button>
						</div>
					</div>
					<div className="w-[78%] self-start font-sans text-md text-foregrond gap-2">
						<p className="p-2">
							Lorem ipsum dolor sit amet, consectetur adipiscing
							elit. Sed do eiusmod tempor incididunt ut labore et
							dolore magna aliqua. Ut enim ad minim veniam, quis
							nostrud exercitation ullamco laboris nisi ut aliquip
							ex ea commodo consequat. Duis aute irure dolor in
							reprehenderit in voluptate velit esse cillum dolore
							eu fugiat nulla pariatur. Excepteur sint occaecat
							cupidatat non proident, sunt in culpa qui officia
							deserunt mollit anim id est laborum.
						</p>
						<div className="text-secondary-lighter flex justify-between items-center">
							<button
								onClick={() =>
									handleCopyToClipboard(
										'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
									)
								}
								className=" ml-2 transition-colors cursor-pointer hover:text-foreground"
							>
								<Copy size={16} />
							</button>
							<div className="flex items-center gap-3">
								<p>Helpful?</p>
								<button
									onClick={handleHelpfulClick}
									className={`transition-colors cursor-pointer ${
										isHelpful === true
											? 'text-primary'
											: 'hover:text-primary'
									}`}
								>
									<ThumbsUp size={16} />
								</button>
								<button
									onClick={handleNotHelpfulClick}
									className={`transition-colors cursor-pointer ${
										isHelpful === false
											? 'text-red-500'
											: 'hover:text-red-500'
									}`}
								>
									<ThumbsUp
										size={16}
										className="rotate-180"
									/>
								</button>
							</div>
						</div>
					</div>
          {/* display this if there is an error from generating the output instead of the normal ai output*/}
					<div className="w-fit px-3 py-2 self-start font-sans text-md text-foregrond border-1 border-red-500/50 flex gap-3 items-center rounded-xl bg-red-500/10">
						error_message
						<Button
							variant={'outline'}
							className="w-8 h-8 border-red-500/50 bg-red-500/15 hover:bg-red-500/25 hover:border-red-500/70 transition-colors rounded-full"
						>
							<RotateCcw size={16}/>
						</Button>
					</div>
				</div>
			</section>

			{/* Sticky composer at bottom */}
			<MessageComposer />
		</main>
	);
};

export default NewChatPage;

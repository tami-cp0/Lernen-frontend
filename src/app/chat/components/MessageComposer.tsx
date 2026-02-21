'use client';
import React from 'react';
import { MoveUp } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { useKeyboardOffset } from '../hooks/useKeyboardOffset';

export default function MessageComposer({
	onSend,
	text,
	setText,
	isSending,
}: {
	onSend: (msg: string) => void;
	text: string;
	setText: (t: string) => void;
	isSending: boolean;
}) {
	const keyboardOffset = useKeyboardOffset();

	const handleClick = () => {
		if (!text.trim() || isSending) return;
		onSend(text);
		setText('');
	};

	return (
		<section
			style={{ bottom: `${Math.max(keyboardOffset, 16) + 4}px` }}
			className="absolute w-[85%] md:w-[78%] max-w-[1000px] flex flex-col items-start gap-4 rounded-[28px] bg-background/75 backdrop-blur-sm px-2 py-3 shadow-md z-50 md:bottom-4"
		>
			<section className="w-full flex items-center gap-4">
				<TextareaAutosize
					value={text}
					placeholder="Ask Lernen"
					minRows={1}
					maxRows={7}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							document.getElementById('send-btn')!.click();
						}
					}}
					style={{ height: 24 }}
					className="resize-none z-2 flex-1 text-md md:text-md max-h-[200px] overflow-y-auto text-foreground placeholder:text-secondary-lighter focus:outline-none focus:ring-0 appearance-none mr-11 ml-2 hidden-scrollbar md:custom-scrollbar"
				/>

				<button
					id="send-btn"
					onClick={handleClick}
					className={`absolute right-1 h-9 w-9 rounded-full flex justify-center items-center bg-primary transition-opacity ${
						isSending
							? 'opacity-60 cursor-not-allowed'
							: 'cursor-pointer'
					}`}
					disabled={isSending}
				>
					<MoveUp className="h-4.5" color="black" strokeWidth={2} />
				</button>
			</section>
		</section>
	);
}

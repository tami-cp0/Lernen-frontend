'use client';
import React, { useState } from 'react';
import { MoveUp } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

export default function MessageComposer({
	onSend,
}: {
	onSend: (msg: string) => void;
}) {
	const [text, setText] = useState('');
	const handleClick = () => {
		if (!text.trim()) return;
		onSend(text);
		setText('');
	};

	return (
		<section className="sticky bottom-0 w-[80%] max-w-200 flex flex-col items-start gap-4 border-0 rounded-[28px] bg-background px-2 py-3 shadow-[0_0_10px_rgba(0,0,0,0.7)]">
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
					className="resize-none flex-1 h-7 max-h-[200px] overflow-y-auto text-foreground placeholder:text-secondary-lighter focus:outline-none focus:ring-0 appearance-none mr-11 ml-2 hidden-scrollbar md:custom-scrollbar"
				/>

				<button
					id="send-btn"
					onClick={handleClick}
					className="absolute right-1 h-9 w-9 rounded-full flex justify-center items-center cursor-pointer bg-primary"
				>
					<MoveUp className="h-4.5" color="black" strokeWidth={2} />
				</button>
			</section>
		</section>
	);
}

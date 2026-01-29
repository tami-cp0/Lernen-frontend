'use client';
import React, { useState, useEffect } from 'react';
import { MoveUp } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';

export default function MessageComposer({
	onSend,
	text,
	setText,
	isSending,
	isFirstVisit,
	keyboardOffset = 0,
}: {
	onSend: (msg: string) => void;
	text: string;
	setText: (t: string) => void;
	isSending: boolean;
	isFirstVisit: boolean;
	keyboardOffset?: number;
}) {
	const handleClick = () => {
		if (!text.trim() || isSending) return;
		onSend(text);
		setText('');
	};

	const [isHintEnabled, setIsHintEnabled] = useState<boolean>(false);

	useEffect(() => {
		if (isHintEnabled) {
			const timer = setTimeout(() => {
				setIsHintEnabled(false);
			}, 4000);
			return () => clearTimeout(timer);
		}
	}, [isHintEnabled]);

	return (
		<section
			className="absolute bottom-4 w-[85%] md:w-[78%] max-w-[1000px] flex flex-col items-start gap-4 border-0 rounded-[28px] bg-background/85 backdrop-blur-sm px-2 py-3 shadow-md transition-all duration-150"
			style={{
				bottom: keyboardOffset ? `${keyboardOffset + 16}px` : '16px',
			}}
		>
			<section className="w-full flex items-center gap-4">
				<Tooltip
					open={isHintEnabled}
					onOpenChange={setIsHintEnabled}
					disableHoverableContent
				>
					<TooltipTrigger asChild>
						<p className="h-12 z-0 absolute w-20 pointer-events-none"></p>
					</TooltipTrigger>
					<TooltipContent
						className="text-white duration-1000 text-md w-53 border-1 border-secondary-lighter/20 ml-15 bg-background/70 backdrop-blur-sm shadow-sm"
						arrowClassName="opacity-0"
					>
						<span className="font-medium">Tip:</span> Include all
						necessary details in your question.
					</TooltipContent>
				</Tooltip>
				<TextareaAutosize
					value={text}
					placeholder="Ask Lernen"
					minRows={1}
					maxRows={7}
					onClick={() => {
						if (isFirstVisit) {
							setIsHintEnabled(true);
						}
					}}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							document.getElementById('send-btn')!.click();
						}
					}}
					className="resize-none z-2 flex-1 text-sm md:text-md max-h-[200px] overflow-y-auto text-foreground placeholder:text-secondary-lighter focus:outline-none focus:ring-0 appearance-none mr-11 ml-2 hidden-scrollbar md:custom-scrollbar"
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

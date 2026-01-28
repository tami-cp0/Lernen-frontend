import { Button } from '@/components/ui/button';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { ThumbsUp, Copy, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ChatMessage Component
 *
 * Renders individual chat messages with different styles based on message type.
 * Handles three types of messages:
 * 1. User messages - Right-aligned, simple layout
 * 2. Assistant messages - Left-aligned with feedback buttons (thumbs up/down) and copy button
 * 3. Error messages - Red border with retry button
 *
 * Features:
 * - Markdown rendering for rich text formatting
 * - Copy to clipboard functionality
 * - Feedback collection (helpful/not helpful)
 * - Error retry mechanism
 */

// Regular message from user or assistant
export type Message = {
	id: string;
	originalId?: string; // Database ID for feedback tracking
	content: string;
	role: 'user' | 'assistant';
	tokens: number;
	createdAt: string;
};

// Error message when API call fails
export type ErrorMessage = {
	id: string;
	content: string;
	role: 'assistant';
	type: 'error';
	originalMessage?: string; // Original message text for retry
	userMessageId?: string; // ID of the user message that triggered this error (for removal on retry)
};

// Union type for all possible message displays
export type DisplayMessage = Message | ErrorMessage;

type ChatMessageProps = {
	message: DisplayMessage;
	messageFeedback?: Record<string, boolean | null>; // Track thumbs up/down state
	onHelpfulClick?: (messageId: string) => void;
	onNotHelpfulClick?: (messageId: string) => void;
	onRetry?: (originalMessage: string, messagesToRemove: string[]) => void; // Retry failed message with IDs to remove
};

export const ChatMessage = ({
	message,
	messageFeedback = {},
	onHelpfulClick,
	onNotHelpfulClick,
	onRetry,
}: ChatMessageProps) => {
	// Copy message content to clipboard and show toast notification
	const handleCopyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast('Copied to clipboard');
	};

	// Error message
	if ('type' in message && message.type === 'error') {
		const handleRetry = () => {
			if (message.originalMessage && onRetry) {
				// Collect IDs to remove: the error message itself and the user message that caused it
				const messagesToRemove = [message.id];
				if (message.userMessageId) {
					messagesToRemove.push(message.userMessageId);
				}
				onRetry(message.originalMessage, messagesToRemove);
			}
		};

		return (
			<div className="max-w-[70%] self-start font-sans text-md text-foreground flex flex-col gap-2">
				<div className="p-3 border-t-3 border-red-500/90 bg-red-500/2 flex items-center gap-3">
					<div className="flex-1">{message.content}</div>
					<Button
						variant={'ghost'}
						size={'sm'}
						className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-700/10 shrink-0"
						onClick={handleRetry}
					>
						<RotateCcw size={14} className="mr-1" />
						Retry
					</Button>
				</div>
			</div>
		);
	}

	// User message
	if (message.role === 'user') {
		return (
			<div className="max-w-[70%] self-end font-sans text-md text-foregrond flex flex-col gap-2 mt-4">
				<div className="p-3 rounded-lg bg-background">
					<MarkdownRenderer content={message.content} />
				</div>
			</div>
		);
	}

	// Assistant message
	const msg = message as Message;
	return (
		<div className="max-w-[100%] self-start font-sans text-md text-foregrond gap-2">
			<div className="p-2">
				<MarkdownRenderer content={msg.content} />
			</div>
			<div className="text-secondary-lighter flex justify-between items-center gap-6">
				<button
					onClick={() => handleCopyToClipboard(message.content)}
					className=" ml-2 transition-colors cursor-pointer hover:text-foreground"
				>
					<Copy size={16} />
				</button>
				<div className="flex items-center gap-3">
					<p>Helpful?</p>
					<button
						onClick={() =>
							msg.originalId &&
							onHelpfulClick &&
							onHelpfulClick(msg.originalId)
						}
						className={`transition-colors cursor-pointer ${
							msg.originalId &&
							messageFeedback[msg.originalId] === true
								? 'text-primary'
								: 'hover:text-primary'
						}`}
					>
						<ThumbsUp size={16} />
					</button>
					<button
						onClick={() =>
							msg.originalId &&
							onNotHelpfulClick &&
							onNotHelpfulClick(msg.originalId)
						}
						className={`transition-colors cursor-pointer ${
							msg.originalId &&
							messageFeedback[msg.originalId] === false
								? 'text-red-500'
								: 'hover:text-red-500'
						}`}
					>
						<ThumbsUp size={16} className="rotate-180" />
					</button>
				</div>
			</div>
		</div>
	);
};

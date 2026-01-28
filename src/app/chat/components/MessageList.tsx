import { ChatMessage, type DisplayMessage } from './ChatMessage';

/**
 * MessageList Component
 *
 * Simple wrapper component that renders a list of chat messages.
 * Maps over the messages array and renders each one using the ChatMessage component.
 *
 * This component acts as a presentation layer, passing down all necessary
 * event handlers and state to individual message components.
 */

type MessageListProps = {
	messages: DisplayMessage[]; // Array of all messages to display
	messageFeedback: Record<string, boolean | null>; // Feedback state (thumbs up/down)
	onHelpfulClick: (messageId: string) => void; // Handler for marking message as helpful
	onNotHelpfulClick: (messageId: string) => void; // Handler for marking message as not helpful
	onRetry: (originalMessage: string, messagesToRemove: string[]) => void; // Handler for retrying failed messages
};

export const MessageList = ({
	messages,
	messageFeedback,
	onHelpfulClick,
	onNotHelpfulClick,
	onRetry,
}: MessageListProps) => {
	return (
		<>
			{messages.filter(Boolean).map((message) => (
				<ChatMessage
					key={message.id}
					message={message}
					messageFeedback={messageFeedback}
					onHelpfulClick={onHelpfulClick}
					onNotHelpfulClick={onNotHelpfulClick}
					onRetry={onRetry}
				/>
			))}
		</>
	);
};

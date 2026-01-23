import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import type { DisplayMessage } from '../components/ChatMessage';

/**
 * useChatMessages Hook
 *
 * Manages chat message state and operations for a specific chat.
 * Handles fetching existing messages from the backend, converting them from
 * the API format to display format, and managing user feedback (helpful/not helpful).
 *
 * Features:
 * - Fetches and displays existing chat messages
 * - Converts backend "turn" format (user + assistant pairs) into individual display messages
 * - Manages message feedback state
 * - Handles feedback submission to backend
 * - Auto-fetches when chat is created
 *
 * @param chatId - UUID of the chat to fetch messages for
 * @param chatCreated - Whether the chat has been created in the backend
 * @returns Object containing messages, chat title, loading state, and feedback handlers
 */

export const useChatMessages = (chatId: string, chatCreated: boolean) => {
	// State for all messages in the chat
	const [messages, setMessages] = useState<DisplayMessage[]>([]);
	// Chat title (generated from first message or "Chat" for new chats)
	const [chatTitle, setChatTitle] = useState<string>('');
	// Loading state while fetching messages
	const [isLoading, setIsLoading] = useState(true);
	// Track user feedback (thumbs up/down) for each message
	const [messageFeedback, setMessageFeedback] = useState<
		Record<string, boolean | null>
	>({});

	// Fetch chat messages when chat is created
	useEffect(() => {
		if (!chatCreated) return; // Wait until chat exists in backend

		const fetchChatMessages = async () => {
			try {
				setIsLoading(true);
				const data = await apiRequest<{
					data: {
						id: string;
						userId: string;
						title: string;
						createdAt: string;
						updatedAt: string;
						messages: Array<{
							id: string;
							chatId: string;
							turn: {
								user: string;
								assistant: string;
							};
							helpful: boolean | null;
							totalTokens: number;
							createdAt: string;
						}>;
						documents: Array<{
							id: string;
							fileName: string;
							fileType: string;
						}>;
					};
				}>(`chats/${chatId}/messages`);
				console.log('Fetch chat response:', data);
				setChatTitle(data.data.title);

				// Convert messages from turn format to DisplayMessage format
				const convertedMessages: DisplayMessage[] =
					data.data.messages.flatMap((msg) => [
						{
							id: msg.id + '-user',
							originalId: msg.id,
							content: msg.turn.user,
							role: 'user' as const,
							tokens: 0,
							createdAt: msg.createdAt,
						},
						{
							id: msg.id + '-assistant',
							originalId: msg.id,
							content: msg.turn.assistant,
							role: 'assistant' as const,
							tokens: msg.totalTokens,
							createdAt: msg.createdAt,
						},
					]);

				setMessages(convertedMessages);

				// Load existing feedback state
				const feedbackState: Record<string, boolean | null> = {};
				data.data.messages.forEach((msg) => {
					if (msg.helpful !== null) {
						feedbackState[msg.id] = msg.helpful;
					}
				});
				setMessageFeedback(feedbackState);
			} catch (error) {
				// For new chats, it's normal to not find messages yet
				const err = error as { response?: { status?: number } };
				if (err?.response?.status === 404) {
					console.log('New chat - no messages yet');
					setChatTitle('Chat');
				} else {
					console.error('Error fetching chat:', error);
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchChatMessages();
	}, [chatId, chatCreated]);

	const handleHelpfulClick = async (messageId: string) => {
		try {
			await apiRequest(
				`chats/${chatId}/messages/${messageId}/feedback`,
				'PATCH',
				{ helpful: true }
			);
			setMessageFeedback((prev) => ({ ...prev, [messageId]: true }));
		} catch (error) {
			console.error('Error submitting feedback:', error);
		}
	};

	const handleNotHelpfulClick = async (messageId: string) => {
		try {
			await apiRequest(
				`chats/${chatId}/messages/${messageId}/feedback`,
				'PATCH',
				{ helpful: false }
			);
			setMessageFeedback((prev) => ({ ...prev, [messageId]: false }));
		} catch (error) {
			console.error('Error submitting feedback:', error);
		}
	};

	return {
		messages,
		setMessages,
		chatTitle,
		isLoading,
		messageFeedback,
		handleHelpfulClick,
		handleNotHelpfulClick,
	};
};

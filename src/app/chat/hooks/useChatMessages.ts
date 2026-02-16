import { useState, useEffect, useCallback, useRef } from 'react';
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
 * - Fetches and displays existing chat messages with pagination
 * - Infinite scroll: loads older messages when user scrolls to top
 * - Converts backend "turn" format (user + assistant pairs) into individual display messages
 * - Manages message feedback state
 * - Handles feedback submission to backend
 * - Auto-fetches when chat is created
 *
 * @param chatId - UUID of the chat to fetch messages for
 * @param chatCreated - Whether the chat has been created in the backend
 * @returns Object containing messages, chat title, loading state, pagination, and feedback handlers
 */

export const useChatMessages = (chatId: string, chatCreated: boolean) => {
	// State for all messages in the chat
	const [messages, setMessages] = useState<DisplayMessage[]>([]);
	// Chat title (generated from first message or "Chat" for new chats)
	const [chatTitle, setChatTitle] = useState<string>('');
	// Loading state while fetching initial messages - false for 'new' chats since there's nothing to load
	const [isLoading, setIsLoading] = useState(chatId !== 'new');
	// Loading state for fetching older messages (infinite scroll)
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	// Track if there are more messages to load
	const [hasMore, setHasMore] = useState(false);
	// Current page for pagination
	const [currentPage, setCurrentPage] = useState(1);
	// Track user feedback (thumbs up/down) for each message
	const [messageFeedback, setMessageFeedback] = useState<
		Record<string, boolean | null>
	>({});
	// Track the previous chatId to detect transitions from 'new' to UUID
	const prevChatIdRef = useRef<string>(chatId);

	// Fetch chat messages when chat is created
	useEffect(() => {
		// Skip fetching for 'new' chats - they have no messages yet
		if (!chatCreated || chatId === 'new') {
			// NEVER clear messages here - they might have been optimistically added
			// Only reset if we're truly navigating to a new empty chat
			if (prevChatIdRef.current !== chatId) {
				setMessages([]);
				setChatTitle('');
				setMessageFeedback({});
				setHasMore(false);
				setCurrentPage(1);
			}
			setIsLoading(false);
			prevChatIdRef.current = chatId;
			return;
		}

		// If we're transitioning from 'new' to a UUID (chat just created),
		// skip the fetch because messages were already optimistically added
		if (prevChatIdRef.current === 'new' && chatId !== 'new') {
			prevChatIdRef.current = chatId;
			setIsLoading(false);
			return;
		}

		// If chatId hasn't changed, don't refetch
		if (prevChatIdRef.current === chatId) {
			return;
		}

		// Update previous chatId tracker
		prevChatIdRef.current = chatId;

		const fetchChatMessages = async () => {
			try {
				// Clear old messages before fetching new ones
				setMessages([]);
				setChatTitle('');
				setMessageFeedback({});
				setHasMore(false);
				setCurrentPage(1);
				setIsLoading(true);

				// Fetch messages with pagination - only get messages, not full chat data
				// This is much more efficient than fetching entire chat with documents
				const data = await apiRequest<{
					data: {
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
						title: string;
						hasMore?: boolean;
						nextPage?: number;
					};
				}>(`chats/${chatId}/messages?page=1&limit=50`);

				setChatTitle(data.data.title || 'Chat');
				setHasMore(data.data.hasMore || false);
				setCurrentPage(1);

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

	// Load more messages when user scrolls to top (infinite scroll)
	const loadMoreMessages = useCallback(async () => {
		if (!hasMore || isLoadingMore || chatId === 'new') return;

		try {
			setIsLoadingMore(true);
			const nextPage = currentPage + 1;

			const data = await apiRequest<{
				data: {
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
					hasMore?: boolean;
				};
			}>(`chats/${chatId}/messages?page=${nextPage}&limit=50`);

			setHasMore(data.data.hasMore || false);
			setCurrentPage(nextPage);

			// Convert new messages
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

			// Prepend older messages to the beginning of the array
			setMessages((prev) => [...convertedMessages, ...prev]);

			// Update feedback state for new messages
			data.data.messages.forEach((msg) => {
				if (msg.helpful !== null) {
					setMessageFeedback((prev) => ({
						...prev,
						[msg.id]: msg.helpful,
					}));
				}
			});
		} catch (error) {
			console.error('Error loading more messages:', error);
		} finally {
			setIsLoadingMore(false);
		}
	}, [chatId, hasMore, isLoadingMore, currentPage]);

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
		isLoadingMore,
		hasMore,
		loadMoreMessages,
		messageFeedback,
		handleHelpfulClick,
		handleNotHelpfulClick,
	};
};

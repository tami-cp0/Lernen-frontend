import {
	useState,
	useEffect,
	useLayoutEffect,
	useCallback,
	useRef,
} from 'react';
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
	// Initialize to null so the first mount always triggers a fetch for existing chats
	const prevChatIdRef = useRef<string | null>(null);
	const hadOptimisticMessagesRef = useRef(false);

	// Synchronously clear stale messages as soon as we enter /chat/new to avoid UI flash
	useLayoutEffect(() => {
		if (chatId === 'new') {
			setMessages([]);
			setChatTitle('');
			setMessageFeedback({});
			setHasMore(false);
			setCurrentPage(1);
			prevChatIdRef.current = 'new';
		}
	}, [chatId]);

	// Fetch chat messages when chat is created
	useEffect(() => {
		// Handle "new" chat (no backend chat yet)
		if (chatId === 'new' || !chatCreated) {
			// Track whether we have optimistic messages in this new session
			hadOptimisticMessagesRef.current = messages.length > 0;
			setIsLoading(false);
			prevChatIdRef.current = 'new';
			return;
		}

		// We are on a real chatId (UUID)
		const comingFromNew = prevChatIdRef.current === 'new';

		// If we just created the chat from /new, NEVER fetch - messages are managed by useStreamingMessage
		// This prevents race condition where effect runs before setMessages commits
		if (comingFromNew) {
			prevChatIdRef.current = chatId;
			hadOptimisticMessagesRef.current = false;
			setIsLoading(false);
			return;
		}

		// If chatId hasn't changed, don't refetch
		if (prevChatIdRef.current === chatId) {
			return;
		}

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

				const feedbackState: Record<string, boolean | null> = {};
				data.data.messages.forEach((msg) => {
					if (msg.helpful !== null) {
						feedbackState[msg.id] = msg.helpful;
					}
				});
				setMessageFeedback(feedbackState);

				prevChatIdRef.current = chatId;
			} catch (error) {
				const err = error as { response?: { status?: number } };
				if (err?.response?.status === 404) {
					setChatTitle('Chat');
				} else {
					console.error('Error fetching chat:', error);
				}
				prevChatIdRef.current = chatId;
			} finally {
				setIsLoading(false);
			}
		};

		fetchChatMessages();
		// eslint-disable-next-line react-hooks/exhaustive-deps
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

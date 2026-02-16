'use client';
import MessageComposer from '../components/MessageComposer';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSelectedDocs } from '../context/SelectedDocsContext';
import { useFileView } from '../context/FileViewContext';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { MessageList } from '../components/MessageList';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { useChatMessages } from '../hooks/useChatMessages';
import { useStreamingMessage } from '../hooks/useStreamingMessage';
import { useChatContext } from '../context/ChatContext';

const ExistingChatPage = () => {
	const params = useParams();
	const paramId = params.id as string;
	const isNewChat = paramId === 'new';

	// Use the chat context for chat creation only
	const { actualChatId, chatCreated, createChatIfNeeded } = useChatContext();

	// Keep chatId stable during transitions:
	// - For truly new chats (paramId='new' and no actualChatId), use 'new'
	// - For newly created chats (was 'new', now has UUID), keep using the UUID from actualChatId
	// - For existing chats, use paramId directly
	const chatId = isNewChat
		? actualChatId || 'new' // Use actualChatId if available (during/after creation), otherwise 'new'
		: paramId;

	const { selectedDocs, setSelectedDocs } = useSelectedDocs();
	const { setSelectedFile, selectedFile, currentPage, pdfDocument } =
		useFileView();

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const loadingRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [composerText, setComposerText] = useState('');
	const [showMessages, setShowMessages] = useState(false);
	const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
	const [hasUserSent, setHasUserSent] = useState(false);
	const prevMessageCountRef = useRef(0);
	const prevParamIdRef = useRef<string | null>(null);

	// Custom hooks for state and logic
	// Pass paramId as key to force hook reset on navigation
	const {
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
	} = useChatMessages(chatId, isNewChat ? chatCreated : true);

	// Reset visual state when navigating to a different chat
	// BUT don't reset when transitioning from 'new' to UUID (chat creation)
	useEffect(() => {
		const isCreatingNewChat =
			prevParamIdRef.current === 'new' && paramId !== 'new';

		if (!isCreatingNewChat && prevParamIdRef.current !== null) {
			// Only reset if we're actually navigating to a different chat
			setShowMessages(false);
			setHasScrolledToBottom(false);
			setHasUserSent(false);
			prevMessageCountRef.current = 0;
		}

		prevParamIdRef.current = paramId;
	}, [paramId]);

	const { sendMessage, isSendingMessage } = useStreamingMessage({
		chatId,
		selectedDocs,
		selectedFile,
		pdfDocument,
		currentPage,
		setMessages,
		isNewChat,
		createChat: createChatIfNeeded,
	});

	// Close file viewer and clear selected docs when navigating to a new chat
	useEffect(() => {
		setSelectedFile(null);
		setSelectedDocs([]);
	}, [chatId, setSelectedFile, setSelectedDocs]);

	// Wrap sendMessage to track when the user sends a message
	const handleSend = useCallback(
		(text: string, messagesToRemove?: string[]) => {
			setHasUserSent(true);
			sendMessage(text, messagesToRemove);
		},
		[sendMessage]
	);

	// Scroll behavior:
	// - On initial load of existing chat: scroll to bottom instantly, then reveal
	// - When user sends a message: scroll so the new user message is at the TOP of the view, then stop
	// - Do NOT follow streaming assistant response
	useEffect(() => {
		const messageCount = messages.length;
		const isNewMessage = messageCount > prevMessageCountRef.current;
		prevMessageCountRef.current = messageCount;

		// Always show messages when we have any messages
		if (messages.length > 0) {
			setShowMessages(true);
		}

		if (messages.length > 0 && !isLoading && !hasScrolledToBottom) {
			// First time messages load (existing chat) - scroll instantly to bottom
			messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
			setHasScrolledToBottom(true);
		} else if (hasUserSent && isNewMessage) {
			// User just sent a message
			// Only scroll if content overflows AND the new message is not visible
			const container = scrollContainerRef.current;
			if (container && container.scrollHeight > container.clientHeight) {
				// Container is overflowing - check if new message is visible
				const lastUserMsg = [...messages]
					.reverse()
					.find((m) => m.role === 'user');
				if (lastUserMsg) {
					requestAnimationFrame(() => {
						const el = document.getElementById(
							`msg-${lastUserMsg.id}`
						);
						if (el && container) {
							// Check if element is in the visible viewport
							const rect = el.getBoundingClientRect();
							const containerRect =
								container.getBoundingClientRect();

							// Element is visible if it's fully within the container's visible area
							const isVisible =
								rect.top >= containerRect.top &&
								rect.bottom <= containerRect.bottom;

							// Only scroll if the message is not visible
							if (!isVisible) {
								el.scrollIntoView({
									behavior: 'instant',
									block: 'start',
								});
							}
						}
					});
				}
			}
			// Stop tracking - don't follow the streaming response
			setHasUserSent(false);
			// Mark as scrolled so we don't trigger the initial scroll logic
			if (!hasScrolledToBottom) {
				setHasScrolledToBottom(true);
			}
		}
	}, [messages, isLoading, hasScrolledToBottom, hasUserSent]);

	// Infinite scroll: load more messages when scrolling near the top
	useEffect(() => {
		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer || !hasMore || isLoadingMore) return;

		const handleScroll = () => {
			// Check if user scrolled to within 200px of the top
			if (scrollContainer.scrollTop < 200 && hasMore && !isLoadingMore) {
				// Store current scroll height before loading more
				const previousScrollHeight = scrollContainer.scrollHeight;

				loadMoreMessages().then(() => {
					// After loading, maintain scroll position
					// (prevent jumping to top when new messages are prepended)
					requestAnimationFrame(() => {
						const newScrollHeight = scrollContainer.scrollHeight;
						const scrollDiff =
							newScrollHeight - previousScrollHeight;
						scrollContainer.scrollTop =
							scrollContainer.scrollTop + scrollDiff;
					});
				});
			}
		};

		scrollContainer.addEventListener('scroll', handleScroll);
		return () =>
			scrollContainer.removeEventListener('scroll', handleScroll);
	}, [hasMore, isLoadingMore, loadMoreMessages]);

	const handleRetry = useCallback(
		(originalMessage: string, messagesToRemove: string[]) => {
			handleSend(originalMessage, messagesToRemove);
		},
		[handleSend]
	);

	return (
		<main className="relative flex-1 h-full flex flex-col justify-center items-center">
			<section className="hidden md:flex font-mono text-md w-full rounded-t-xl h-15  p-4 items-center z-11 absolute top-0 bg-background/85 backdrop-blur-sm">
				{`${chatTitle && !isNewChat ? chatTitle : ''}`}
			</section>
			{/* Scrollable content area */}
			<section
				ref={scrollContainerRef}
				className="overflow-y-auto flex-1 w-full flex justify-center hidden-scrollbar md:custom-scrollbar"
			>
				<div className="w-[90%] md:w-[78%] max-w-[1000px] flex flex-col gap-3">
					<div className="h-12 shrink-0"></div>
					{/* Loading indicator for older messages at top */}
					{isLoadingMore && (
						<div className="flex justify-center py-4">
							<div className="text-sm text-muted-foreground">
								Loading older messages...
							</div>
						</div>
					)}
					{isNewChat &&
						messages.length === 0 &&
						!isSendingMessage && (
							<WelcomeScreen onHintClick={setComposerText} />
						)}
					{messages.length > 0 && (
						<MessageList
							messages={messages}
							messageFeedback={messageFeedback}
							onHelpfulClick={handleHelpfulClick}
							onNotHelpfulClick={handleNotHelpfulClick}
							onRetry={handleRetry}
						/>
					)}
					<LoadingIndicator
						ref={loadingRef}
						isLoading={isSendingMessage}
					/>
					{/* Scroll anchor */}
					<div ref={messagesEndRef} /> {/* empty space */}
					<div className="h-15 shrink-0"></div>
				</div>
			</section>

			{/* Sticky composer at bottom */}
			<MessageComposer
				onSend={handleSend}
				text={composerText}
				setText={setComposerText}
				isSending={isSendingMessage}
			/>
		</main>
	);
};

export default ExistingChatPage;

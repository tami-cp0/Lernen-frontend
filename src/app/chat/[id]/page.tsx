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
	
	// For existing chats, ALWAYS use paramId directly (it changes immediately on navigation)
	// Only use actualChatId for new chats that have been created
	const chatId = isNewChat 
		? (actualChatId || 'new')  // For new chat: use created ID if available, otherwise 'new'
		: paramId;  // For existing chats: always use URL param directly

	const { selectedDocs, setSelectedDocs } = useSelectedDocs();
	const { setSelectedFile, selectedFile, currentPage, pdfDocument } =
		useFileView();

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const loadingRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [composerText, setComposerText] = useState('');
	const [showMessages, setShowMessages] = useState(false);
	const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

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
	useEffect(() => {
		setShowMessages(false);
		setHasScrolledToBottom(false);
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

	// Auto-scroll to bottom when messages change or when sending starts
	useEffect(() => {
		if (isSendingMessage) {
			// Scroll to loading indicator when sending
			loadingRef.current?.scrollIntoView({ behavior: 'smooth' });
		} else if (messages.length > 0 && !isLoading && !hasScrolledToBottom) {
			// First time messages load - scroll instantly to bottom without showing them
			messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
			setHasScrolledToBottom(true);
			// Reveal messages after a brief delay
			setTimeout(() => {
				setShowMessages(true);
			}, 50);
		} else if (messages.length > 0 && hasScrolledToBottom) {
			// Subsequent updates - smooth scroll and messages already visible
			setShowMessages(true);
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages, isSendingMessage, isLoading, hasScrolledToBottom]);

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
			sendMessage(originalMessage, messagesToRemove);
		},
		[sendMessage]
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
					{isNewChat && (
						<WelcomeScreen onHintClick={setComposerText} />
					)}
					{!isNewChat && showMessages && (
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
				onSend={sendMessage}
				text={composerText}
				setText={setComposerText}
				isSending={isSendingMessage}
			/>
		</main>
	);
};

export default ExistingChatPage;

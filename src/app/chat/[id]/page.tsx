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
import { useKeyboardOffset } from '../hooks/useKeyboardOffset';
import { useChatContext } from '../context/ChatContext';

const ExistingChatPage = () => {
	const params = useParams();
	const paramId = params.id as string;
	const isNewChat = paramId === 'new';

	// Use the chat context for chat creation and state
	const { actualChatId, chatCreated, createChatIfNeeded } = useChatContext();
	// Use paramId for rendering/fetching to ensure immediate response to navigation
	const chatId = isNewChat ? 'new' : actualChatId || paramId;

	const { selectedDocs, setSelectedDocs } = useSelectedDocs();
	const { setSelectedFile, selectedFile, currentPage, pdfDocument } =
		useFileView();

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const loadingRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [composerText, setComposerText] = useState('');
	const keyboardOffset = useKeyboardOffset();
	const [isFirstVisit, setIsFirstVisit] = useState(false);

	// Custom hooks for state and logic
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
	} = useChatMessages(chatId, chatCreated);

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

	// Check if first visit on client side only
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const visited = localStorage.getItem('visited');
			if (!visited) {
				setIsFirstVisit(true);
				localStorage.setItem('visited', 'true');
			}
		}
	}, []);

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
		} else {
			// Scroll to bottom when messages update
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages, isSendingMessage]);

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
				{chatTitle || 'New Chat'}
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
					{isLoading ? (
						<div className="flex-1 flex items-center justify-center text-secondary-lighter">
							{/* Loading messages... */}
						</div>
					) : (
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
				isFirstVisit={isFirstVisit}
				keyboardOffset={keyboardOffset}
			/>
		</main>
	);
};

export default ExistingChatPage;

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
	const chatId = params.id as string;
	const isNewChat = chatId === 'new';

	const { createChatIfNeeded, resetKey } = useChatContext();

	const { selectedDocs, setSelectedDocs } = useSelectedDocs();
	const { setSelectedFile, selectedFile, currentPage, pdfDocument } =
		useFileView();

	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [composerText, setComposerText] = useState('');

	// Custom hooks for state and logic
	// Pass paramId as key to force hook reset on navigation
	const {
		messages,
		setMessages,
		chatTitle,
		isLoadingMore,
		hasMore,
		loadMoreMessages,
		messageFeedback,
		handleHelpfulClick,
		handleNotHelpfulClick,
	} = useChatMessages(chatId, !isNewChat, resetKey);

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

	// Keep a stable send handler for composer and retry actions
	const handleSend = useCallback(
		(text: string, messagesToRemove?: string[]) => {
			sendMessage(text, messagesToRemove);
		},
		[sendMessage]
	);

	// Infinite scroll: load more messages when scrolling near the top
	useEffect(() => {
		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer || !hasMore || isLoadingMore) return;

		const handleScroll = () => {
			// Check if user scrolled to within 200px of the top
			if (scrollContainer.scrollTop < 200 && hasMore && !isLoadingMore) {
				void loadMoreMessages();
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
					<LoadingIndicator isLoading={isSendingMessage} />
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

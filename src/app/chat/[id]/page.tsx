'use client';
import MessageComposer from '../components/MessageComposer';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import { useSelectedDocs } from '../context/SelectedDocsContext';
import { useFileView } from '../context/FileViewContext';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { MessageList } from '../components/MessageList';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { useChatMessages } from '../hooks/useChatMessages';
import { useStreamingMessage } from '../hooks/useStreamingMessage';
import { useKeyboardOffset } from '../hooks/useKeyboardOffset';
import { useSidebar } from '../context/SidebarContext';

const ExistingChatPage = () => {
	const params = useParams();
	const chatId = params.id as string;
	const { selectedDocs, setSelectedDocs } = useSelectedDocs();
	const { setSelectedFile, selectedFile, currentPage, pdfDocument } =
		useFileView();

	const [chatCreated, setChatCreated] = useState(false);
	const isCreatingChat = useRef(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const loadingRef = useRef<HTMLDivElement>(null);
	const [composerText, setComposerText] = useState('');
	const keyboardOffset = useKeyboardOffset();
	const { setIsSidebarExpanded } = useSidebar();

	// Custom hooks for state and logic
	const {
		messages,
		setMessages,
		chatTitle,
		isLoading,
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
	});

	// show hint for message composer if the user hasnt seen it before
	useEffect(() => {
		const isFirstVisit = !localStorage.getItem('visited');

		if (isFirstVisit) {
			localStorage.setItem('visited', 'true');
		}
	}, []);

	// Close file viewer and clear selected docs when navigating to a new chat
	useEffect(() => {
		setSelectedFile(null);
		setSelectedDocs([]);

		// Close sidebar on mobile/tablet when chat loads
		const isBelowLg = window.matchMedia('(max-width: 1023px)').matches;
		if (isBelowLg) {
			setIsSidebarExpanded(false);
		}
	}, [chatId, setSelectedFile, setSelectedDocs, setIsSidebarExpanded]);

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

	// Create chat if it doesn't exist (when chatId is a new UUID)
	useEffect(() => {
		const createChatIfNeeded = async () => {
			// Prevent duplicate calls (React Strict Mode calls effects twice)
			if (chatCreated || isCreatingChat.current) return;

			isCreatingChat.current = true;

			try {
				// Try to create the chat with the provided chatId
				await apiRequest('chats/create', 'POST', { chatId });
				// Small delay to ensure backend has processed the creation
				await new Promise((resolve) => setTimeout(resolve, 100));
				setChatCreated(true);
			} catch (error) {
				// Check if it's a duplicate key error (chat already exists)
				const err = error as {
					response?: { status?: number };
					message?: string;
				};
				if (
					err?.response?.status === 409 ||
					err?.message?.includes('already exists') ||
					err?.message?.includes('Conflict')
				) {
					// Silently proceed if chat already exists
					setChatCreated(true);
				} else {
					console.error('Error creating chat:', error);
					setChatCreated(true); // Proceed anyway to try fetching
				}
			} finally {
				isCreatingChat.current = false;
			}
		};

		createChatIfNeeded();
	}, [chatId, chatCreated]);

	const handleRetry = (
		originalMessage: string,
		messagesToRemove: string[]
	) => {
		sendMessage(originalMessage, messagesToRemove);
	};

	return (
		<main className="relative flex-1 h-full flex flex-col justify-center items-center">
			<section className="hidden md:flex font-mono text-md w-full rounded-t-xl h-15  p-4 items-center z-11 absolute top-0 bg-background/85 backdrop-blur-sm">
				{chatTitle || 'New Chat'}
			</section>
			{/* Scrollable content area */}
			<section className="overflow-y-auto flex-1 w-full flex justify-center hidden-scrollbar md:custom-scrollbar">
				<div className="w-[78%] max-w-[1000px] flex flex-col gap-3">
					<div className="h-12 shrink-0"></div>
					{messages.length === 0 && !isLoading && (
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
				isFirstVisit={!localStorage.getItem('visited')}
				keyboardOffset={keyboardOffset}
			/>
		</main>
	);
};

export default ExistingChatPage;

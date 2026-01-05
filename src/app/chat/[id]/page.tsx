'use client';
import { Button } from '@/components/ui/button';
import MessageComposer from '../components/MessageComposer';
import { ThumbsUp, Copy, RotateCcw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api-client';
import { useSelectedDocs } from '../context/SelectedDocsContext';

type Message = {
	id: string;
	originalId?: string; // The actual database message ID for feedback
	content: string;
	role: 'user' | 'assistant';
	tokens: number;
	createdAt: string;
};

type ErrorMessage = {
	content: string;
	role: 'assistant';
	type: 'error';
};

type DisplayMessage = Message | ErrorMessage;

const ExistingChatPage = () => {
	const params = useParams();
	const chatId = params.id as string;
	const { selectedDocs } = useSelectedDocs();

	const [messages, setMessages] = useState<DisplayMessage[]>([]);
	const [chatTitle, setChatTitle] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);
	const [chatCreated, setChatCreated] = useState(false);
	const isCreatingChat = useRef(false);
	const [messageFeedback, setMessageFeedback] = useState<
		Record<string, boolean | null>
	>({});

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
			} catch (error: any) {
				// Check if it's a duplicate key error (chat already exists)
				if (
					error?.response?.status === 409 ||
					error?.message?.includes('already exists') ||
					error?.message?.includes('Conflict')
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

	// Fetch existing messages when component mounts
	useEffect(() => {
		if (!chatCreated) return; // Wait for chat to be created first

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
						documents: any[];
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
			} catch (error: any) {
				// For new chats, it's normal to not find messages yet
				if (error?.response?.status === 404) {
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

	const handleCopyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success('Copied to clipboard');
	};

	const handleSend = async (text: string) => {
		// Optimistically add user message
		const tempUserMsg: DisplayMessage = {
			content: text,
			role: 'user',
			id: 'temp-' + Date.now(),
			tokens: 0,
			createdAt: new Date().toISOString(),
		};
		setMessages((prev) => [...prev, tempUserMsg]);

		// Debug: log selectedDocs
		console.log('selectedDocs before filtering:', selectedDocs);

		try {
			const requestBody: {
				message: string;
				selectedDocumentIds?: string[];
			} = {
				message: text,
			};

			// Only include selectedDocumentIds if there are selected docs (filter out empty values)
			const validSelectedDocs = selectedDocs.filter(
				(id) => id && id.trim() !== ''
			);
			console.log(
				'validSelectedDocs after filtering:',
				validSelectedDocs
			);
			if (validSelectedDocs.length > 0) {
				requestBody.selectedDocumentIds = validSelectedDocs;
			}
			console.log('requestBody:', requestBody);

			const data = await apiRequest<{
				data: {
					message: {
						id: string;
						chatId: string;
						turn: {
							user: string;
							assistant: string;
						};
						helpful: boolean | null;
						totalTokens: number;
						createdAt: string;
					};
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					sourceDocuments: any[];
				};
			}>(`chats/${chatId}/send-message`, 'POST', requestBody);

			// Replace temp message with real ones (convert from turn format)
			setMessages((prev) => [
				...prev.slice(0, -1),
				{
					id: data.data.message.id + '-user',
					originalId: data.data.message.id,
					content: data.data.message.turn.user,
					role: 'user' as const,
					tokens: 0,
					createdAt: data.data.message.createdAt,
				},
				{
					id: data.data.message.id + '-assistant',
					originalId: data.data.message.id,
					content: data.data.message.turn.assistant,
					role: 'assistant' as const,
					tokens: data.data.message.totalTokens,
					createdAt: data.data.message.createdAt,
				},
			]);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (error) {
			setMessages((prev) => [
				...prev,
				{
					content: 'Failed to send message',
					role: 'assistant',
					type: 'error',
				},
			]);
		}
	};

	return (
		<main className="relative flex-1 h-full flex flex-col justify-center items-center pb-5">
			<section className="font-mono text-md w-full rounded-t-xl h-15 shadow-[0_0.1px_10px_rgba(0,0,0,0.7)] p-4 flex items-center">
				{chatTitle || 'Chat'}
			</section>
			{/* Scrollable content area */}
			<section className="mb-4 overflow-y-auto flex-1 w-full flex justify-center hidden-scrollbar md:custom-scrollbar">
				<div className="w-[78%] max-w-[1000px] flex flex-col gap-3">
					{isLoading ? (
						<div className="flex-1 flex items-center justify-center text-secondary-lighter">
							{/* Loading messages... */}
						</div>
					) : (
						messages.filter(Boolean).map((message, index) => {
							if ('type' in message && message.type === 'error') {
								return (
									<div
										key={index}
										className="w-fit px-3 py-2 self-start font-sans text-md text-foregrond border-1 border-red-500/50 flex gap-3 items-center rounded-xl bg-red-500/10"
									>
										{message.content}
										<Button
											variant={'outline'}
											className="w-8 h-8 border-red-500/50 bg-red-500/15 hover:bg-red-500/25 hover:border-red-500/70 transition-colors rounded-full"
										>
											<RotateCcw size={16} />
										</Button>
									</div>
								);
							}

							if (message.role === 'user') {
								return (
									<div
										key={message.id}
										className="max-w-[70%] self-end font-sans text-md text-foregrond flex flex-col gap-2 mt-4"
									>
										<p className="bg-background p-3 rounded-lg">
											{message.content}
										</p>
									</div>
								);
							}

							// assistant role (guaranteed to have id since we filtered errors)
							const msg = message as Message;
							return (
								<div
									key={msg.id}
									className="max-w-[78%] self-start font-sans text-md text-foregrond gap-2"
								>
									<p className="p-2">{msg.content}</p>
									<div className="text-secondary-lighter flex justify-between items-center gap-6">
										<button
											onClick={() =>
												handleCopyToClipboard(
													message.content
												)
											}
											className=" ml-2 transition-colors cursor-pointer hover:text-foreground"
										>
											<Copy size={16} />
										</button>
										<div className="flex items-center gap-3">
											<p>Helpful?</p>
											<button
												onClick={() =>
													msg.originalId &&
													handleHelpfulClick(
														msg.originalId
													)
												}
												className={`transition-colors cursor-pointer ${
													msg.originalId &&
													messageFeedback[
														msg.originalId
													] === true
														? 'text-primary'
														: 'hover:text-primary'
												}`}
											>
												<ThumbsUp size={16} />
											</button>
											<button
												onClick={() =>
													msg.originalId &&
													handleNotHelpfulClick(
														msg.originalId
													)
												}
												className={`transition-colors cursor-pointer ${
													msg.originalId &&
													messageFeedback[
														msg.originalId
													] === false
														? 'text-red-500'
														: 'hover:text-red-500'
												}`}
											>
												<ThumbsUp
													size={16}
													className="rotate-180"
												/>
											</button>
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			</section>

			{/* Sticky composer at bottom */}
			<MessageComposer onSend={handleSend} />
		</main>
	);
};

export default ExistingChatPage;

import { useState, Dispatch, SetStateAction } from 'react';
import type {
	TextItem,
	TextMarkedContent,
	PDFDocumentProxy,
} from 'pdfjs-dist/types/src/display/api';
import type { DisplayMessage, Message } from '../components/ChatMessage';

/**
 * useStreamingMessage Hook
 *
 * Handles sending messages to the AI and receiving streaming responses via Server-Sent Events (SSE).
 * Implements a two-step streaming process as required by the API:
 *
 * Step 1: Create a stream session (POST with authentication)
 * Step 2: Connect to SSE stream (GET without auth, uses cached session)
 *
 * Features:
 * - Two-step SSE streaming flow for real-time AI responses
 * - Optimistic UI updates (shows messages before API confirms)
 * - PDF page context extraction when viewing documents
 * - Document selection for context-aware responses
 * - Error handling with retry capability
 * - Automatic message cleanup on completion
 *
 * @param props - Configuration including chatId, selected documents, PDF state, and message setter
 * @returns Object with sendMessage function and loading state
 */

type UseStreamingMessageProps = {
	chatId: string; // UUID of the current chat
	selectedDocs: string[]; // IDs of documents to use for context
	selectedFile: { fileId: string; fileName: string; chatId: string } | null; // Currently viewed file (if any)
	pdfDocument: PDFDocumentProxy | null; // PDF.js document instance
	currentPage: number; // Current page number being viewed
	setMessages: Dispatch<SetStateAction<DisplayMessage[]>>; // State setter for messages
};

export const useStreamingMessage = ({
	chatId,
	selectedDocs,
	selectedFile,
	pdfDocument,
	currentPage,
	setMessages,
}: UseStreamingMessageProps) => {
	// Track whether a message is currently being sent/streamed
	const [isSendingMessage, setIsSendingMessage] = useState(false);

	/**
	 * Send a message and stream the AI response
	 *
	 * Flow:
	 * 1. Build request body with message and context (selected docs, current page)
	 * 2. Create stream session on backend (Step 1)
	 * 3. Add temporary messages to UI for optimistic rendering
	 * 4. Connect to SSE stream (Step 2)
	 * 5. Update temp message as chunks arrive
	 * 6. Replace temp messages with final messages on completion
	 */
	const sendMessage = async (text: string) => {
		// Add user message to UI IMMEDIATELY (before any async operations)
		const userMsgId = 'user-' + Date.now();
		const userMsg: Message = {
			id: userMsgId,
			content: text,
			role: 'user',
			tokens: 0,
			createdAt: new Date().toISOString(),
		};
		setMessages((prev) => [...prev, userMsg]);

		// Now start the loading indicator and async operations
		setIsSendingMessage(true);

		// Will hold the EventSource connection for SSE streaming
		let eventSource: EventSource | null = null;

		try {
			// Build the request body with message and optional context
			const requestBody: {
				message: string;
				selectedDocumentIds?: string[]; // Documents to search for context
				pageNumber?: number; // Current page user is viewing
				pageContent?: string; // Text content of current page
			} = {
				message: text,
			};

			// Add selected documents to request if any are selected
			const validSelectedDocs = selectedDocs.filter(
				(id) => id && id.trim() !== ''
			);
			if (validSelectedDocs.length > 0) {
				requestBody.selectedDocumentIds = validSelectedDocs;
			}

			// If user is viewing a PDF, extract current page content for context
			if (selectedFile && pdfDocument) {
				try {
					// Get the PDF page object
					const page = await pdfDocument.getPage(currentPage);
					// Extract text content from the page
					const textContent = await page.getTextContent();
					// Combine all text items into a single string
					const pageText = textContent.items
						.map((item: TextItem | TextMarkedContent) => {
							if ('str' in item) {
								return item.str;
							}
							return '';
						})
						.join(' ');
					// Include page number and content in request
					requestBody.pageNumber = currentPage;
					requestBody.pageContent = pageText;
				} catch (err) {
					console.error('Error extracting page text:', err);
				}
			}

			// Get authentication token from HTTP-only cookie
			const tokensRes = await fetch('/api/auth/get-tokens');
			const { accessToken } = await tokensRes.json();

			// STEP 1: Create stream session with authentication
			const sessionResponse = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chats/${chatId}/sse/create-stream-session`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						...(accessToken
							? { Authorization: `Bearer ${accessToken}` }
							: {}),
					},
					body: JSON.stringify(requestBody),
				}
			);

			if (!sessionResponse.ok) {
				throw new Error('Failed to create stream session');
			}

			// Session created successfully! Now connect to SSE stream
			// STEP 2: Connect to SSE stream (no auth needed, uses session from Step 1)
			eventSource = new EventSource(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chats/${chatId}/sse/stream-message`
			);

			// Accumulate the full response as chunks arrive
			let fullResponse = '';
			// Track if assistant message has been added (add on first chunk)
			let assistantMsgAdded = false;
			// Store assistant ID for later updates
			let assistantMsgId = '';
			// Debouncing for smoother UI updates
			let updateTimeout: NodeJS.Timeout | null = null;
			let pendingUpdate = false;

			// Handle incoming SSE messages (text chunks)
			eventSource.onmessage = (event) => {
				const chunk = event.data;

				// Check if this is the completion signal
				if (chunk.includes('"type":"done"')) {
					// Streaming complete! Clean up and finalize
					if (updateTimeout) clearTimeout(updateTimeout);
					eventSource?.close();
					setIsSendingMessage(false);
					return; // Done!
				}

				// This is a text chunk - add it to our accumulated response
				fullResponse += chunk;

				// On first chunk, add assistant message and turn off loading indicator
				if (!assistantMsgAdded) {
					assistantMsgAdded = true;
					assistantMsgId = 'assistant-' + Date.now();

					const assistantMsg: Message = {
						id: assistantMsgId,
						content: fullResponse, // First chunk
						role: 'assistant',
						tokens: 0,
						createdAt: new Date().toISOString(),
					};

					setMessages((prev) => [...prev, assistantMsg]);
					// Turn off loading indicator - first chunk received!
					setIsSendingMessage(false);
				} else {
					// Debounce UI updates for smoother streaming (update every 30ms max)
					if (!pendingUpdate) {
						pendingUpdate = true;
						updateTimeout = setTimeout(() => {
							setMessages((prev) =>
								prev.map((msg) =>
									msg.id === assistantMsgId
										? { ...msg, content: fullResponse }
										: msg
								)
							);
							pendingUpdate = false;
						}, 10);
					}
				}
			};

			// Handle SSE stream errors (connection issues, server errors, etc.)
			eventSource.onerror = (error) => {
				console.error('SSE Error:', error);
				eventSource?.close();
				setIsSendingMessage(false);

				// Show error message with retry button
				setMessages((prev) => [
					...prev,
					{
						id: 'error-' + Date.now(),
						content:
							'Please check your internet connection and try again',
						role: 'assistant',
						type: 'error',
						originalMessage: text, // Store for retry
					},
				]);
			};
		} catch (error: unknown) {
			// Handle errors during session creation (Step 1) or setup
			console.error('Error sending message:', error);
			eventSource?.close();
			setIsSendingMessage(false);

			// Determine error message
			let errorMessage = 'Failed to send message';
			if (
				error instanceof TypeError &&
				error.message === 'Failed to fetch'
			) {
				errorMessage =
					'Please check your internet connection and try again';
			}

			// Show error message (no temp messages exist yet if session creation failed)
			setMessages((prev) => [
				...prev,
				{
					id: 'error-' + Date.now(),
					content: errorMessage,
					role: 'assistant',
					type: 'error',
					originalMessage: text,
				},
			]);
		}
	};

	return {
		sendMessage,
		isSendingMessage,
	};
};

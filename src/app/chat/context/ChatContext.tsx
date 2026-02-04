'use client';
import {
	createContext,
	useContext,
	useState,
	useCallback,
	ReactNode,
	useRef,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';

type ChatContextType = {
	actualChatId: string | null;
	setActualChatId: (id: string | null) => void;
	chatCreated: boolean;
	setChatCreated: (created: boolean) => void;
	createChatIfNeeded: () => Promise<string | null>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();

	// Extract chatId from pathname
	const pathnameId = pathname?.match(/\/chat\/([^\/]+)/)?.[1] || null;
	const isNewChat = pathnameId === 'new';

	const [actualChatId, setActualChatId] = useState<string | null>(
		isNewChat ? null : pathnameId
	);
	const [chatCreated, setChatCreated] = useState(!isNewChat);
	const isCreatingRef = useRef(false);

	const createChatIfNeeded = useCallback(async (): Promise<string | null> => {
		// If already have a valid chatId, return it
		if (actualChatId && actualChatId !== 'new') {
			return actualChatId;
		}

		// If chat already created or currently creating, return existing ID
		if (chatCreated || isCreatingRef.current) {
			return actualChatId;
		}

		// Only create if we're on a 'new' chat
		if (!isNewChat) {
			return actualChatId;
		}

		isCreatingRef.current = true;

		try {
			const newChatId = crypto.randomUUID();
			await apiRequest('chats/create', 'POST', { chatId: newChatId });
			// Small delay to ensure backend has processed the creation
			await new Promise((resolve) => setTimeout(resolve, 100));

			setActualChatId(newChatId);
			setChatCreated(true);

			// Update URL without triggering a full navigation
			router.replace(`/chat/${newChatId}`, { scroll: false });

			// Dispatch event so Sidebar can refetch chats
			window.dispatchEvent(
				new CustomEvent('chat-created', {
					detail: { chatId: newChatId },
				})
			);

			return newChatId;
		} catch (error) {
			console.error('Error creating chat:', error);
			return null;
		} finally {
			isCreatingRef.current = false;
		}
	}, [chatCreated, isNewChat, actualChatId, router]);

	return (
		<ChatContext.Provider
			value={{
				actualChatId: actualChatId || pathnameId,
				setActualChatId,
				chatCreated,
				setChatCreated,
				createChatIfNeeded,
			}}
		>
			{children}
		</ChatContext.Provider>
	);
}

export function useChatContext() {
	const context = useContext(ChatContext);
	if (context === undefined) {
		throw new Error('useChatContext must be used within a ChatProvider');
	}
	return context;
}

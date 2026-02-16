'use client';
import {
	createContext,
	useContext,
	useState,
	useCallback,
	ReactNode,
	useRef,
	useEffect,
} from 'react';
import { usePathname } from 'next/navigation';
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
	const pathname = usePathname();

	// Extract chatId from pathname
	const pathnameId = pathname?.match(/\/chat\/([^\/]+)/)?.[1] || null;
	const isNewChat = pathnameId === 'new';

	const [actualChatId, setActualChatId] = useState<string | null>(
		isNewChat ? null : pathnameId
	);
	const [chatCreated, setChatCreated] = useState(!isNewChat);
	const isCreatingRef = useRef(false);

	// Reset state when pathname changes
	useEffect(() => {
		const newPathnameId = pathname?.match(/\/chat\/([^\/]+)/)?.[1] || null;
		const isNew = newPathnameId === 'new';

		// Reset state when navigating to a different chat or to 'new'
		if (isNew) {
			setActualChatId(null);
			setChatCreated(false);
			isCreatingRef.current = false;
		} else if (newPathnameId) {
			setActualChatId(newPathnameId);
			setChatCreated(true);
			isCreatingRef.current = false;
		}
	}, [pathname]);

	const createChatIfNeeded = useCallback(async (): Promise<string | null> => {
		// Always derive current route at call time to avoid stale closure values
		const currentPathnameId =
			pathname?.match(/\/chat\/([^\/]+)/)?.[1] || null;

		// If we're not on /chat/new, return route chat id directly
		if (currentPathnameId && currentPathnameId !== 'new') {
			return currentPathnameId;
		}

		// While on /chat/new, never reuse potentially stale previous chat IDs
		if (isCreatingRef.current) {
			return null;
		}

		isCreatingRef.current = true;

		try {
			const newChatId = crypto.randomUUID();
			await apiRequest('chats/create', 'POST', { chatId: newChatId });
			// Small delay to ensure backend has processed the creation
			await new Promise((resolve) => setTimeout(resolve, 100));

			setActualChatId(newChatId);
			setChatCreated(true);

			// Don't navigate yet - let the streaming complete first
			// Navigation will happen after stream is done

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
	}, [pathname]);

	return (
		<ChatContext.Provider
			value={{
				actualChatId: pathnameId === 'new' ? actualChatId : pathnameId,
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

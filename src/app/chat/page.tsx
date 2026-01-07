'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
	const router = useRouter();

	useEffect(() => {
		// Generate UUID and redirect on client side
		const chatId = crypto.randomUUID();
		router.replace(`/chat/${chatId}`);
	}, [router]);

	return null;
}

'use client';
import { redirect } from 'next/navigation';

export default function ChatPage() {
	// Generate UUID and redirect immediately (synchronous)
	const chatId = crypto.randomUUID();
	redirect(`/chat/${chatId}`);
}

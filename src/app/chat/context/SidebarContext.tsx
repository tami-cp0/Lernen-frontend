'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type SidebarContextType = {
	isSidebarExpanded: boolean;
	setIsSidebarExpanded: (expanded: boolean) => void;
	toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
	// Determine initial sidebar state based on screen size
	const isBelowLg =
		typeof window !== 'undefined' &&
		!window.matchMedia('(min-width: 1024px)').matches;

	// Sidebar is collapsed by default on small screens
	const [isSidebarExpanded, setIsSidebarExpanded] = useState(!isBelowLg);

	const toggleSidebar = () => {
		setIsSidebarExpanded((prev) => !prev);
	};

	return (
		<SidebarContext.Provider
			value={{ isSidebarExpanded, setIsSidebarExpanded, toggleSidebar }}
		>
			{children}
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (context === undefined) {
		throw new Error('useSidebar must be used within a SidebarProvider');
	}
	return context;
}

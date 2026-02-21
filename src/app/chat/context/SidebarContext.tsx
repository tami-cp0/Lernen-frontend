'use client';
import {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
} from 'react';

type SidebarContextType = {
	isSidebarExpanded: boolean;
	setIsSidebarExpanded: (expanded: boolean) => void;
	toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
	// Start with expanded (true) to match desktop default and avoid desktop flash
	// Mobile devices will use CSS to handle initial state
	const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

	// Update state based on actual screen size after mount
	useEffect(() => {
		const isBelowMd = !window.matchMedia('(min-width: 768px)').matches;
		setIsSidebarExpanded(!isBelowMd);
	}, []);

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

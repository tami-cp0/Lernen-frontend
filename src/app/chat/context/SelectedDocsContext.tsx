'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SelectedDocsContextType {
	selectedDocs: string[];
	setSelectedDocs: (docs: string[]) => void;
	toggleDoc: (docId: string) => void;
	addDoc: (docId: string) => void;
}

const SelectedDocsContext = createContext<SelectedDocsContextType | undefined>(
	undefined
);

export function SelectedDocsProvider({ children }: { children: ReactNode }) {
	const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

	const toggleDoc = (docId: string) => {
		setSelectedDocs((prev) =>
			// Check if the docId is already in the array
			prev.includes(docId)
				? // If YES: remove it (uncheck)
				  prev.filter((id) => id !== docId)
				: // If NO: add it (check)
				  [...prev, docId]
		);
	};

	const addDoc = (docId: string) => {
		setSelectedDocs((prev) =>
			prev.includes(docId) ? prev : [...prev, docId]
		);
	};

	return (
		<SelectedDocsContext.Provider
			value={{ selectedDocs, setSelectedDocs, toggleDoc, addDoc }}
		>
			{children}
		</SelectedDocsContext.Provider>
	);
}

export function useSelectedDocs() {
	const context = useContext(SelectedDocsContext);
	if (context === undefined) {
		throw new Error(
			'useSelectedDocs must be used within a SelectedDocsProvider'
		);
	}
	return context;
}

'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FileViewContextType {
	selectedFile: { fileId: string; fileName: string; chatId: string } | null;
	setSelectedFile: (
		file: { fileId: string; fileName: string; chatId: string } | null
	) => void;
	toggleFile: (file: {
		fileId: string;
		fileName: string;
		chatId: string;
	}) => void;
}

const FileViewContext = createContext<FileViewContextType | undefined>(
	undefined
);

export function FileViewProvider({ children }: { children: ReactNode }) {
	const [selectedFile, setSelectedFile] = useState<{
		fileId: string;
		fileName: string;
		chatId: string;
	} | null>(null);

	const toggleFile = (file: {
		fileId: string;
		fileName: string;
		chatId: string;
	}) => {
		setSelectedFile((current) =>
			current?.fileId === file.fileId ? null : file
		);
	};

	return (
		<FileViewContext.Provider
			value={{ selectedFile, setSelectedFile, toggleFile }}
		>
			{children}
		</FileViewContext.Provider>
	);
}

export function useFileView() {
	const context = useContext(FileViewContext);
	if (context === undefined) {
		throw new Error('useFileView must be used within a FileViewProvider');
	}
	return context;
}

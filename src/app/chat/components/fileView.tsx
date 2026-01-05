'use client';
import React, { useEffect, useState } from 'react';
import { useFileView } from '../context/FileViewContext';
import { apiRequest } from '@/lib/api-client';
import PDFViewer from '@embedpdf/react-pdf-viewer';
import { LoaderCircle } from 'lucide-react';

const FileView = () => {
	const { selectedFile } = useFileView();
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!selectedFile) {
			setPdfUrl(null);
			setError(null);
			return;
		}

		const fetchSignedUrl = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await apiRequest<{
					data: {
						signedUrl: string;
						fileName: string;
						expiresIn: number;
					};
				}>(
					`chats/${selectedFile.chatId}/documents/${selectedFile.fileId}/sign`
				);
				setPdfUrl(response.data.signedUrl);
			} catch (err) {
				console.error('Error fetching signed URL:', err);
				setError(
					err instanceof Error
						? err.message
						: 'Failed to load document. Please try again.'
				);
			} finally {
				setLoading(false);
			}
		};

		fetchSignedUrl();
	}, [selectedFile]);

	if (!selectedFile) {
		return null;
	}

	if (loading) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<LoaderCircle className="size-8 animate-spin text-primary" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<p className="text-red-500 text-sm">{error}</p>
			</div>
		);
	}

	if (!pdfUrl) {
		return null;
	}

	return (
		<div className="w-full h-full">
			<PDFViewer
				config={{
					src: pdfUrl,
				}}
				style={{ width: '100%', height: '100%' }}
			/>
		</div>
	);
};

export default FileView;

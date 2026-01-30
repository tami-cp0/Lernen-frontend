'use client';
import React, { useEffect, useState } from 'react';
import { useFileView } from '../context/FileViewContext';
import { apiRequest } from '@/lib/api-client';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import dynamic from 'next/dynamic';

// Dynamically import PDF components to prevent SSR
const PDFHeader = dynamic(() => import('./PDFHeader'), { ssr: false });
const PDFViewer = dynamic(() => import('./PDFViewer'), { ssr: false });

const FileView = () => {
	const { selectedFile, setCurrentPage, setPdfDocument } = useFileView();
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [numPages, setNumPages] = useState<number>(0);
	const [pageNumber, setPageNumber] = useState<number>(1);
	const [isDocumentReady, setIsDocumentReady] = useState<boolean>(false);

	// Configure PDF.js worker on client side only
	useEffect(() => {
		if (typeof window !== 'undefined') {
			import('react-pdf').then((module) => {
				module.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${module.pdfjs.version}/build/pdf.worker.min.mjs`;
			});
		}
	}, []);

	useEffect(() => {
		if (!selectedFile) {
			setPdfUrl(null);
			setError(null);
			setIsDocumentReady(false);
			return;
		}

		const fetchSignedUrl = async () => {
			setLoading(true);
			setError(null);
			setPdfUrl(null); // Clear previous URL
			setIsDocumentReady(false);
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

				if (response.data.signedUrl) {
					setPdfUrl(response.data.signedUrl);
				} else {
					throw new Error('No signed URL received');
				}
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
				{/* no need for a loader <LoaderCircle className="size-8 animate-spin text-primary" /> */}
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
		return (
			<div className="w-full h-full flex items-center justify-center">
				<p className="text-gray-500 text-sm">Loading document...</p>
			</div>
		);
	}

	const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
		setNumPages(numPages);
		setPageNumber(1);
		setCurrentPage(1);
		setIsDocumentReady(true);
	};

	const handleLoadError = (error: Error) => {
		console.error('PDF load error:', error);
		setError('Failed to load PDF document');
		setIsDocumentReady(false);
	};

	const handlePageChange = (page: number) => {
		setPageNumber(page);
		setCurrentPage(page);
	};

	const handleDocumentLoad = (pdf: PDFDocumentProxy) => {
		setPdfDocument(pdf);
	};

	return (
		<div className="w-full h-full relative flex flex-col">
			<PDFHeader pageNumber={pageNumber} numPages={numPages} />
			<PDFViewer
				pdfUrl={pdfUrl}
				numPages={numPages}
				onLoadSuccess={onDocumentLoadSuccess}
				onLoadError={handleLoadError}
				isDocumentReady={isDocumentReady}
				onPageChange={handlePageChange}
				onDocumentLoad={handleDocumentLoad}
			/>
		</div>
	);
};

export default FileView;

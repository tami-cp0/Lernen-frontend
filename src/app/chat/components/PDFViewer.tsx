import React, {
	useEffect,
	useMemo,
	useState,
	useRef,
	useCallback,
} from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { LoaderCircle } from 'lucide-react';

interface PDFViewerProps {
	pdfUrl: string;
	numPages: number;
	onLoadSuccess: (data: { numPages: number }) => void;
	onLoadError: (error: Error) => void;
	isDocumentReady: boolean;
	onPageChange?: (pageNumber: number) => void;
	onDocumentLoad?: (pdf: PDFDocumentProxy) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
	pdfUrl,
	numPages,
	onLoadSuccess,
	onLoadError,
	isDocumentReady,
	onPageChange,
	onDocumentLoad,
}) => {
	const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([1]));
	const [currentPage, setCurrentPage] = useState<number>(1);
	const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
	const observerRef = useRef<IntersectionObserver | null>(null);

	useEffect(() => {
		if (isDocumentReady) {
			setLoadedPages(new Set([1]));
			setCurrentPage(1);
		}
	}, [isDocumentReady]);

	// Intersection Observer to track visible page
	useEffect(() => {
		if (!isDocumentReady) return;

		observerRef.current = new IntersectionObserver(
			(entries) => {
				// Find the page with the most visibility
				let maxRatio = 0;
				let visiblePage = currentPage;

				entries.forEach((entry) => {
					if (
						entry.isIntersecting &&
						entry.intersectionRatio > maxRatio
					) {
						maxRatio = entry.intersectionRatio;
						const pageNum = Number(
							entry.target.getAttribute('data-page-number')
						);
						if (pageNum) {
							visiblePage = pageNum;
						}
					}
				});

				if (visiblePage !== currentPage) {
					setCurrentPage(visiblePage);
					onPageChange?.(visiblePage);
				}
			},
			{
				threshold: [0, 0.25, 0.5, 0.75, 1],
				rootMargin: '-10% 0px -10% 0px',
			}
		);

		// Observe all page elements
		pageRefs.current.forEach((element) => {
			if (element) {
				observerRef.current?.observe(element);
			}
		});

		return () => {
			observerRef.current?.disconnect();
		};
	}, [isDocumentReady, currentPage, onPageChange]);

	const setPageRef = useCallback(
		(pageNumber: number, element: HTMLDivElement | null) => {
			if (element) {
				pageRefs.current.set(pageNumber, element);
				if (observerRef.current && isDocumentReady) {
					observerRef.current.observe(element);
				}
			} else {
				pageRefs.current.delete(pageNumber);
			}
		},
		[isDocumentReady]
	);

	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const container = e.currentTarget;
		const scrollTop = container.scrollTop;
		const scrollHeight = container.scrollHeight;
		const clientHeight = container.clientHeight;

		// Load next page when near bottom (within 500px)
		if (
			scrollHeight - scrollTop - clientHeight < 1000 &&
			loadedPages.size < numPages
		) {
			const nextPage = loadedPages.size + 1;
			setLoadedPages((prev) => new Set([...prev, nextPage]));
		}
	};

	// Memoize the file prop to prevent unnecessary reloads
	const fileConfig = useMemo(
		() => ({
			url: pdfUrl || '',
			withCredentials: false,
		}),
		[pdfUrl]
	);

	// Memoize the options prop to prevent unnecessary reloads
	const documentOptions = useMemo(
		() => ({
			cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
			standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
			withCredentials: false,
			// Enable HTTP range requests for faster initial loading
			disableAutoFetch: false, // Allow fetching pages on-demand
			disableStream: false, // Enable streaming
		}),
		[]
	);

	const pagesToRender = Array.from(loadedPages).sort((a, b) => a - b);

	return (
		<div
			className="flex-1 h-full overflow-auto flex justify-center items-start hidden-scrollbar md:custom-scrollbar"
			onScroll={handleScroll}
		>
			<Document
				file={fileConfig}
				onLoadSuccess={(pdf) => {
					onLoadSuccess(pdf);
					onDocumentLoad?.(pdf as unknown as PDFDocumentProxy);
				}}
				onLoadError={onLoadError}
				loading={
					<div className="mt-[60%] h-full w-full flex items-center justify-center">
						<div className="doc-loader">
							<span className="bar"></span>
							<span className="bar"></span>
							<span className="bar"></span>
						</div>
					</div>
				}
				error={
					<div className="text-red-500 p-4 bg-red-50 rounded">
						Failed to load PDF. Please try again.
					</div>
				}
				options={documentOptions}
			>
				<div className="flex flex-col gap-4">
					{isDocumentReady &&
						pagesToRender.map((pageNumber) => (
							<div
								key={pageNumber}
								ref={(el) => setPageRef(pageNumber, el)}
								data-page-number={pageNumber}
							>
								<Page
									pageNumber={pageNumber}
									width={600}
									renderTextLayer={true}
									renderAnnotationLayer={false}
									loading={
										<div className="flex items-center justify-center p-8 min-h-[800px] border-2 border-dashed border-gray-300">
											<LoaderCircle className="size-6 animate-spin text-blue-500" />
										</div>
									}
									className="shadow-lg"
								/>
							</div>
						))}
					{isDocumentReady && loadedPages.size < numPages && (
						<div className="flex items-center justify-center p-4 text-gray-500">
							{/* <LoaderCircle className="size-5 animate-spin mr-2" />
							Loading more pages... */}
						</div>
					)}
				</div>
			</Document>
		</div>
	);
};

export default PDFViewer;

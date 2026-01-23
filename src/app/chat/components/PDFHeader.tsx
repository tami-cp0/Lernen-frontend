import React from 'react';

interface PDFHeaderProps {
	pageNumber: number;
	numPages: number;
}

const PDFHeader: React.FC<PDFHeaderProps> = ({ pageNumber, numPages }) => {
	return (
		<div className="flex items-center justify-between absolute top-3 w-full pr-4 pl-4 z-1000 bg-transparent">
			<p className="text-sm  font-sans text-[#f5f5f5] p-2 px-3 rounded-full bg-background/95 backdrop-blur-md">
				Page {pageNumber} of {numPages}
			</p>
		</div>
	);
};

export default PDFHeader;

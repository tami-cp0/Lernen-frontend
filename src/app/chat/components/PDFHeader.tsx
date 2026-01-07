import React from 'react';

interface PDFHeaderProps {
	pageNumber: number;
	numPages: number;
}

const PDFHeader: React.FC<PDFHeaderProps> = ({ pageNumber, numPages }) => {
	return (
		<div className="flex items-center justify-between absolute top-3 w-full pr-4 pl-4 z-1000 bg-transparent">
			<p className="text-sm  font-sans text-[#f5f5f5] bg-[#1C1C1C] p-2 rounded-full shadow-[0_0_10px_rgba(153,225,29,0.2)]">
				Page {pageNumber} of {numPages}
			</p>
		</div>
	);
};

export default PDFHeader;

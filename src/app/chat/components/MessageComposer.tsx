'use client';
import React, { useState } from 'react';
import { Plus, MoveUp, Paperclip, Trash2 } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function MessageComposer() {
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;

		const newFiles = Array.from(files);
		const combined = [...attachedFiles, ...newFiles];

		// Limit to 3 files
		if (combined.length > 3) {
			alert('You can only attach up to 3 files');
			setAttachedFiles(combined.slice(0, 3));
		} else {
			setAttachedFiles(combined);
		}
	};

	const handleAttachClick = () => {
		setIsPopoverOpen(false);
		setIsDialogOpen(true);
	};

	return (
		<section className="sticky bottom-0 w-[80%] max-w-200 flex items-center gap-4 border-0 rounded-[28px] bg-background px-2 py-3 shadow-[0_0_10px_rgba(0,0,0,0.7)]">
			<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
				<PopoverTrigger className="h-7">
					<button className="cursor-pointer">
						<Plus
							className={`transition-transform duration-300 ${
								isPopoverOpen ? 'rotate-45' : 'rotate-0'
							}`}
							color="white"
							strokeWidth={1}
						/>
					</button>
				</PopoverTrigger>
				<PopoverContent
					side="top"
					sideOffset={20}
					avoidCollisions={true}
					className="translate-x-[30px] bg-background w-auto border-0 px-4 py-2 flex flex-col justify-start items-center gap-2"
				>
					<Button
						variant={'ghost'}
						className="p-0!"
						onClick={handleAttachClick}
					>
						<Paperclip color="white" strokeWidth={1} />
						<p>Attach</p>
					</Button>
				</PopoverContent>
			</Popover>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="bg-background border-0">
					<DialogHeader>
						<DialogTitle>Attach Files</DialogTitle>
						<DialogDescription>
							Select up to 3 PDF files to attach.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-4 py-4">
						<input
							id="file-input"
							type="file"
							multiple
							accept=".pdf"
							onChange={handleFileSelect}
							className="hidden"
						/>

						<Button
							variant="outline"
							onClick={() =>
								document.getElementById('file-input')?.click()
							}
							className="w-full"
						>
							<Paperclip className="mr-2" size={16} />
							Choose Files ({attachedFiles.length}/3)
						</Button>

						{attachedFiles.length > 0 && (
							<div className="flex flex-col gap-2">
								<p className="text-sm text-muted-foreground">
									Selected files:
								</p>
								{attachedFiles.map((file, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-2 rounded bg-secondary"
									>
										<span className="text-sm truncate">
											{file.name}
										</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												setAttachedFiles((files) =>
													files.filter(
														(_, i) => i !== index
													)
												)
											}
											className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
										>
											<Trash2 size={16} />
										</Button>
									</div>
								))}
							</div>
						)}

						<Button
							onClick={() => setIsDialogOpen(false)}
							disabled={attachedFiles.length === 0}
						>
							Done
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<TextareaAutosize
				placeholder="Generate..."
				minRows={1}
				maxRows={7}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						document.getElementById('send-btn')!.click();
					}
				}}
				className="resize-none flex-1 h-7 max-h-[200px] overflow-y-auto text-foreground placeholder:text-secondary-lighter focus:outline-none focus:ring-0 appearance-none mr-11 hidden-scrollbar md:custom-scrollbar"
			/>

			<button
				id="send-btn"
				className="absolute right-1 h-9 w-9 rounded-full flex justify-center items-center bg-primary cursor-pointer"
			>
				<MoveUp className="h-4.5" color="black" strokeWidth={2} />
			</button>
		</section>
	);
}

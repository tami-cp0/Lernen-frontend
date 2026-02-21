'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import { clearAuthTokens } from '@/lib/api-client';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { TbLogout } from 'react-icons/tb';
import { FaPlus } from 'react-icons/fa6';
import { IoMdRemove } from 'react-icons/io';
import { MdOutlineOpenInNew } from 'react-icons/md';
import { PanelsTopLeft, Plus, LoaderCircle, X, Menu } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { useFileView } from '../context/FileViewContext';
import { useSelectedDocs } from '../context/SelectedDocsContext';
import { useSidebar } from '../context/SidebarContext';
import { useChatContext } from '../context/ChatContext';
import { toast } from 'sonner';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { TooltipArrow } from '@radix-ui/react-tooltip';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from '@/components/ui/dialog';

type Chat = {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
};

// type User = {
// 	id: string;
// 	email: string;
// 	firstName: string;
// 	lastName: string;
// };

type Document = {
	id: string;
	chatId: string;
	userId: string;
	fileName: string;
	fileType: string;
	fileSize: number;
	createdAt: string;
	updatedAt: string;
};

export default function Sidebar() {
	const router = useRouter();
	const pathname = usePathname();
	const { selectedFile, toggleFile } = useFileView();
	const { selectedDocs, toggleDoc, addDoc } = useSelectedDocs();
	const { isSidebarExpanded, setIsSidebarExpanded } = useSidebar();
	const { createChatIfNeeded, resetChat } = useChatContext();
	const [currentChat, setCurrentChat] = useState<string | null>(null);
	const [chats, setChats] = useState<Chat[]>([]);
	const { user } = useUser();
	const [documents, setDocuments] = useState<Document[]>([]);
	const [uploadingFiles, setUploadingFiles] = useState<
		{
			fileName: string;
			documentId?: string;
			status?: 'requesting' | 'uploading' | 'processing';
		}[]
	>([]);
	const [removingFiles, setRemovingFiles] = useState<string[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDocDialogOpen, setIsDocDialogOpen] = useState<boolean>(false);

	// Consolidated fetch function to avoid duplication
	const fetchChats = useCallback(async () => {
		try {
			const chatsData = await apiRequest<
				{ data: { chats: Chat[] } } | { chats: Chat[] }
			>('chats');
			const chatsArray =
				'data' in chatsData ? chatsData.data.chats : chatsData.chats;
			setChats(chatsArray || []);
		} catch (error) {
			console.error('Error fetching sidebar chats:', error);
			setChats([]);
		}
	}, []);

	// Fetch chats on mount and when stream completes
	useEffect(() => {
		fetchChats();

		// Listen for chat-created to set current chat (for highlighting)
		const handleChatCreated = (event: Event) => {
			const customEvent = event as CustomEvent<{ chatId: string }>;
			const newChatId = customEvent.detail?.chatId;
			if (newChatId) {
				setCurrentChat(newChatId);
			}
		};

		// Listen for stream-complete to refetch and get actual title
		const handleStreamComplete = () => {
			// Refetch after stream completes to get the generated title
			setTimeout(() => {
				fetchChats();
			}, 300);
		};

		window.addEventListener('chat-created', handleChatCreated);
		window.addEventListener('stream-complete', handleStreamComplete);

		return () => {
			window.removeEventListener('chat-created', handleChatCreated);
			window.removeEventListener('stream-complete', handleStreamComplete);
		};
	}, [fetchChats]);

	// Fetch documents when chat ID changes
	useEffect(() => {
		const chatId = pathname?.match(/\/chat\/([^\/]+)/)?.[1];

		const fetchDocuments = async () => {
			if (chatId && chatId !== 'new') {
				setCurrentChat(chatId);
				try {
					// Use documents-only endpoint instead of fetching full messages
					const data = await apiRequest<{
						data: {
							documents: Document[];
						};
					}>(`chats/${chatId}/documents`);
					setDocuments(data.data.documents || []);
				} catch (error) {
					console.error('Error fetching documents:', error);
					setDocuments([]);
				}
			} else {
				setDocuments([]);
				setCurrentChat(null);
			}
		};

		fetchDocuments();

		// Listen for document upload events
		const handleDocumentsUploaded = () => {
			fetchDocuments();
		};
		window.addEventListener('documents-uploaded', handleDocumentsUploaded);

		return () => {
			window.removeEventListener(
				'documents-uploaded',
				handleDocumentsUploaded
			);
		};
	}, [pathname]);

	async function handleLogout() {
		try {
			await clearAuthTokens();
			router.push('/sign-in');
		} catch (error) {
			console.error('Logout error:', error);
		}
	}

	async function handleRemoveFile(fileId: string) {
		const chatId = pathname?.match(/\/chat\/([^\/]+)/)?.[1];
		if (!chatId) return;

		// Add to removing state
		setRemovingFiles((prev) => [...prev, fileId]);

		try {
			// Call API first
			await apiRequest(`chats/${chatId}/remove-document`, 'DELETE', {
				documentId: fileId,
			});

			// Only remove from UI after successful API response
			setDocuments((prev) => prev.filter((doc) => doc.id !== fileId));

			// Also remove from selected docs if it was selected
			if (selectedDocs.includes(fileId)) {
				toggleDoc(fileId);
			}

			toast.success('Document removed');
		} catch (error) {
			console.error('Error removing file:', error);
			toast.error('Failed to remove file');
		} finally {
			// Remove from removing state
			setRemovingFiles((prev) => prev.filter((id) => id !== fileId));
		}
	}

	function handleOpenFile(fileId: string, fileName: string) {
		// feature not available on mobile devices
		const isBelowlg = !window.matchMedia('(min-width: 1024px)').matches;

		if (isBelowlg) {
			setIsDocDialogOpen(true);
		} else {
			const chatId = pathname?.match(/\/chat\/([^\/]+)/)?.[1];
			if (!chatId) return;
			toggleFile({ fileId, fileName, chatId });
		}
	}

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		let chatId = pathname?.match(/\/chat\/([^\/]+)/)?.[1];

		// If on 'new' chat, create the chat first
		if (chatId === 'new') {
			const newChatId = await createChatIfNeeded();
			if (!newChatId) {
				toast.error('Failed to create chat');
				return;
			}
			chatId = newChatId;
		}

		if (!chatId) {
			toast.error('Please create a chat first');
			return;
		}

		const fileArray = Array.from(files);
		let currentDocCount = documents.length;

		// Check if uploading files would exceed limit
		const remainingSlots = 5 - currentDocCount;
		if (fileArray.length > remainingSlots) {
			const fileWord = remainingSlots === 1 ? 'file' : 'files';
			toast.error(
				`Upload limit exceeded: You can only upload ${remainingSlots} more ${fileWord}`
			);
			return;
		}

		// Upload each file using S3 pre-signed URL flow
		for (const file of fileArray) {
			// Check if limit reached
			if (currentDocCount >= 5) {
				toast.error('Document limit reached: Maximum 5 files per chat');
				break;
			}

			// Check file type (PDF only)
			if (file.type !== 'application/pdf') {
				toast.error(`${file.name}: Only PDF files are allowed`);
				continue;
			}

			// Check file size (10MB)
			const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
			if (file.size > 10 * 1024 * 1024) {
				toast.error(
					`${file.name}: File size (${fileSizeMB}MB) exceeds 10MB limit`
				);
				continue;
			}

			// Add to uploading state with 'requesting' status
			setUploadingFiles((prev) => [
				...prev,
				{ fileName: file.name, status: 'requesting' },
			]);

			let documentId: string | null = null;

			try {
				// Step 1: Request pre-signed upload URL from backend
				const urlResponse = await apiRequest<{
					message: string;
					data: {
						uploadUrl: string;
						documentId: string;
						s3Key: string;
						expiresIn: number;
					};
				}>(`chats/${chatId}/request-upload-url`, 'POST', {
					fileName: file.name,
					fileType: file.type,
					fileSize: file.size,
				});

				const { uploadUrl, documentId: docId } = urlResponse.data;
				documentId = docId;

				// Update state with documentId and 'uploading' status
				setUploadingFiles((prev) =>
					prev.map((f) =>
						f.fileName === file.name
							? { ...f, documentId: docId, status: 'uploading' }
							: f
					)
				);

				// Step 2: Upload file directly to S3
				const s3Response = await fetch(uploadUrl, {
					method: 'PUT',
					headers: {
						'Content-Type': file.type,
					},
					body: file,
				});

				if (!s3Response.ok) {
					throw new Error('Failed to upload to S3');
				}

				// Update state to 'processing' status
				setUploadingFiles((prev) =>
					prev.map((f) =>
						f.fileName === file.name
							? { ...f, status: 'processing' }
							: f
					)
				);

				// Step 3: Notify backend to process the uploaded document
				const processResponse = await apiRequest<{
					message: string;
					data: {
						document: {
							id: string;
							fileName: string;
							fileType: string;
							fileSize: number;
						};
					};
				}>(`chats/${chatId}/process-uploaded-document`, 'POST', {
					documentId: docId,
				});

				// Handle successful upload
				if (processResponse.data?.document) {
					// Refresh documents list
					const data = await apiRequest<{
						data: {
							documents: Document[];
						};
					}>(`chats/${chatId}/documents`);
					setDocuments(data.data.documents || []);
					currentDocCount = data.data.documents.length;

					// Auto-select newly uploaded document
					addDoc(processResponse.data.document.id);
				}
			} catch (error: unknown) {
				console.error(`Error uploading ${file.name}:`, error);

				// Determine which step failed for better error messages
				if (
					error instanceof TypeError &&
					error.message === 'Failed to fetch'
				) {
					toast.error(
						'Please check your internet connection and try again'
					);
				} else if (
					error instanceof Error &&
					error.message === 'Failed to upload to S3'
				) {
					toast.error(`${file.name}: Failed to upload file`);
				} else if (error instanceof Error) {
					// Check if it's a processing error (step 3)
					if (documentId) {
						toast.error(
							`${file.name}: Processing failed. Please try again.`
						);
					} else {
						toast.error(`${file.name}: Upload failed`);
					}
				} else {
					toast.error('Failed to upload files');
				}
			} finally {
				// Remove from uploading state
				setUploadingFiles((prev) =>
					prev.filter((f) => f.fileName !== file.name)
				);
			}
		}

		// Reset file input
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	return (
		<>
			<Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
				<DialogOverlay className="bg-secondary-lighter/10 backdrop-blur-xs" />
				<DialogContent
					showCloseButton={false}
					className="border-0 w-[70%] bg-background/80 z-1000 backdrop-blur-md "
				>
					<DialogHeader>
						<DialogTitle className="text-start">
							Unavailable
						</DialogTitle>
						<DialogDescription className="text-start">
							For the best experience, this feature is available
							on larger screens.
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
			<aside
				className={`z-10 bg-background relative flex flex-col transition-none md:transition-all duration-300 ${
					isSidebarExpanded
						? 'w-70 max-w-70 h-screen-safe justify-between items-start px-4'
						: 'md:w-[50px] md:h-screen items-center'
				}`}
			>
				<div className="w-full">
					{isSidebarExpanded ? (
						<div className="flex flex-row items-center justify-between py-3 mb-6 w-full">
							<Image
								src="/lernen-logo.svg"
								alt="Lernen logo"
								width={30}
								height={30}
							/>

							{/* button for mobile */}
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									setIsSidebarExpanded(!isSidebarExpanded)
								}
								className="md:hidden hover:bg-[#252525] w-8 h-8 cursor-e-resize"
							>
								<X size={20} className="text-[#777777]" />
							</Button>

							{/* button not for mobile devices */}
							<Tooltip>
								<TooltipTrigger className="hidden md:block">
									<Button
										variant="ghost"
										size="icon"
										onClick={() =>
											setIsSidebarExpanded(
												!isSidebarExpanded
											)
										}
										className="hover:bg-[#252525] cursor-e-resize"
									>
										<PanelsTopLeft className="text-[#777777] size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent
									side="right"
									className="bg-[#252525] text-foreground"
								>
									<p>Close sidebar</p>
									<TooltipArrow />
								</TooltipContent>
							</Tooltip>
						</div>
					) : (
						<div className="py-3 flex justify-center mb-6">
							{/* button for mobile  */}
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									setIsSidebarExpanded(!isSidebarExpanded)
								}
								className="md:hidden hover:bg-[#252525] w-8 h-8 cursor-e-resize absolute left-5 md:left-0 md:relative z-20"
							>
								<Menu
									size={20}
									className="text-secondary-lighter"
								/>
							</Button>

							{/* not for mobile devices */}
							<Tooltip>
								<TooltipTrigger className="hidden md:block">
									<Button
										variant="ghost"
										size="icon"
										onClick={() =>
											setIsSidebarExpanded(
												!isSidebarExpanded
											)
										}
										className="hover:bg-[#252525] w-8 h-8 cursor-e-resize"
									>
										<PanelsTopLeft className="text-[#777777] size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent
									side="right"
									className="text-foreground "
								>
									<p>Open sidebar</p>
									<TooltipArrow />
								</TooltipContent>
							</Tooltip>
						</div>
					)}
				</div>
				<Button
					onClick={() => {
						resetChat();
						router.push(`/chat/new`);
					}}
					variant={'outline'}
					className="hover:bg-background h-fit border-0 bg-background justify-start items-center px-0! my-0"
				>
					{isSidebarExpanded ? (
						<>
							<FaPlus className="rounded-full bg-primary fill-background size-4 p-0.5 cursor-pointer" />
							<span className="text-md text-primary font-mono">
								New chat
							</span>
						</>
					) : (
						<Tooltip>
							<TooltipTrigger className="hidden md:block">
								<FaPlus className="rounded-full bg-primary fill-background size-4 p-0.5" />
							</TooltipTrigger>
							<TooltipContent
								side="right"
								className="text-foreground"
							>
								<p>New chat</p>
								<TooltipArrow />
							</TooltipContent>
						</Tooltip>
					)}
				</Button>
				{isSidebarExpanded && (
					<section className="h-fit mt-2 flex w-full flex-col gap-2">
						<div className="flex flex-row justify-between items-center w-full border-b-1 border-[#252525] py-2">
							<h1 className="font-mono text-sm text-[#c7c7c7] whitespace-nowrap">
								Sources
							</h1>
							<p className="text-xs font-mono text-[#c7c7c7]">
								{documents.length}/5
							</p>
						</div>
						<input
							ref={fileInputRef}
							type="file"
							accept=".pdf,application/pdf"
							multiple
							onChange={handleFileUpload}
							className="hidden"
							disabled={documents.length >= 5}
						/>
						<div
							onClick={() =>
								documents.length < 5 &&
								fileInputRef.current?.click()
							}
							className={`transition-none mt-2 mb-1 flex gap-4 border-1 justify-center items-center font-sans py-2 text-sm border-[#252525] rounded-4xl ${
								documents.length >= 5
									? 'opacity-50 cursor-not-allowed'
									: 'cursor-pointer hover:bg-[#252525]'
							}`}
						>
							<Plus
								color="white"
								strokeWidth={2}
								className="h-4"
							/>
							<p className="shrink-0 text-md">Add sources</p>
						</div>
						{uploadingFiles.map((fileInfo) => (
							<div
								key={fileInfo.fileName}
								className="flex flex-row h-fit w-full rounded-md justify-start items-center gap-3 bg-[#252525] p-0.5 px-2"
							>
								<div className="w-4 h-4 flex items-center justify-center">
									<LoaderCircle className="size-4 animate-spin text-primary" />
								</div>
								<div className="flex flex-col flex-1 overflow-hidden">
									<p className="text-foreground font-sans text-sm whitespace-nowrap overflow-hidden text-ellipsis">
										{fileInfo.fileName?.split('.')[0] ||
											fileInfo.fileName}
									</p>
									<p className="text-muted-foreground font-sans text-xs">
										{fileInfo.status === 'processing'
											? 'Processing...'
											: fileInfo.status === 'uploading'
											? 'Uploading...'
											: 'Preparing...'}
									</p>
								</div>
								<Button
									variant={'ghost'}
									size={'sm'}
									className="text-red-500/30 hover:text-red-500 cursor-pointer p-0!"
									onClick={async () => {
										// If document has been uploaded and has an ID, call API to remove it
										if (fileInfo.documentId) {
											const chatId =
												pathname?.match(
													/\/chat\/([^\/]+)/
												)?.[1];
											if (!chatId) return;

											try {
												await apiRequest(
													`chats/${chatId}/remove-document`,
													'DELETE',
													{
														documentId:
															fileInfo.documentId,
													}
												);

												// Remove from uploading state after successful API call
												setUploadingFiles((prev) =>
													prev.filter(
														(f) =>
															f.fileName !==
															fileInfo.fileName
													)
												);

												// Refresh documents list using documents-only endpoint
												const data = await apiRequest<{
													data: {
														documents: Document[];
													};
												}>(`chats/${chatId}/documents`);
												setDocuments(
													data.data.documents || []
												); // Also remove from selected docs if it was selected
												if (
													selectedDocs.includes(
														fileInfo.documentId
													)
												) {
													toggleDoc(
														fileInfo.documentId
													);
												}

												toast.success(
													'Document removed'
												);
											} catch (error) {
												console.error(
													'Error removing document:',
													error
												);
												toast.error(
													'Failed to remove document'
												);
											}
										} else {
											// If still uploading (no documentId yet), just remove from UI
											setUploadingFiles((prev) =>
												prev.filter(
													(f) =>
														f.fileName !==
														fileInfo.fileName
												)
											);
										}
									}}
								>
									<IoMdRemove className="size-4" />
								</Button>
								<Button
									variant={'ghost'}
									size={'sm'}
									className="text-primary/30 opacity-50 cursor-not-allowed p-0!"
									disabled
								>
									<MdOutlineOpenInNew className="size-4 m-0!" />
								</Button>
							</div>
						))}
						{documents.length > 0 &&
							documents.map((file) => {
								const fileOpened =
									selectedFile?.fileId === file.id;
								const isSelected = selectedDocs.includes(
									file.id
								);
								const isRemoving = removingFiles.includes(
									file.id
								);
								const isAnyRemoving = removingFiles.length > 0;
								return (
									<div
										key={file.id}
										className="flex flex-row h-fit w-full rounded-md justify-start items-center gap-3 bg-[#252525] p-0.5 px-2"
									>
										{isRemoving ? (
											<div className="w-4 h-4 flex items-center justify-center">
												<LoaderCircle className="size-4 animate-spin text-primary" />
											</div>
										) : (
											<Checkbox
												checked={isSelected}
												onCheckedChange={() =>
													toggleDoc(file.id)
												}
												disabled={isAnyRemoving}
												className={`border-secondary-lighter rounded-none data-[state=checked]:bg-primary data-[state=checked]:border-primary ${
													isAnyRemoving
														? 'opacity-50 cursor-not-allowed'
														: ''
												}`}
											/>
										)}
										<p className="text-foreground font-sans text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
											{file.fileName?.split('.')[0] ||
												file.fileName}
										</p>
										<Button
											variant={'ghost'}
											size={'sm'}
											className={`text-red-500/30 hover:text-red-500 cursor-pointer p-0! ${
												isAnyRemoving
													? 'opacity-50 cursor-not-allowed'
													: ''
											}`}
											onClick={() =>
												!isAnyRemoving &&
												handleRemoveFile(file.id)
											}
											disabled={isAnyRemoving}
										>
											<IoMdRemove className="size-4" />
										</Button>
										<Button
											variant={'ghost'}
											size={'sm'}
											className={` ${
												fileOpened
													? 'text-primary'
													: 'text-primary/30 hover:text-primary'
											} cursor-pointer p-0! ${
												isAnyRemoving
													? 'opacity-50 cursor-not-allowed'
													: ''
											}`}
											onClick={() =>
												!isAnyRemoving &&
												handleOpenFile(
													file.id,
													file.fileName
												)
											}
											disabled={isAnyRemoving}
										>
											<MdOutlineOpenInNew className="size-4 m-0!" />
										</Button>
									</div>
								);
							})}
					</section>
				)}
				{isSidebarExpanded && (
					<section className="relative flex-1 w-full flex flex-col max-h-full overflow-hidden mt-5">
						<h1 className="font-mono h-8 text-sm text-[#c7c7c7] border-b-1 border-[#252525] flex items-center py-2">
							Recents
						</h1>
						{/* <div className="absolute top-6 left-0 right-0 h-6 w-63 bg-gradient-to-t from-transparent to-background pointer-events-none"></div> */}
						<div className="hidden-scrollbar md:custom-scrollbar flex-1 pb-2 overflow-y-auto overflow-x-hidden">
							{chats.length === 0 ? (
								<p className="text-secondary-lighter text-sm px-3 py-2">
									No chats
								</p>
							) : (
								chats.map((chat) => (
									<Link
										key={chat.id}
										href={`/chat/${chat.id}`}
										onClick={() => {
											setCurrentChat(chat.id);
											// Close sidebar only on mobile devices (below md breakpoint)
											const isBelowMd =
												window.matchMedia(
													'(max-width: 767px)'
												).matches;
											if (isBelowMd) {
												setIsSidebarExpanded(false);
											}
										}}
										className={`
									text-foreground font-sans text-md whitespace-nowrap overflow-hidden text-ellipsis
									cursor-pointer mt-1 rounded-md px-3 py-1.5 w-[95%] block
									${currentChat === chat.id ? 'bg-[#2e2e2e]' : 'hover:bg-[#252525]'}
								`}
									>
										{chat.title}
									</Link>
								))
							)}
						</div>
						<div className="absolute bottom-0 left-0 right-0 h-6 w-63 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
					</section>
				)}
				{!isSidebarExpanded && <div className="flex-1"></div>}
				<Popover>
					<PopoverTrigger
						className={`transition-none border-[#252525] border-t-1 w-full h-fit ${
							isSidebarExpanded ? 'p-2' : 'p-1 hidden md:block'
						}`}
					>
						<div
							className={`flex flex-row h-full min-w-full rounded-md items-center cursor-pointer hover:bg-[#212121] ${
								isSidebarExpanded
									? 'justify-start gap-3 p-2'
									: 'justify-center p-1'
							}`}
						>
							<p className="w-8 h-8 bg-secondary-lighter rounded-full flex-shrink-0"></p>
							{isSidebarExpanded && user && (
								<p className="text-foreground text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
									{`${user.firstName} ${user.lastName}`}
								</p>
							)}
						</div>
					</PopoverTrigger>
					<PopoverContent
						side="top"
						className="md:bg-background w-65 border-0 p-3 flex flex-col justify-start items-center gap-2"
					>
						<Button
							variant={'outline'}
							className="w-full justify-start"
							onClick={handleLogout}
						>
							<TbLogout color="red" />
							<span className="text-red-600">Logout</span>
						</Button>
					</PopoverContent>
				</Popover>
			</aside>
		</>
	);
}

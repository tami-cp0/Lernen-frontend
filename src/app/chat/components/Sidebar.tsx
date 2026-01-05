'use client';
import { useState, useEffect, useRef } from 'react';
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
import { PanelsTopLeft, Plus, LoaderCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { useFileView } from '../context/FileViewContext';
import { useSelectedDocs } from '../context/SelectedDocsContext';
import { toast } from 'sonner';

type Chat = {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
};

type User = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
};

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
	const [currentChat, setCurrentChat] = useState<string | null>(null);
	const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
	const [chats, setChats] = useState<Chat[]>([]);
	const [user, setUser] = useState<User | null>(null);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Fetch chats and user data on mount
	useEffect(() => {
		const fetchData = async () => {
			try {
				const [chatsData, userData] = await Promise.all([
					apiRequest<{ data: { chats: Chat[] } } | { chats: Chat[] }>(
						'chats'
					),
					apiRequest<{ data: { user: User } }>('users/profile'),
				]);
				console.log('Chats data received:', chatsData);

				// Handle both response structures
				const chatsArray =
					'data' in chatsData
						? chatsData.data.chats
						: chatsData.chats;
				console.log('Chats array:', chatsArray);
				setChats(chatsArray || []);
				setUser(userData.data.user);
			} catch (error) {
				console.error('Error fetching sidebar data:', error);
				// Set empty array on error to prevent undefined
				setChats([]);
			}
		};

		fetchData();
	}, []);

	// Refetch chats when pathname changes (new chat created or navigated)
	useEffect(() => {
		const fetchChats = async () => {
			try {
				const chatsData = await apiRequest<
					{ data: { chats: Chat[] } } | { chats: Chat[] }
				>('chats');
				console.log('Refetched chats data:', chatsData);

				// Handle both response structures
				const chatsArray =
					'data' in chatsData
						? chatsData.data.chats
						: chatsData.chats;
				console.log('Refetched chats array:', chatsArray);
				setChats(chatsArray || []);
			} catch (error) {
				console.error('Error fetching chats:', error);
			}
		};

		// Only refetch if we're on a chat page
		if (pathname?.startsWith('/chat/')) {
			fetchChats();
		}
	}, [pathname]);

	// Fetch documents when chat ID changes
	useEffect(() => {
		const chatId = pathname?.match(/\/chat\/([^\/]+)/)?.[1];

		const fetchDocuments = async () => {
			if (chatId && chatId !== 'new') {
				setCurrentChat(chatId);
				try {
					const data = await apiRequest<{
						data: {
							documents: Document[];
						};
					}>(`chats/${chatId}/messages`);
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

		// Optimistically remove from UI first
		setDocuments((prev) => prev.filter((doc) => doc.id !== fileId));

		try {
			await apiRequest(`chats/${chatId}/remove-document`, 'DELETE', {
				documentId: fileId,
			});
		} catch (error) {
			console.error('Error removing file:', error);
			toast.error('Failed to remove file');

			// Refresh documents list on error to restore UI state
			try {
				const data = await apiRequest<{
					data: {
						documents: Document[];
					};
				}>(`chats/${chatId}/messages`);
				setDocuments(data.data.documents || []);
			} catch (refreshError) {
				console.error('Error refreshing documents:', refreshError);
			}
		}
	}

	function handleOpenFile(fileId: string, fileName: string) {
		toggleFile({ fileId, fileName });
	}

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		const chatId = pathname?.match(/\/chat\/([^\/]+)/)?.[1];
		if (!chatId || chatId === 'new') {
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

		// Upload each file separately
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

			// Add to uploading state
			setUploadingFiles((prev) => [...prev, file.name]);

			try {
				const formData = new FormData();
				formData.append('files', file);

				const response = await apiRequest<{
					message: string;
					remainingSlots: number;
					chatId: string;
					successfulUploads: Array<{
						id: string;
						name: string;
					}>;
					failedUploads: Array<{
						name: string;
						reason?: string;
					}>;
				}>(`chats/${chatId}/upload-document`, 'POST', formData);

				// Handle successful upload
				if (
					response.successfulUploads &&
					response.successfulUploads.length > 0
				) {
					// Refresh documents list
					const data = await apiRequest<{
						data: {
							documents: Document[];
						};
					}>(`chats/${chatId}/messages`);
					setDocuments(data.data.documents || []);
					currentDocCount = data.data.documents.length;

					// Auto-select newly uploaded document
					response.successfulUploads.forEach((upload) => {
						addDoc(upload.id);
					});
				}

				// Handle failed upload from backend
				if (
					response.failedUploads &&
					response.failedUploads.length > 0
				) {
					response.failedUploads.forEach((failed) => {
						toast.error(
							`${failed.name}: ${
								failed.reason || 'Upload failed'
							}`
						);
					});
				}
			} catch (error: any) {
				console.error(`Error uploading ${file.name}:`, error);
				toast.error('Failed to upload files');
			} finally {
				// Remove from uploading state
				setUploadingFiles((prev) =>
					prev.filter((name) => name !== file.name)
				);
			}
		}

		// Reset file input
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	return (
		<aside
			className={`h-screen flex flex-col items-start px-4 pt-2 transition-all duration-300 ${
				isSidebarExpanded
					? 'w-90 max-w-90 justify-between'
					: 'w-[50px] px-2'
			}`}
		>
			<div className="flex flex-row items-center gap-3 h-fit py-4 mb-8 w-full">
				{isSidebarExpanded ? (
					<>
						<Image
							src="/lernen-logo.svg"
							alt="Lernen logo"
							width={25}
							height={25}
						/>

						<p className="text-lg font-sans"></p>
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								setIsSidebarExpanded(!isSidebarExpanded)
							}
							className="p-1 hover:bg-[#252525] ml-auto"
						>
							<PanelsTopLeft
								size={20}
								className="text-foreground"
							/>
						</Button>
					</>
				) : (
					<div className="w-full flex justify-center group relative">
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								setIsSidebarExpanded(!isSidebarExpanded)
							}
							className="p-1 hover:bg-transparent relative"
						>
							<Image
								src="/lernen-logo.svg"
								alt="Lernen logo"
								width={28}
								height={28}
								className="group-hover:opacity-0 transition-opacity"
							/>
							<PanelsTopLeft
								size={20}
								className="text-foreground absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity"
							/>
						</Button>
					</div>
				)}
			</div>
			<Button
				onClick={() => {
					// Generate UUID and navigate directly
					const chatId = crypto.randomUUID();
					router.push(`/chat/${chatId}`);
				}}
				variant={'outline'}
				className={`hover:bg-background h-fit bg-background border-0 justify-start items-center px-0! transition-none ${
					isSidebarExpanded ? 'my-0' : 'absolute top-25'
				}`}
			>
				<FaPlus className="rounded-full bg-primary fill-background size-4 p-0.5" />
				{isSidebarExpanded && (
					<span className="text-sm text-primary font-mono">
						New chat
					</span>
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
						className={`mt-2 mb-1 flex gap-4 border-1 justify-center items-center font-sans py-2 text-sm border-[#252525] rounded-4xl ${
							documents.length >= 5
								? 'opacity-50 cursor-not-allowed'
								: 'cursor-pointer hover:bg-[#252525]'
						}`}
					>
						<Plus color="white" strokeWidth={2} className="h-4" />
						Add sources
					</div>
					{uploadingFiles.map((fileName) => (
						<div
							key={fileName}
							className="flex flex-row h-fit w-full rounded-md justify-start items-center gap-3 bg-[#252525] p-0.5 px-2"
						>
							<div className="w-4 h-4 flex items-center justify-center">
								<LoaderCircle className="size-4 animate-spin text-primary" />
							</div>
							<p className="text-foreground font-sans text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
								{fileName?.split('.')[0] || fileName}
							</p>
							<Button
								variant={'ghost'}
								size={'sm'}
								className="text-red-500/30 opacity-50 cursor-not-allowed p-0!"
								disabled
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
							const fileOpened = selectedFile?.fileId === file.id;
							const isSelected = selectedDocs.includes(file.id);
							return (
								<div
									key={file.id}
									className="flex flex-row h-fit w-full rounded-md justify-start items-center gap-3 bg-[#252525] p-0.5 px-2"
								>
									<Checkbox
										checked={isSelected}
										onCheckedChange={() =>
											toggleDoc(file.id)
										}
										className="border-secondary-lighter rounded-none data-[state=checked]:bg-primary data-[state=checked]:border-primary"
									/>
									<p className="text-foreground font-sans text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
										{file.fileName?.split('.')[0] ||
											file.fileName}
									</p>
									<Button
										variant={'ghost'}
										size={'sm'}
										className="text-red-500/30 hover:text-red-500 cursor-pointer p-0!"
										onClick={() =>
											handleRemoveFile(file.id)
										}
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
										} cursor-pointer p-0!`}
										onClick={() =>
											handleOpenFile(
												file.id,
												file.fileName
											)
										}
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
					<h1 className="font-mono h-6 text-sm text-[#c7c7c7]">
						Recents
					</h1>
					{/* <div className="absolute top-6 left-0 right-0 h-6 w-63 bg-gradient-to-t from-transparent to-background pointer-events-none"></div> */}
					<div className="hidden-scrollbar md:custom-scrollbar flex-1 pt-2 overflow-y-auto overflow-x-hidden pb-2">
						{chats.length === 0 ? (
							<p className="text-secondary-lighter text-sm px-3 py-2">
								No chats
							</p>
						) : (
							chats.map((chat) => (
								<Link
									key={chat.id}
									href={`/chat/${chat.id}`}
									onClick={() => setCurrentChat(chat.id)}
									className={`
										text-foreground font-sans text-sm whitespace-nowrap overflow-hidden text-ellipsis
										cursor-pointer mt-1 rounded-md px-3 py-1.5 w-62 block
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
						isSidebarExpanded ? 'p-2' : 'p-1'
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
	);
}

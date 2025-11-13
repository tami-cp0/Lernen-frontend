'use client';
import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
import { AiOutlineFilePdf } from 'react-icons/ai';
import { PanelsTopLeft } from 'lucide-react';
import Image from 'next/image';

export default function Sidebar() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [currentChat, setCurrentChat] = useState<string | null>(null);
	const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

	function handleLogout() {
		// TODO: Implement logout
	}

	function handleRemoveFile(fileId: string) {
		void fileId;
		// TODO: Implement file removal
	}

	function handleOpenFile(fileId: string) {
		const current = new URLSearchParams(searchParams.toString());
		const active = current.get('file');
		if (active === fileId) {
			current.delete('file');
		} else {
			current.set('file', fileId);
		}
		const query = current.toString();
		router.replace(query ? `${pathname}?${query}` : pathname);
	}

	const files = [
		{ fileId: '122', fileName: 'Document name.pdf' },
		{ fileId: '123', fileName: 'Document name.docx' },
	];

	const chats = [
		{ chatId: '121', chatName: 'Chat about document' },
		{ chatId: '123', chatName: 'Chat about document' },
		{ chatId: '124', chatName: 'Chat about document' },
		{ chatId: '125', chatName: 'Chat about document' },
		{ chatId: '126', chatName: 'Chat about document' },
		{ chatId: '127', chatName: 'Chat about document' },
	];

	return (
		<aside
			className={`h-screen w-75 flex flex-col items-start px-4 pt-2 transition-all duration-300 ${
				isSidebarExpanded ? 'justify-between' : 'w-[50px] px-2'
			}`}
		>
			<div className="flex flex-row items-center gap-3 h-fit py-4 mb-8 w-full">
				{isSidebarExpanded ? (
					<>
						<Image
							src="/lernen-logo.svg"
							alt="Lernen logo"
							width={28}
							height={28}
						/>
						<p className="text-lg font-sans">Lernen</p>
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

			{isSidebarExpanded && (
				<section className="h-fit mt-2 flex w-full flex-col gap-2">
					<div className="flex flex-row justify-between items-center w-full">
						<h1 className="font-mono text-sm text-[#c7c7c7] whitespace-nowrap">
							Chat documents
						</h1>
						<p className="text-xs font-mono text-[#c7c7c7]">
							{files.length}/3
						</p>
					</div>
					{files.map((file) => {
						const fileOpened =
							searchParams.get('file') === file.fileId;
						return (
							<div
								key={file.fileId}
								className="flex flex-row h-fit w-full rounded-md justify-start items-center gap-3 bg-[#252525] p-0.5 px-2"
							>
								<AiOutlineFilePdf className="size-4 text-[#e74c3c]" />
								<p className="text-foreground font-sans text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
									{file.fileName.split('.')[0]}
								</p>
								<Button
									variant={'ghost'}
									size={'sm'}
									className="text-red-500/30 hover:text-red-500 cursor-pointer p-0!"
									onClick={() =>
										handleRemoveFile(file.fileId)
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
									onClick={() => handleOpenFile(file.fileId)}
								>
									<MdOutlineOpenInNew className="size-4 m-0!" />
								</Button>
							</div>
						);
					})}
				</section>
			)}

			<Button
				variant={'outline'}
				className={`hover:bg-background h-fit bg-background border-0 justify-start items-center px-0! transition-none ${
					isSidebarExpanded ? 'my-4' : 'absolute top-25'
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
				<section className="relative flex-1 w-full flex flex-col max-h-full overflow-hidden">
					<h1 className="font-mono h-6 text-sm text-[#c7c7c7]">
						Recents
					</h1>
					<div className="absolute top-6 left-0 right-0 h-6 w-63 bg-gradient-to-t from-transparent to-background pointer-events-none"></div>
					<div className="hidden-scrollbar md:custom-scrollbar flex-1 pt-2 overflow-y-auto overflow-x-hidden pb-2">
						{chats.map((chat) => (
							<p
								key={chat.chatId}
								onClick={() => setCurrentChat(chat.chatId)}
								className={`
									text-foreground font-sans text-sm whitespace-nowrap overflow-hidden text-ellipsis
									cursor-pointer rounded-md px-3 py-1.5 w-62
									${currentChat === chat.chatId ? 'bg-[#2e2e2e]' : 'hover:bg-[#252525]'}
								`}
							>
								{chat.chatName}
							</p>
						))}
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
						className={`flex flex-row h-full w-full rounded-md items-center cursor-pointer hover:bg-[#212121] ${
							isSidebarExpanded
								? 'justify-start gap-3 p-2'
								: 'justify-center p-1'
						}`}
					>
						<p className="w-8 h-8 bg-secondary-lighter rounded-full flex-shrink-0"></p>
						{isSidebarExpanded && (
							<p className="text-foreground text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
								Olugbesan Oluwatamiloreeeeeeeeeeeeeeeee
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

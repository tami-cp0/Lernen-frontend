'use client'
import { ReactNode, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { TbLogout } from "react-icons/tb"
import { FaPlus } from "react-icons/fa6";
import { IoMdRemove } from "react-icons/io";
import { MdOutlineOpenInNew } from "react-icons/md";
import { AiOutlineFilePdf } from "react-icons/ai";
import { BsFiletypeDocx } from "react-icons/bs";
import { FaRegFileAlt } from "react-icons/fa";
import Image from "next/image";

export default function ChatLayout({ children }: { children: ReactNode }) {
    function handleLogout() {}
    function handleRemoveFile(fileId: string) {}

    const [fileOpened, setFileOpened] = useState<boolean>(false);
    function handleOpenFile(fileId: string) {}
    const files = [{ fileId: "123", fileName: "Document name.pdf" }, { fileId: "123", fileName: "Document name.docx" }]
    const chats = [
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
        { chatId: "123", chatName: "Chat about document" }, { chatId: "123", chatName: "Chat about document" },
    ];
    const [currentChat, setCurrentChat] = useState<string | null>(null);
// a quarter of the Fees for 400L classic hostel, 3 meal option, 1st semester 25/26
    return (
        <div className="h-screen w-screen flex flex-row">
            <aside className=" h-screen w-75 flex flex-col items-start px-4 pt-2 justify-between">
                <div className="flex flex-row items-center  gap-3 h-fit py-4 mb-8">
                    <Image src="/lernen-logo.svg" alt="Lernen logo" width={28} height={28}/>
                    <p className="text-lg font-sans">Lernen</p>
                </div>
                <section className="h-fit mt-2 flex w-full flex-col gap-2">
                    <div className="flex flex-row justify-between items-center w-full">
                        <h1 className="font-mono text-sm text-[#c7c7c7]">Chat documents</h1>
                        <p className="text-xs font-mono text-[#c7c7c7]">{files.length}/3</p>
                    </div>
                    {
                        files.map((file) => (
                            <div key={file.fileId} className="flex flex-row h-fit w-full rounded-md justify-start items-center gap-3 bg-[#252525] p-0.5 px-2">
                                {file.fileName.endsWith(".pdf") ? <AiOutlineFilePdf className="size-4 text-[#e74c3c]"/> : file.fileName.endsWith(".docx") ? <BsFiletypeDocx className="size-4 text-[#2980b9]"/> : <FaRegFileAlt className="size-4 text-[#27ae60]"/>}
                                <p className="text-foreground font-sans text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                                    {file.fileName.split(".")[0]}
                                </p>
                                <Button variant={"ghost"} size={"sm"} className="text-red-500/30 hover:text-red-500 cursor-pointer p-0!" onClick={() => handleRemoveFile(file.fileId)}>
                                    <IoMdRemove className="size-4"/>
                                </Button>
                                <Button variant={"ghost"} size={"sm"} className={` ${ fileOpened ? "text-primary" : "text-primary/30 hover:text-primary"} cursor-pointer p-0!`} onClick={() => handleOpenFile(file.fileId)}>
                                    <MdOutlineOpenInNew className="size-4 m-0!"/>
                                </Button>
                            </div>
                        ))
                    }
                </section>
                <Button variant={"outline"} className="hover:bg-background h-fit bg-background px-0! my-4 border-0 justify-start items-center">
                    <FaPlus className="rounded-full bg-primary fill-background size-4 p-0.5"/>
                    <span className="text-sm text-primary font-mono">New chat</span>
                </Button>
                <section className="relative flex-1 w-full flex flex-col max-h-full overflow-hidden">
                    <h1 className="font-mono h-6 text-sm text-[#c7c7c7]">Recents</h1>
                    <div className="absolute top-6 left-0 right-0 h-6 w-63 bg-gradient-to-t from-transparent to-background pointer-events-none"></div>
                    <div className="hidden-scrollbar md:custom-scrollbar flex-1 pt-2 overflow-y-auto pb-2">
                        {
                            chats.map((chat) => (
                                <p
                                    key={chat.chatId}
                                    onClick={() => setCurrentChat(chat.chatId)}
                                    className={`
                                    text-foreground font-sans text-sm whitespace-nowrap overflow-hidden text-ellipsis
                                    cursor-pointer rounded-md px-3 py-1.5 w-62
                                    ${currentChat === chat.chatId 
                                        ? "bg-[#2e2e2e]"  // active chat
                                        : "hover:bg-[#252525]"}
                                    `}
                                >
                                    {chat.chatName}
                                </p>
                            ))
                        }
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-6 w-63 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
                </section>
                <Popover>
                    <PopoverTrigger className="border-[#252525] border-t-1 w-full h-fit p-2">
                        <div className="flex flex-row h-full w-full rounded-md justify-start items-center gap-3 cursor-pointer hover:bg-[#212121] p-2">
                            <p className="w-8 h-8 bg-secondary-lighter rounded-full"></p>
                            <p className="text-foreground text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                                Olugbesan Oluwatamiloreeeeeeeeeeeeeeeee
                            </p>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="md:bg-background w-65 border-0 p-3 flex flex-col justify-start items-center gap-2">
                        <Button variant={"outline"} className="w-full justify-start" onClick={handleLogout}>
                            <TbLogout color="red" />
                            <span className="text-red-600">Logout</span>
                        </Button>
                    </PopoverContent> 
                </Popover>
            </aside>

            <main className="flex-1 h-full bg-secondary">
                {children}
            </main>
        </div> 
    )
}
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Chat, Prisma } from "@prisma/client";
import { DeleteChatButton } from "@/components/delete-chat-button";

async function getChats(): Promise<(Chat & { _count: { messages: number } })[]> {
  return prisma.chat.findMany({
    include: {
      _count: {
        select: { messages: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export default async function ChatsPage() {
  const chats = await getChats();
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Your Chats</h1>
      {chats.length === 0 ? (
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Chats Yet</h2>
          <p className="text-gray-600">
            Start a new chat by typing your request in the input box.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chats.map((chat) => (
            <div key={chat.id} className="relative">
              <Link href={`/chats/${chat.id}`}>
                <Card className="p-4 hover:bg-gray-50 transition-colors">
                  <h2 className="font-semibold">{chat.title}</h2>
                  <div className="text-sm text-gray-500 mt-2">
                    <p>{chat.model} • {chat.quality}</p>
                    <p>{new Date(chat.createdAt).toLocaleDateString()}</p>
                    <p>{chat._count.messages} messages</p>
                  </div>
                </Card>
              </Link>
              <DeleteChatButton chatId={chat.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
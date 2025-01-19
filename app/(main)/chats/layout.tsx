import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Chats - Ollama Coder",
  description: "View and manage your chat history with Ollama Coder",
};

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
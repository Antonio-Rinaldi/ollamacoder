"use client";

import { createMessage } from "@/app/(main)/actions";
import LogoSmall from "@/components/icons/logo-small";
import { splitByFirstCodeFence } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, use, useEffect, useRef, useState } from "react";
import { ChatStream } from "@/lib/chat-stream";
import ChatBox from "./chat-box";
import ChatLog from "./chat-log";
import CodeViewer from "./code-viewer";
import CodeViewerLayout from "./code-viewer-layout";
import type { Chat } from "./page";
import { Context } from "../../providers";

export default function PageClient({ chat }: { chat: Chat }) {
  const context = use(Context);
  const [readableStream, setReadableStream] = useState<ReadableStream<Uint8Array> | undefined>(context.readableStream);
  const [streamText, setStreamText] = useState("");
  const [isShowingCodeViewer, setIsShowingCodeViewer] = useState(
    chat['messages'].some(message => message.role === "assistant") as boolean,
  );
  const [activeTab, setActiveTab] = useState<"code" | "preview">("preview");
  const router = useRouter();
  const isHandlingStreamRef = useRef(false);
  const [activeMessage, setActiveMessage] = useState(
    chat['messages'].filter(message => message.role === "assistant").at(-1),
  );

  const chatId = chat['id'];
  useEffect(() => {
    (async () => {
      if (!readableStream || isHandlingStreamRef.current) return;

      isHandlingStreamRef.current = true;
      context.setReadableStream(undefined);

      let didPushToCode = false;
      let didPushToPreview = false;

      return ChatStream.fromReadableStream<>(readableStream)
        .on("content", (delta: string, content: string) => {
          setStreamText((text) => text + delta);

          if (
            !didPushToCode &&
            splitByFirstCodeFence(content).some(
              (part) => part.type === "first-code-fence-generating",
            )
          ) {
            didPushToCode = true;
            setIsShowingCodeViewer(true);
            setActiveTab("code");
          }

          if (
            !didPushToPreview &&
            splitByFirstCodeFence(content).some(
              (part) => part.type === "first-code-fence",
            )
          ) {
            didPushToPreview = true;
            setIsShowingCodeViewer(true);
            setActiveTab("preview");
          }
        })
        .on("finalContent", async (finalText: string) => {
          startTransition(async () => {
            const message = await createMessage(
              chatId,
              finalText,
              "assistant",
            );

            startTransition(() => {
              isHandlingStreamRef.current = false;
              setStreamText("");
              setReadableStream(undefined);
              setActiveMessage(message);
              router.refresh();
            });
          });
        })
        .read();
    })();
  }, [chatId, router, readableStream, context]);

  return (
    <div className="h-dvh">
      <div className="flex h-full">
        <div className="mx-auto flex w-full shrink-0 flex-col overflow-hidden lg:w-1/2">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <Link href="/" className="flex-shrink-0">
              <LogoSmall />
            </Link>
            <h1 className="text-xl font-medium text-gray-800 text-center flex-grow mx-4 truncate">
              {chat['title']}
            </h1>
            <div className="flex-shrink-0 w-8"></div>
          </div>

          <ChatLog
            chat={chat}
            streamText={streamText}
            activeMessage={activeMessage}
            onMessageClick={(message) => {
              if (message !== activeMessage) {
                setActiveMessage(message);
                setIsShowingCodeViewer(true);
              } else {
                setActiveMessage(undefined);
                setIsShowingCodeViewer(false);
              }
            }}
          />

          <ChatBox
            chat={chat}
            setReadableStream={setReadableStream}
            isStreaming={!!readableStream}
          />
        </div>

        <CodeViewerLayout
          isShowing={isShowingCodeViewer}
          onClose={() => {
            setActiveMessage(undefined);
            setIsShowingCodeViewer(false);
          }}
        >
          {isShowingCodeViewer && (
            <CodeViewer
              streamText={streamText}
              chat={chat}
              message={activeMessage}
              onMessageChange={setActiveMessage}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={() => {
                setActiveMessage(undefined);
                setIsShowingCodeViewer(false);
              }}
            />
          )}
        </CodeViewerLayout>
      </div>
    </div>
  );
}

"use server";

import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getMainCodingPrompt, screenshotToCodePrompt, softwareArchitectPrompt } from "@/lib/prompts";

interface ChatResponse {
  id: string;
  model: string;
  quality: string;
  prompt: string;
  title: string;
  ollamaCoderVersion: string;
  shadcn: boolean;
  createdAt: Date;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    position: number;
  }>;
}

export async function fetchModels() {
  const res = await fetch(await getApiFetchModelsUrl(), {
    method: "GET",
  });
  const jsonRes = await res.json();
  return jsonRes.models.map((model: { name: string; model: string }) => ({
    label: model.name,
    value: model.model
  }));
}

export async function initChat(
  prompt: string,
  model: string,
  quality: "high" | "low",
  screenshotUrl: string | undefined,
) {
  const title = await fetchTitle(prompt, model);
  const fullScreenshotDescription: string | undefined = await fetchFullScreenshotDescription(prompt, model, screenshotUrl)
  const userMessage: string = await buildUserMessage(prompt, model, quality, fullScreenshotDescription)
  const chat: ChatResponse = await createChat(prompt, model, quality, title, userMessage)

  const lastMessage = chat.messages
    .sort((a, b) => a.position - b.position)
    .at(-1);
  if (!lastMessage) throw new Error("No new message");
  return {
    chatId: chat.id,
    lastMessageId: lastMessage.id,
  };
}

export async function createMessage(
  chatId: string,
  text: string,
  role: "assistant" | "user",
) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { messages: true },
  });
  if (!chat) notFound();

  const maxPosition = Math.max(...chat.messages.map(message => message.position));
  return prisma.message.create({
    data: {
      role,
      content: text,
      position: maxPosition + 1,
      chatId,
    },
  });
}

// This is used for subsequent messages in the chat
export async function getNextCompletionStreamPromise(
  messageId: string,
  model: string,
): Promise<ReadableStream<Uint8Array>> {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) notFound();

  const messagesRes = await prisma.message.findMany({
    where: { chatId: message['chatId'], position: { lte: message['position'] } },
    orderBy: { position: "asc" }
  });

  const messages = z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      }),
    )
    .parse(messagesRes);

  return new Promise<ReadableStream<Uint8Array>>(async (resolve, reject) => {
    const res = await fetch(await getApiGenerateUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: messages.map(message => ({
          role: message.role,
          content: message.content
        })),
        temperature: 0.2,
        max_tokens: 9000,
      }),
    });
    if (!res.ok) {
      reject(`Failed to get completion for messageId ${messageId}, error is: ${res.statusText}.`);
    }
    if (!res.body) {
      reject(`No response body for messageId ${messageId}.`)
    }
     resolve(res.body);
  });
}

export async function processResponse(res: Response) {
  if (!res.ok) {
    throw Error(`Failed to get completion: ${res.statusText}`);
  }
  if (!res.body) {
    throw Error("No response body");
  }
  return processResponseBody(res.body)
}

export async function processResponseBody(resBody: ReadableStream<Uint8Array>) {
  const reader = resBody.getReader();
  let receivedData = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const receivedText = new TextDecoder().decode(value);
    if (receivedText.includes("\n")) {
      receivedText.split("\n")
        .forEach(receivedLine => {
          if (receivedLine.startsWith("{") && receivedLine.endsWith("}")) {
            receivedData += JSON.parse(receivedLine).message.content;
          }
        });
    } else {
      if (receivedText.startsWith("{") && receivedText.endsWith("}")) {
        receivedData += JSON.parse(receivedText).message.content;
      }
    }
  }
  return removeCodeFormatting(receivedData);
}

async function fetchTitle(prompt: string, model: string): Promise<string> {
  const title = await fetch(await getApiGenerateUrl() , {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a naming expert helping to create descriptive and meaningful titles for software projects. Your task is to analyze the user's prompt and create a clear, concise title that captures the essence of what they want to build. The title should be descriptive enough to understand the project's purpose but still concise (under 60 characters). Focus on the main functionality or purpose. Return only the title, with no quotes or additional text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });
  return await processResponse(title) || prompt;
}

async function fetchFullScreenshotDescription(
  prompt: string,
  model: string,
  screenshotUrl: string | undefined
): Promise<string | undefined> {
  if (!screenshotUrl) {
    return undefined;
  }
  const screenshotResponse = await fetch(await getApiGenerateUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: screenshotToCodePrompt },
            {
              type: "image_url",
              image_url: {
                url: screenshotUrl,
              },
            },
          ],
        },
      ],
    }),
  });
  return await processResponse(screenshotResponse);
}

async function buildUserMessage(
  prompt: string,
  model: string,
  quality: "high" | "low",
  fullScreenshotDescription: string | undefined
): Promise<string> {
  if(quality !== "high") {
    const screenshotUserMessagePart = fullScreenshotDescription
      ? "RECREATE THIS APP AS CLOSELY AS POSSIBLE: " + fullScreenshotDescription
      : ""
    return prompt + "\n" + screenshotUserMessagePart;
  }
  const initialRes = await fetch(await getApiGenerateUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content: softwareArchitectPrompt,
        },
        {
          role: "user",
          content: fullScreenshotDescription
            ? prompt + "\n" + fullScreenshotDescription
            : prompt,
        },
      ],
    }),
  });
  return await processResponse(initialRes) ?? prompt;
}

async function createChat(prompt, model, quality, title, userMessage): Promise<ChatResponse> {
  return prisma.chat.create({
    data: {
      model,
      quality,
      prompt,
      title,
      shadcn: true,
      messages: {
        createMany: {
          data: [
            {
              role: "system",
              content: getMainCodingPrompt(),
              position: 0,
            },
            { role: "user", content: userMessage, position: 1 },
          ],
        },
      },
    },
    include: {
      messages: true,
    },
  }) as ChatResponse;
}

function removeCodeFormatting(code: string): string {
  return code.replace(/```(?:typescript|javascript|tsx)?\n([\s\S]*?)```/g, '$1').trim();
}

async function getApiFetchModelsUrl() {
  const baseUrl = await getBaseUrl();
  return `${baseUrl}/api/fetchModels`;
}

async function getApiGenerateUrl() {
  const baseUrl = await getBaseUrl();
  return `${baseUrl}/api/generate`;
}

async function getBaseUrl() {
  // During SSR, use the host header to create the base URL
  if (typeof window === 'undefined') {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    // Cast to Headers since we know it's synchronous despite the type
    const headersList = await headers() as Headers;
    const host = headersList.get('host');
    if (!host) {
      // Fallback to environment variable or default
      return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }
    return `${protocol}://${host}`;
  }
  // In the browser, use the current window location
  return window.location.origin;
}

"use server";

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getMainCodingPrompt, screenshotToCodePrompt, softwareArchitectPrompt } from "@/lib/prompts";

// TODO: fix
const SERVER_BASE_URL = "http://localhost:3000";

export async function fetchModels() {
  const res = await fetch(`${SERVER_BASE_URL}/api/fetchModels`, {
    method: "GET",
  });
  const jsonRes = await res.json();
  return jsonRes.models.map(model => ({
    label: model.name,
    value: model.model
  }));
}

export async function createChat(
  prompt: string,
  model: string,
  quality: "high" | "low",
  screenshotUrl: string | undefined,
) {

  async function fetchTitle() {
    const title = await fetch(`${SERVER_BASE_URL}/api/generate`, {
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
              "You are a chatbot helping the user create a simple app or script, and your current job is to create a succinct title, maximum 3-5 words, for the chat given their initial prompt. Please return only the title.",
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

  const [title] = await Promise.all([
    fetchTitle(),
  ]);

  let fullScreenshotDescription: string;
  if (screenshotUrl) {
    let screenshotResponse = await fetch(`${SERVER_BASE_URL}/api/generate`, {
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
            // @ts-expect-error Need to fix the TypeScript library type
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
    fullScreenshotDescription = await processResponse(screenshotResponse);
  }

  let userMessage: string;
  if (quality === "high") {
    const initialRes = await fetch(`${SERVER_BASE_URL}/api/generate`, {
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
              ? fullScreenshotDescription + prompt
              : prompt,
          },
        ],
      }),
    });
    userMessage = await processResponse(initialRes) ?? prompt;
  } else {
    userMessage =
      prompt +
      "RECREATE THIS APP AS CLOSELY AS POSSIBLE: " +
      fullScreenshotDescription;
  }

  const chat = await prisma.chat.create({
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
  });

  const lastMessage = chat.messages
    .sort((a, b) => a.position - b.position)
    .at(-1);
  if (!lastMessage) throw new Error("No new message");

  return {
    chatId: chat['id'],
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

export async function getNextCompletionStreamPromise(
  messageId: string,
  model: string,
) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) notFound();

  const messagesRes = await prisma.message.findMany({
    where: { chatId: message['chatId'], position: { lte: message['position'] } },
    orderBy: { position: "asc" },
  });

  const messages = z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      }),
    )
    .parse(messagesRes);

  return {
    streamPromise: new Promise<ReadableStream>(async resolve => {
      const res = await fetch(`${SERVER_BASE_URL}/api/generate`, {
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
        }),
      });
      resolve(res.body as ReadableStream);
    }),
  };
}

async function processResponse(res: Response) {
  if (!res.ok) {
    throw new Error(res.statusText);
  }

  if (!res.body) {
    throw new Error("No response body");
  }

  const reader = res.body.getReader();
  let receivedData = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const receivedLines = new TextDecoder().decode(value);
    receivedLines.split("\n")
      .filter(receivedLines => receivedLines.length > 0)
      .forEach(receivedLine => {
        receivedData += JSON.parse(receivedLine).response;
      });
    return removeCodeFormatting(receivedData);
  }
}

function removeCodeFormatting(code: string): string {
  return code.replace(/```(?:typescript|javascript|tsx)?\n([\s\S]*?)```/g, '$1').trim();
}

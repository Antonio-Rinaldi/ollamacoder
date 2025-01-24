"use client";

import ArrowRightIcon from "@/components/icons/arrow-right";
import LightningBoltIcon from "@/components/icons/lightning-bolt";
import UploadIcon from "@/components/icons/upload-icon";
import Spinner from "@/components/spinner";
import assert from "assert";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { createMessage, getNextCompletionStreamPromise } from "../../actions";
import { type Chat } from "./page";
import { ModelSelector } from "@/components/model-selector";
import * as Select from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, XCircleIcon } from "lucide-react";
import { useS3Upload } from "next-s3-upload";

export default function ChatBox({
  chat,
  onNewStreamPromise,
  isStreaming,
}: {
  chat: Chat;
  onNewStreamPromise: (v: Promise<ReadableStream>) => void;
  isStreaming: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const disabled = isPending || isStreaming;
  const didFocusOnce = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quality, setQuality] = useState("high");
  const [screenshotUrl, setScreenshotUrl] = useState<string | undefined>(undefined);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const { uploadToS3 } = useS3Upload();

  const handleScreenshotUpload = async (event: any) => {
    if (disabled) return;
    setQuality("low");
    setScreenshotLoading(true);
    let file = event.target.files[0];
    const { url } = await uploadToS3(file);
    setScreenshotUrl(url);
    setScreenshotLoading(false);
  };

  useEffect(() => {
    if (!textareaRef.current) return;

    if (!disabled && !didFocusOnce.current) {
      textareaRef.current.focus();
      didFocusOnce.current = true;
    } else {
      didFocusOnce.current = false;
    }
  }, [disabled]);

  return (
    <div className="mx-auto mb-5 flex w-full max-w-prose shrink-0 flex-col px-8">
      <form
        className="relative flex w-full"
        action={async (formData) => {
          startTransition(async () => {
            const { prompt, quality } = Object.fromEntries(formData);
            assert.ok(typeof prompt === "string");
            assert.ok(quality === "high" || quality === "low");

            const message = await createMessage(chat.id, prompt, "user");
            const streamPromise = getNextCompletionStreamPromise(
              message.id,
              chat.model,
            );
            onNewStreamPromise(streamPromise);
            router.refresh();
          });
        }}
      >
        <fieldset className="w-full" disabled={disabled}>
          <div className="relative flex rounded-xl border-4 border-gray-300 bg-white pb-10">
            <div className="w-full">
              {screenshotLoading && (
                <div className="relative mx-3 mt-3">
                  <div className="rounded-xl">
                    <div className="group mb-2 flex h-16 w-[68px] animate-pulse items-center justify-center rounded bg-gray-200">
                      <Spinner />
                    </div>
                  </div>
                </div>
              )}
              {screenshotUrl && (
                <div className={`${isPending ? "invisible" : ""} relative mx-3 mt-3`}>
                  <div className="rounded-xl">
                    <img
                      alt="screenshot"
                      src={screenshotUrl}
                      className="group relative mb-2 h-16 w-[68px] rounded"
                    />
                  </div>
                  <button
                    type="button"
                    id="x-circle-icon"
                    className="absolute -right-3 -top-4 left-14 z-10 size-5 rounded-full bg-white text-gray-900 hover:text-gray-500"
                    onClick={() => {
                      setScreenshotUrl(undefined);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <XCircleIcon />
                  </button>
                </div>
              )}
              <TextareaAutosize
                ref={textareaRef}
                placeholder="Follow up"
                autoFocus={!disabled}
                required
                name="prompt"
                rows={1}
                className="peer relative w-full resize-none bg-transparent p-3 placeholder-gray-500 focus-visible:outline-none disabled:opacity-50"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    const target = event.target;
                    if (!(target instanceof HTMLTextAreaElement)) return;
                    target.closest("form")?.requestSubmit();
                  }
                }}
              />
            </div>
            <div className="absolute bottom-2 left-2 right-2.5 flex items-center justify-between flex-nowrap">
              <div className="flex items-center gap-2 flex-nowrap">
                <ModelSelector
                  currentModel={chat.model}
                  chatId={chat.id}
                  disabled={disabled}
                  onModelChange={(model) => {
                    router.refresh();
                  }}
                />

                <div className="h-4 w-px bg-gray-200 max-sm:hidden" />
<Select.Root
  name="quality"
  value={quality}
  onValueChange={setQuality}
  disabled={disabled}
>
  <Select.Trigger className={`inline-flex items-center gap-1 rounded p-1 text-sm text-gray-400 ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 hover:text-gray-700'
  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300`}>
                    <Select.Value aria-label={quality}>
                      <span className="max-sm:hidden">
                        {quality === "low"
                          ? "Low quality [faster]"
                          : "High quality [slower]"}
                      </span>
                      <span className="sm:hidden">
                        <LightningBoltIcon className="size-3" />
                      </span>
                    </Select.Value>
                    <Select.Icon>
                      <ChevronDownIcon className="size-3" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="overflow-hidden rounded-md bg-white shadow ring-1 ring-black/5">
                      <Select.Viewport className="space-y-1 p-2">
                        {[
                          { value: "low", label: "Low quality [faster]" },
                          { value: "high", label: "High quality [slower]" },
                        ].map((q) => (
                          <Select.Item
                            key={q.value}
                            value={q.value}
                            className="flex cursor-pointer items-center gap-1 rounded-md p-1 text-sm data-[highlighted]:bg-gray-100 data-[highlighted]:outline-none"
                          >
                            <Select.ItemText className="inline-flex items-center gap-2 text-gray-500">
                              {q.label}
                            </Select.ItemText>
                            <Select.ItemIndicator>
                              <CheckIcon className="size-3 text-blue-600" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>

                <div className="h-4 w-px bg-gray-200 max-sm:hidden" />

                <div>
                  <label
                    htmlFor="screenshot"
                    className={`flex gap-2 text-sm text-gray-400 ${
                      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:underline hover:text-gray-700'
                    }`}
                  >
                    <div className={`flex size-6 items-center justify-center rounded ${
                      disabled ? 'bg-black' : 'bg-black hover:bg-gray-700'
                    }`}>
                      <UploadIcon className="size-4" />
                    </div>
                    <div className={`flex items-center justify-center transition ${disabled ? '' : 'hover:text-gray-700'}`}>
                      Attach
                    </div>
                  </label>
                  <input
                    id="screenshot"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleScreenshotUpload}
                    className="hidden"
                    ref={fileInputRef}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="relative flex shrink-0 has-[:disabled]:opacity-50 ml-6">
                <div className="pointer-events-none absolute inset-0 -bottom-[1px] rounded bg-blue-500" />
                <button
                  className="relative inline-flex size-6 items-center justify-center rounded bg-blue-500 font-medium text-white shadow-lg outline-blue-300 hover:bg-blue-500/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  type="submit"
                >
                  <Spinner loading={disabled}>
                    <ArrowRightIcon />
                  </Spinner>
                </button>
              </div>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

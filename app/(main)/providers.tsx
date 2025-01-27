"use client";

import { createContext, ReactNode, useState } from "react";

export const Context = createContext<{
  readableStream?: ReadableStream<Uint8Array>;
  setReadableStream: (v: ReadableStream<Uint8Array> | undefined) => void;
}>({
  setReadableStream: () => {},
});

export default function Providers({ children }: { children: ReactNode }) {
  const [readableStream, setReadableStream] = useState<ReadableStream<Uint8Array>>();

  return (
    <Context.Provider value={{ readableStream, setReadableStream }}>{children}</Context.Provider>
  );
}

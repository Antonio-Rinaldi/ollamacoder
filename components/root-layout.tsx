"use client";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-gray-100 text-gray-900 antialiased">
      {children}
    </div>
  );
}
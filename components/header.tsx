import Image from "next/image";

import GithubIcon from "@/components/icons/github-icon";
import logo from "@/public/ollama-logo.png";
import Link from "next/link";

export default function Header() {
  return (
    <div className="flex flex-col items-center">
      <header className="relative mx-auto flex w-full shrink-0 items-center justify-center py-3">
        <Link href="/">
          <Image
            src={logo}
            alt=""
            quality={100}
            className="mx-auto h-16 w-16 object-contain"
            priority
          />
        </Link>

        <div className="absolute right-3">
          <a
            href="https://github.com/Antonio-Rinaldi/ollamacoder"
            target="_blank"
            className="ml-auto hidden items-center gap-3 rounded-2xl bg-white px-6 py-2 shadow sm:flex"
          >
            <GithubIcon className="h-4 w-4" />
            <span>GitHub Repo</span>
          </a>
        </div>
      </header>
      <Link href="/chats" className="mt-2 text-sm text-gray-600 hover:text-gray-900">
        Existing Chats
      </Link>
    </div>
  );
}

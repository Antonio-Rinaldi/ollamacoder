import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    await prisma.chat.deleteMany({});
    return NextResponse.json({ success: true, message: "All chats deleted" });
  } catch (error) {
    console.error("Failed to delete chats:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete chats" },
      { status: 500 }
    );
  }
}
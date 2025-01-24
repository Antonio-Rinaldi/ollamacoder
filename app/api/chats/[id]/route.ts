import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  await prisma.chat.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const { model } = await request.json();
  
  const chat = await prisma.chat.update({
    where: { id },
    data: { model },
  });

  return NextResponse.json(chat);
}
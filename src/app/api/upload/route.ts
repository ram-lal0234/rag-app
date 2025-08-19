import { NextResponse } from "next/server";
import { getEmbedding } from "@/lib/openai";
import { qdrant } from "@/lib/qdrant";

export async function POST(req: Request) {
  const { userId, text } = await req.json();

  const vector = await getEmbedding(text);

  await qdrant.upsert("user_docs", {
    points: [
      {
        id: Date.now(),
        vector,
        payload: { userId, text },
      },
    ],
  });

  return NextResponse.json({ success: true });
}

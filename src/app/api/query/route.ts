import { NextResponse } from "next/server";
import { getEmbedding } from "@/lib/openai";
import { qdrant } from "@/lib/qdrant";

export async function POST(req: Request) {
  const { userId, query } = await req.json();

  const queryVector = await getEmbedding(query);

  const result = await qdrant.search("user_docs", {
    vector: queryVector,
    limit: 3,
    filter: { must: [{ key: "userId", match: { value: userId } }] },
  });

  return NextResponse.json({ matches: result });
}

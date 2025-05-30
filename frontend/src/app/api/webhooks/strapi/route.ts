import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { model } = await req.json();
  const pathMap: Record<string, string> = { customer: "/customers", deal: "/deals", invoice: "/invoices" };
  if (pathMap[model]) revalidatePath(pathMap[model]);
  return NextResponse.json({ revalidated: true, model });
}

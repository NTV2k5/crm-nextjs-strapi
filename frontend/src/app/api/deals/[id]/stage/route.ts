import { NextRequest, NextResponse } from "next/server";
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { stage } = await req.json();
  const jwt = req.cookies.get("jwt")?.value;
  const res = await fetch(process.env.STRAPI_URL + "/api/deals/" + params.id, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + jwt },
    body: JSON.stringify({ data: { stage } }),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

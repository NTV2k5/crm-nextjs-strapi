import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Logic: find deals not updated in 7+ days and send reminders
  return NextResponse.json({ sent: 0, message: "Follow-up reminders processed" });
}

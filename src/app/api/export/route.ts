import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  buildFullExport,
  termsToCsv,
  termsToMarkdown,
} from "@/server/services/export-service";
import { logActivity } from "@/server/services/activity";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const format = new URL(req.url).searchParams.get("format") ?? "json";
  const exp = await buildFullExport(session.user.id);
  await logActivity({ userId: session.user.id, type: "data.exported", meta: { format } });

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    return new NextResponse(termsToCsv(exp), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mylesson-terms-${stamp}.csv"`,
      },
    });
  }

  if (format === "md" || format === "markdown") {
    return new NextResponse(termsToMarkdown(exp), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="mylesson-terms-${stamp}.md"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(exp, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mylesson-backup-${stamp}.json"`,
    },
  });
}

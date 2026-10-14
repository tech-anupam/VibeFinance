import { NextResponse } from "next/server";
import { z } from "zod";
import { getSourceRegistry } from "@/sources/registry";
import { log } from "@/lib/log";

const requestSchema = z.object({
  adapterId: z.string().min(1),
  action: z.enum(["disable", "enable"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const registry = getSourceRegistry();

    if (parsed.data.action === "disable") {
      registry.disable(parsed.data.adapterId);
    } else {
      registry.enable(parsed.data.adapterId);
    }

    log.info("Adapter toggled", { adapterId: parsed.data.adapterId, action: parsed.data.action });

    return NextResponse.json({
      adapterId: parsed.data.adapterId,
      action: parsed.data.action,
      statuses: registry.getStatuses(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

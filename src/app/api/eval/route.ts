import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const resultsPath = path.join(process.cwd(), "data", "eval-results.json");
    if (fs.existsSync(resultsPath)) {
      const data = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
      return NextResponse.json(data);
    }

    const scenariosPath = path.join(process.cwd(), "src", "eval", "scenarios.json");
    const scenarios = JSON.parse(fs.readFileSync(scenariosPath, "utf-8"));

    return NextResponse.json({
      status: "ready",
      totalScenarios: scenarios.length,
      scenarios: scenarios.slice(0, 5),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

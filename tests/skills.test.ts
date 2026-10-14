import { describe, it, expect } from "vitest";
import path from "path";
import { loadInternalSkills, loadVendoredSkills, loadAllSkills } from "@/skills/loader";
import { selectSkills } from "@/skills/selector";

describe("Skills System & Agent Extender", () => {
  const skillsBaseDir = path.join(process.cwd(), "skills");

  it("loads internal skills from skills/internal", () => {
    const internal = loadInternalSkills(path.join(skillsBaseDir, "internal"));
    expect(internal.length).toBeGreaterThan(0);
    const names = internal.map((s) => s.meta.name);
    expect(names).toContain("claim-extractor");
    expect(names).toContain("prosecutor");
    expect(names).toContain("defence");
  });

  it("loads vendored skills from skills/vendor enforcing SOURCE.md provenance", () => {
    const vendored = loadVendoredSkills(path.join(skillsBaseDir, "vendor"));
    expect(vendored.length).toBeGreaterThan(0);
    const macro = vendored.find((s) => s.meta.name === "macro-liquidity");
    expect(macro).toBeDefined();
    expect(macro?.meta.allowedTools).toContain("get_quote");
  });

  it("selects relevant skills using BM25 ranking", () => {
    const all = loadAllSkills(skillsBaseDir);
    const selected = selectSkills(all, "interest rate cuts repo rate liquidity expansion", 2);
    expect(selected.length).toBeGreaterThan(0);
    const names = selected.map((s) => s.meta.name);
    expect(names).toContain("macro-liquidity");
  });
});

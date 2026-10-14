import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import path from "path";
import { z } from "zod";
import type { LoadedSkill, SkillMeta } from "./types";
import { log } from "@/lib/log";

const frontmatterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  allowedTools: z.array(z.string()).optional(),
});

function parseFrontmatter(content: string): { meta: SkillMeta; body: string } | undefined {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return undefined;

  const yamlBlock = match[1]!;
  const body = match[2]!;

  const fields: Record<string, unknown> = {};
  for (const line of yamlBlock.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const rawValue = line.slice(colonIndex + 1).trim();
    if (key === "allowedTools") {
      fields[key] = rawValue.split(",").map((t) => t.trim()).filter(Boolean);
    } else {
      fields[key] = rawValue;
    }
  }

  const result = frontmatterSchema.safeParse(fields);
  if (!result.success) return undefined;

  return { meta: result.data, body: body.trim() };
}

export function loadInternalSkills(skillsDir: string): LoadedSkill[] {
  const skills: LoadedSkill[] = [];
  if (!existsSync(skillsDir)) return skills;

  const files = readdirSync(skillsDir).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const filePath = path.join(skillsDir, file);
    const content = readFileSync(filePath, "utf-8");
    const parsed = parseFrontmatter(content);
    if (!parsed) {
      log.warn("Skipping skill file with invalid frontmatter", { file });
      continue;
    }
    skills.push({ ...parsed, sourcePath: filePath });
  }

  log.info("Loaded internal skills", { count: skills.length });
  return skills;
}

export function loadVendoredSkills(vendorDir: string): LoadedSkill[] {
  const skills: LoadedSkill[] = [];
  if (!existsSync(vendorDir)) return skills;

  const entries = readdirSync(vendorDir);
  for (const entry of entries) {
    const entryPath = path.join(vendorDir, entry);
    if (!statSync(entryPath).isDirectory()) continue;

    const sourceFile = path.join(entryPath, "SOURCE.md");
    if (!existsSync(sourceFile)) {
      log.warn("Skipping vendored skill without SOURCE.md provenance", { entry });
      continue;
    }

    const skillFile = path.join(entryPath, "SKILL.md");
    if (!existsSync(skillFile)) {
      log.warn("Skipping vendored skill without SKILL.md", { entry });
      continue;
    }

    const content = readFileSync(skillFile, "utf-8");
    const parsed = parseFrontmatter(content);
    if (!parsed) {
      log.warn("Skipping vendored skill with invalid frontmatter", { entry });
      continue;
    }

    skills.push({ ...parsed, sourcePath: skillFile });
  }

  log.info("Loaded vendored skills", { count: skills.length });
  return skills;
}

export function loadAllSkills(skillsBaseDir: string): LoadedSkill[] {
  const internal = loadInternalSkills(path.join(skillsBaseDir, "internal"));
  const vendored = loadVendoredSkills(path.join(skillsBaseDir, "vendor"));
  return [...internal, ...vendored];
}

export function loadSkillByName(skillsDir: string, name: string): LoadedSkill | undefined {
  const filePath = path.join(skillsDir, `${name}.md`);
  if (!existsSync(filePath)) return undefined;

  const content = readFileSync(filePath, "utf-8");
  const parsed = parseFrontmatter(content);
  if (!parsed) return undefined;

  return { ...parsed, sourcePath: filePath };
}

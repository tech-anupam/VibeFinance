import { BM25Index } from "@/retrieval/bm25";
import type { LoadedSkill } from "./types";

export function selectSkills(skills: LoadedSkill[], taskDescription: string, topK: number = 3): LoadedSkill[] {
  if (skills.length === 0) return [];

  const index = new BM25Index();
  index.addDocuments(
    skills.map((s) => ({
      id: s.meta.name,
      content: `${s.meta.name} ${s.meta.description}`,
    }))
  );

  const results = index.search(taskDescription, topK);
  const selectedNames = new Set(results.map((r) => r.id));

  return skills.filter((s) => selectedNames.has(s.meta.name));
}

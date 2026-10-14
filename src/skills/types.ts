export interface SkillMeta {
  name: string;
  description: string;
  allowedTools?: string[];
}

export interface LoadedSkill {
  meta: SkillMeta;
  body: string;
  sourcePath: string;
}

export type ImpactLevel = "high" | "medium" | "low";

export interface Release {
  id: string;
  version: string;
  publishedAt: string;
  rawNotes: string;
  summary?: string;
  impact?: ImpactLevel;
  reason?: string;
  repositoryId?: string; // Added for database relations
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  stars: number;
  forks: number;
  releases: Release[];
  projectDescription: string;
  overallImpact?: {
    summary: string;
    impact: ImpactLevel;
    reason: string;
  }
}

export interface ProjectSettings {
  id: string;
  projectDescription: string;
  language: string;
}

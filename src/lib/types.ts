export type ImpactLevel = "high" | "medium" | "low";

export interface Release {
  id: string;
  version: string;
  rawNotes: string;
  summary?: string;
  impact?: ImpactLevel;
  reason?: string;
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  stars: number;
  forks: number;
  releases: Release[];
}

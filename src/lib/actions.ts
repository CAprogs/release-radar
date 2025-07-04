"use server";

import { summarizeReleaseNotes } from "@/ai/flows/summarize-release-notes";
import { predictImpactLevel } from "@/ai/flows/predict-impact-level";
import type { Release } from "./types";

export async function analyzeRelease(
  releaseNotes: string,
  projectDescription: string
): Promise<Pick<Release, "summary" | "impact" | "reason">> {
  try {
    if (!projectDescription.trim()) {
        throw new Error("Project description is required for impact analysis.");
    }
    
    // Step 1: Get a summary of the release notes. This also gives a preliminary impact prediction.
    const summaryResult = await summarizeReleaseNotes({ releaseNotes });

    if (!summaryResult || !summaryResult.summary) {
        throw new Error("Failed to generate release notes summary.");
    }

    // Step 2: Use the summary and project description to get a more tailored impact analysis.
    const impactResult = await predictImpactLevel({
      releaseNotesSummary: summaryResult.summary,
      projectDescription: projectDescription,
    });

    if (!impactResult || !impactResult.impactLevel || !impactResult.reason) {
        throw new Error("Failed to predict impact level.");
    }

    return {
      summary: summaryResult.summary,
      impact: impactResult.impactLevel,
      reason: impactResult.reason,
    };
  } catch (error) {
    console.error("Error analyzing release:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to analyze release notes: ${error.message}`);
    }
    throw new Error("An unknown error occurred during release analysis.");
  }
}

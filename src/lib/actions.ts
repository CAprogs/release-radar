"use server";

import { summarizeReleaseNotes } from "@/ai/flows/summarize-release-notes";
import { predictImpactLevel } from "@/ai/flows/predict-impact-level";
import { analyzeOverallImpact as analyzeOverallImpactFlow } from "@/ai/flows/analyze-overall-impact";
import type { Release, Repository } from "./types";

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


export async function analyzeOverallImpact(
    releases: Pick<Release, 'version' | 'rawNotes'>[],
    projectDescription: string
  ): Promise<NonNullable<Repository['overallImpact']>> {
    try {
      if (!projectDescription.trim()) {
        throw new Error("Project description is required for impact analysis.");
      }
      if (releases.length === 0) {
        throw new Error("No releases provided for overall analysis.");
      }
  
      // Reverse to send oldest to newest
      const releaseNotes = releases.map(r => `Version: ${r.version}\n\n${r.rawNotes}`).reverse();
  
      const result = await analyzeOverallImpactFlow({
        releaseNotes,
        projectDescription,
      });
      
      if (!result || !result.impactLevel || !result.reason || !result.summary) {
          throw new Error("Failed to get overall impact analysis from AI model.");
      }
  
      return {
        summary: result.summary,
        impact: result.impactLevel,
        reason: result.reason,
      };
  
    } catch (error) {
      console.error("Error analyzing overall impact:", error);
      if (error instanceof Error) {
          throw new Error(`Failed to analyze overall impact: ${error.message}`);
      }
      throw new Error("An unknown error occurred during overall impact analysis.");
    }
  }

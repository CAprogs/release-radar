'use server';

/**
 * @fileOverview Analyzes the overall impact of a series of releases on a user's project.
 *
 * - analyzeOverallImpact - A function that analyzes multiple release notes.
 * - AnalyzeOverallImpactInput - The input type for the function.
 * - AnalyzeOverallImpactOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeOverallImpactInputSchema = z.object({
  releaseNotes: z.array(z.string()).describe('An array of release notes from oldest to newest.'),
  projectDescription: z.string().describe('Description of the user project to assess impact.'),
});
export type AnalyzeOverallImpactInput = z.infer<typeof AnalyzeOverallImpactInputSchema>;

const AnalyzeOverallImpactOutputSchema = z.object({
  summary: z.string().describe('A consolidated summary of all key changes across the releases.'),
  impactLevel: z.enum(['high', 'medium', 'low']).describe('The overall predicted impact level of upgrading across all releases.'),
  reason: z.string().describe('The reasoning behind the overall predicted impact level.'),
});
export type AnalyzeOverallImpactOutput = z.infer<typeof AnalyzeOverallImpactOutputSchema>;

export async function analyzeOverallImpact(input: AnalyzeOverallImpactInput): Promise<AnalyzeOverallImpactOutput> {
  return analyzeOverallImpactFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeOverallImpactPrompt',
  input: {schema: AnalyzeOverallImpactInputSchema},
  output: {schema: AnalyzeOverallImpactOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing software release impact. The user is considering upgrading a dependency across multiple versions.
  Your task is to analyze the following series of release notes and provide an overall impact assessment for their project.

  The user's project is described as: "{{{projectDescription}}}"

  The release notes, in order from oldest to newest, are:
  {{#each releaseNotes}}
  ---
  {{{this}}}
  ---
  {{/each}}

  Based on all these changes, provide:
  1. A consolidated summary of the most important new features, breaking changes, and bug fixes.
  2. A single, overall impact level (high, medium, or low) for the entire upgrade.
  3. A concise reason for your impact assessment, explaining what parts of the upgrade are most likely to affect the user's project.

  Consider the following when determining the overall impact level:
  - High: Significant breaking changes, major new APIs that require refactoring, or features that directly conflict with or supersede parts of the user's project. Requires immediate and careful planning.
  - Medium: Some breaking changes that are easily addressable, new features that are beneficial but not critical, or deprecations that need attention. Requires some adjustments or testing.
  - Low: Mostly bug fixes, minor performance improvements, or new features that are unlikely to have a significant direct impact on the project. The upgrade should be straightforward.
`,
});

const analyzeOverallImpactFlow = ai.defineFlow(
  {
    name: 'analyzeOverallImpactFlow',
    inputSchema: AnalyzeOverallImpactInputSchema,
    outputSchema: AnalyzeOverallImpactOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

// src/ai/flows/predict-impact-level.ts
'use server';

/**
 * @fileOverview Predicts the impact level (high, medium, low) of a release on the user's project based on release notes summaries.
 *
 * - predictImpactLevel - A function that predicts the impact level of a release.
 * - PredictImpactLevelInput - The input type for the predictImpactLevel function.
 * - PredictImpactLevelOutput - The return type for the predictImpactLevel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictImpactLevelInputSchema = z.object({
  releaseNotesSummary: z
    .string()
    .describe('Summary of the release notes, highlighting major changes.'),
  projectDescription: z
    .string()
    .describe('Description of the user project to assess impact.'),
  language: z.string().optional().describe('The desired output language for the analysis (e.g., "French", "Spanish").'),
});
export type PredictImpactLevelInput = z.infer<typeof PredictImpactLevelInputSchema>;

const PredictImpactLevelOutputSchema = z.object({
  impactLevel: z
    .enum(['high', 'medium', 'low'])
    .describe('The predicted impact level of the release on the project.'),
  reason: z
    .string()
    .describe('The reasoning behind the predicted impact level.'),
});
export type PredictImpactLevelOutput = z.infer<typeof PredictImpactLevelOutputSchema>;

export async function predictImpactLevel(input: PredictImpactLevelInput): Promise<PredictImpactLevelOutput> {
  return predictImpactLevelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictImpactLevelPrompt',
  input: {schema: PredictImpactLevelInputSchema},
  output: {schema: PredictImpactLevelOutputSchema},
  prompt: `You are an AI assistant specialized in predicting the impact level of software releases on user projects.
  Based on the release notes summary and the project description, determine the impact level (high, medium, or low) and provide a brief explanation.
  {{#if language}}Your explanation should be in {{language}}.{{/if}}

  Release Notes Summary: {{{releaseNotesSummary}}}
  Project Description: {{{projectDescription}}}

  Consider the following when determining impact level:
  - High: Major changes that significantly affect the project and require immediate attention.
  - Medium: Moderate changes that may require some adjustments or testing.
  - Low: Minor changes that are unlikely to have a significant impact on the project.

  Return a JSON object with the impactLevel (high, medium, low) and reason fields.
`,
});

const predictImpactLevelFlow = ai.defineFlow(
  {
    name: 'predictImpactLevelFlow',
    inputSchema: PredictImpactLevelInputSchema,
    outputSchema: PredictImpactLevelOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

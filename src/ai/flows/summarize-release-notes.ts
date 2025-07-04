'use server';

/**
 * @fileOverview Summarizes release notes, highlighting key changes such as major features,
 * performance improvements, and bug fixes.
 *
 * - summarizeReleaseNotes - A function that summarizes the release notes.
 * - SummarizeReleaseNotesInput - The input type for the summarizeReleaseNotes function.
 * - SummarizeReleaseNotesOutput - The return type for the summarizeReleaseNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeReleaseNotesInputSchema = z.object({
  releaseNotes: z
    .string()
    .describe('The release notes to summarize.'),
  language: z.string().optional().describe('The desired output language for the summary (e.g., "French", "Spanish").'),
});
export type SummarizeReleaseNotesInput = z.infer<typeof SummarizeReleaseNotesInputSchema>;

const SummarizeReleaseNotesOutputSchema = z.object({
  summary: z.string().describe('The summarized release notes.'),
  impactPrediction: z
    .enum(['high', 'medium', 'low'])
    .describe('The predicted impact level (high, medium, or low) on the user\'s project.'),
});
export type SummarizeReleaseNotesOutput = z.infer<typeof SummarizeReleaseNotesOutputSchema>;

export async function summarizeReleaseNotes(
  input: SummarizeReleaseNotesInput
): Promise<SummarizeReleaseNotesOutput> {
  return summarizeReleaseNotesFlow(input);
}

const summarizeReleaseNotesPrompt = ai.definePrompt({
  name: 'summarizeReleaseNotesPrompt',
  input: {schema: SummarizeReleaseNotesInputSchema},
  output: {schema: SummarizeReleaseNotesOutputSchema},
  prompt: `You are an AI assistant helping to summarize release notes for software projects.

  Summarize the following release notes, highlighting major features, performance improvements, and bug fixes.
  Also, predict the potential impact (high, medium, low) on the user's project based on the changes described.
  {{#if language}}Your summary should be in {{language}}.{{/if}}

  Release Notes:
  {{{releaseNotes}}}

  Respond with a summary of the release notes and a single word indicating the predicted impact level (high, medium, or low).`,
});

const summarizeReleaseNotesFlow = ai.defineFlow(
  {
    name: 'summarizeReleaseNotesFlow',
    inputSchema: SummarizeReleaseNotesInputSchema,
    outputSchema: SummarizeReleaseNotesOutputSchema,
  },
  async input => {
    const {output} = await summarizeReleaseNotesPrompt(input);
    return output!;
  }
);

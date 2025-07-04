import { config } from 'dotenv';
config();

import '@/ai/flows/predict-impact-level.ts';
import '@/ai/flows/summarize-release-notes.ts';
import '@/ai/flows/analyze-overall-impact.ts';

# **App Name**: Release Radar

## Core Features:

- Repository Selection: Allow users to select GitHub repositories to track by providing a URL.
- Version Specification: Enable users to specify the version from which to start tracking release notes for each repository.
- Release Note Summarization: Use a generative AI tool to summarize the changes in each release note, highlighting major features, performance improvements, and bug fixes.
- Impact Prediction: Employ AI to analyze the summarized release notes and predict the potential impact (high, medium, low) on the user's project, based on the changes described. Generate output incorporating both the summarized release notes, and a single word prediction.
- Dashboard View: Present a clear and concise dashboard displaying tracked repositories, release notes summaries, and predicted impact levels.
- Automated Update Fetching: Implement a mechanism to periodically fetch new release notes from the selected repositories.

## Style Guidelines:

- Primary color: Muted blue (#5D9CBF), evokes reliability and information without being too visually aggressive.
- Background color: Light gray (#F0F4F7), a clean background that avoids distracting the user.
- Accent color: Soft orange (#D98E4B), offers a visual cue for important information.
- Body and headline font: 'Inter', sans-serif provides readability for both titles and summaries.
- Use minimalist icons to represent impact levels and repository types.
- Employ a card-based layout for repositories, summaries and release notes. Prioritize relevant content.
- Incorporate smooth transitions when loading or updating summaries.
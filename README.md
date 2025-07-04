# Release Radar

## Purpose

Release Radar is an open-source project designed to help developers and project managers quickly understand the potential impact of new software releases by leveraging AI to analyze release notes and predict their overall impact.

## Features

- **Release Note Summarization:** Automatically generates concise summaries of release notes.
- **Impact Prediction:** Predicts the potential impact level (e.g., Low, Medium, High) of a release based on its content.
- **Overall Impact Analysis:** Provides a comprehensive analysis of the potential impact of a release across various aspects.
- **User Interface:** A web-based interface for interacting with the analysis tools and viewing results.

## Installation

To set up Release Radar locally, follow these steps:

1. **Clone the repository:**

```
git clone <repository_url>
cd release-radar
```

2. **Install dependencies:**

```
npm install
```

3. **Configure environment variables:**

A `.env.template` has been fetched and should be completed.

```bash
GENKIT_API_KEY=<your_api_key>
```

## Running with Docker

You can also run Release Radar using Docker. Ensure you have Docker and Docker Compose installed.

```bash
docker-compose up --build
```

## Contribution

We welcome contributions to Release Radar! Please see the `CONTRIBUTING.md` file for details on how to contribute.

## Author

This project was initiated and developed by [CAprogs](https://github.com/CAprogs) ( with the amazing help of [Gemini](https://gemini.google.com/?hl=fr) on [Firebase Studio](https://firebase.studio/) ).


# Release Radar

## Purpose

Release Radar is an open-source project designed to help developers and project managers quickly understand the potential impact of new software releases by leveraging AI to analyze release notes and predict their overall impact.

## Features

- **Release Note Summarization:** Automatically generates concise summaries of release notes.
- **Impact Prediction:** Predicts the potential impact level (e.g., Low, Medium, High) of a release based on its content.
- **Overall Impact Analysis:** Provides a comprehensive analysis of the potential impact of a release across various aspects.
- **User Interface:** A web-based interface for interacting with the analysis tools and viewing results.

## Quick Start

For the fastest way to get started, use the included start script:

```bash
./start.sh
```

This script will:
- Check if your environment is properly configured
- Create a `.env` file from the example if needed
- Give you options to run the application locally or with Docker

## Manual Installation

To set up Release Radar locally, follow these steps:

1. **Clone the repository:**

```bash
git clone <repository_url>
cd release-radar
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

Copy the example environment file and configure your API key:

```bash
cp .env.example .env
```

Then edit the `.env` file and add your Google AI API key:

```bash
GOOGLE_API_KEY=your_google_api_key_here
```

**Get your Google AI API key:**
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key"
3. Create a new API key or use an existing one
4. Copy the API key and paste it in your `.env` file

4. **Run the development server:**

```bash
npm run dev
```

The application will be available at `http://localhost:9002`

## Running with Docker

You can also run Release Radar using Docker. Ensure you have Docker and Docker Compose installed.

1. **Create your environment file:**

```bash
cp .env.example .env
```

2. **Add your Google AI API key to the `.env` file:**

```bash
GOOGLE_API_KEY=your_google_api_key_here
```

3. **Build and run with Docker Compose:**

```bash
docker-compose up --build
```

The application will be available at `http://localhost:3000`

## Development

### Local Development
For local development without Docker:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`

### Development with Docker
For development with Docker (hot reload enabled):

```bash
docker-compose -f docker-compose.dev.yml up --build
```

The application will be available at `http://localhost:9002`

## Features

- **Release Note Summarization:** Automatically generates concise summaries of release notes using Google AI
- **Impact Prediction:** Predicts the potential impact level (e.g., Low, Medium, High) of a release based on its content
- **Overall Impact Analysis:** Provides a comprehensive analysis of the potential impact of a release across various aspects
- **User Interface:** A modern, responsive web interface built with Next.js and Tailwind CSS
- **Repository Tracking:** Track multiple GitHub repositories and their releases
- **AI-Powered Analysis:** Uses Google's Gemini AI model for intelligent analysis

## Environment Variables

The application requires the following environment variables:

- `GOOGLE_API_KEY` - **Required**: Your Google AI API key for accessing Gemini AI
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Port number for the application (default: 3000 for production, 9002 for development)

Optional environment variables:
- `GOOGLE_GENAI_USE_VERTEXAI` - Set to `true` to use Vertex AI instead of Gemini API
- `GOOGLE_CLOUD_PROJECT` - Required if using Vertex AI
- `GOOGLE_CLOUD_LOCATION` - Required if using Vertex AI
- `NEXT_TELEMETRY_DISABLED` - Set to `1` to disable Next.js telemetry

## API Endpoints

- `GET /api/health` - Health check endpoint for monitoring
- Application uses server actions for GitHub repository analysis and AI processing

## Troubleshooting

### Common Issues

1. **Missing API Key Error**: Make sure your `.env` file contains a valid `GOOGLE_API_KEY`
2. **Docker Build Fails**: Ensure Docker and Docker Compose are installed and running
3. **Port Already in Use**: Change the port in `docker-compose.yml` or stop the conflicting service
4. **AI Analysis Fails**: Check that your Google AI API key is valid and has sufficient quota

### Getting Help

- Check the browser console for client-side errors
- Check Docker logs: `docker-compose logs -f release-radar`
- Verify API key at [Google AI Studio](https://ai.google.dev/)

## Architecture

This application is built with:
- **Frontend**: Next.js 15 with App Router, React 18, Tailwind CSS
- **Backend**: Next.js API routes and server actions
- **AI Integration**: Google Genkit with Gemini AI
- **Deployment**: Docker containerization with multi-stage builds
- **GitHub Integration**: REST API for repository and release data

## Contribution

We welcome contributions to Release Radar! Please see the `CONTRIBUTING.md` file for details on how to contribute.

## Author

This project was initiated and developed by [CAprogs](https://github.com/CAprogs) ( with the amazing help of [Gemini](https://gemini.google.com/?hl=fr) on [Firebase Studio](https://firebase.studio/) ).


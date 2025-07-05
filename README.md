# Release Radar

An AI-powered assistant to analyze and understand the impact of software releases.

## ✨ Features

- **AI-Powered Analysis:** Uses Google's Gemini model to summarize release notes, predict impact levels (High, Medium, Low), and provide detailed reasoning.
- **Persistent Storage:** Uses a PostgreSQL database to store repositories, releases, and analysis results.
- **Modern UI:** A clean, responsive interface built with Next.js, Tailwind CSS, and shadcn/ui.
- **Dockerized:** Fully containerized for easy setup, development, and deployment.
- **Simplified Workflow:** Manage the entire application lifecycle with a single `justfile`.

## 🚀 Quick Start

Getting started with Release Radar is now easier than ever.

**Prerequisites:**
- [Docker](https://www.docker.com/get-started) and Docker Compose
- `uvx` and `just` (Install with `pipx install uvx && uvx --from=rust-just just --version`)
- A [Google AI API Key](https://ai.google.dev/)

**1. Clone the Repository**
```bash
git clone <your-repo-url>
cd release-radar
```

**2. Configure Your Environment**
```bash
# This copies the example .env file
cp .env.example .env
```
Now, open the `.env` file and add your `GOOGLE_API_KEY`.

**3. Start the Application**
```bash
# This will build the containers, start the services, and set up the database
uvx --from=rust-just just dev
```

That's it! The application is now running and available at [http://localhost:3000](http://localhost:3000).

## ✅ Available Commands (`justfile`)

Use `uvx --from=rust-just just <command>` to run any of the following tasks:

| Command      | Description                                                                |
|--------------|----------------------------------------------------------------------------|
| `dev`        | **(Default)** Starts the development environment with hot-reloading.         |
| `prod`       | Starts the production environment.                                         |
| `stop`       | Stops all running Docker containers.                                       |
| `logs`       | Tails the logs from the running services.                                  |
| `clean`      | Stops and removes all containers, volumes, and networks.                   |
| `db-setup`   | Pushes the Prisma schema and seeds the database. (Runs automatically).     |
| `test`       | Starts the production services, runs validation checks, and stops services. |

## 🔧 Development

### Database Management
Prisma is used for database management. Here are some useful commands:

- **Push Schema Changes:** `npx prisma db push`
- **Seed the Database:** `npm run db:seed`
- **Open Prisma Studio:** `npx prisma studio` (A GUI for your database)

### Tech Stack
- **Frontend:** Next.js 15, React, TypeScript
- **UI:** Tailwind CSS, shadcn/ui
- **Backend:** Next.js Server Actions
- **AI:** Google AI (Gemini) via Genkit
- **Database:** PostgreSQL with Prisma ORM
- **Containerization:** Docker & Docker Compose
- **Task Runner:** Just

## Troubleshooting

- **Port Conflicts:** Ensure ports `3000` (app) and `5432` (db) are free.
- **AI Analysis Fails:** Double-check that your `GOOGLE_API_KEY` is correct in the `.env` file.
- **Database Issues:** Run `uvx --from=rust-just just db-setup` to manually reset the database. If problems persist, run `uvx --from=rust-just just clean` and then `uvx --from=rust-just just dev`.


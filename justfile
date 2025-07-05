set dotenv-load := true


@_default: 
    just --list --unsorted

port := "9002"

# ====================
# DOCKER DEPLOYMENT
# ====================


# Starts a development or production environment using Docker [dev/prod].
[doc("Use `just up dev` to start the development environment or `just up prod` for production.")]
[group("docker")]
up ENV:
    @echo {{ if ENV == "dev" { "🚀 Starting Development environment..." } else if ENV == "prod" { "🚀 Starting Production environment..." } else { error("Please choose between [dev, prod] !") } }}
    @docker compose {{ if ENV == "dev" { "-f docker-compose.dev.yml" } else { " " } }} up --build -d 
    @echo "✅ App hosted at http://localhost:{{port}}"

# Stops the Docker containers and removes them.
[group("docker")]
down:
    @echo "🧹 Cleaning up the environment..."
    @docker compose down -v --remove-orphans
    @echo "✅ Environment cleaned."

# Tails the logs from the services
[group("docker")]
logs:
    @docker compose logs -f

# ====================
# TESTING & CI
# ====================

# Runs the complete test workflow
[group("testing")]
test:
    @echo "--- Waiting for services to start up (10s)... ---"
    @sleep 10
    @echo "--- Validating Docker Containers ---"
    @docker-compose ps
    @echo "--- Validating Database Connection ---"
    @docker-compose exec -T db pg_isready -U releaseradar -d releaseradar
    @echo "--- Validating Health Check Endpoint ---"
    @curl --fail http://localhost:{{port}}/api/health
    @echo "--- Validating Frontend ---"
    @curl --fail http://localhost:{{port}}
    @echo "--- All tests passed! Cleaning up... ---"
    @just stop

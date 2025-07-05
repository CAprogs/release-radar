set dotenv-load := true

@_default: 
    just --list --unsorted

# ====================
# DOCKER DEPLOYMENT
# ====================

# This task builds and starts the Docker containers in detached mode.
[group("docker")]
@up:
    docker compose up --build -d

# This task stops the Docker containers and removes them.
[group("docker")]
@down:
    docker compose down

# Starts the development environment with hot-reloading
[group("docker")]
@dev:
    echo "🚀 Starting development environment..."
    docker-compose -f docker-compose.dev.yml up -d --build
    just db-setup
    echo "✅ Development environment ready at http://localhost:9002"

# Starts the production environment
[group("docker")]
@prod:
    echo "🚀 Starting production environment..."
    docker-compose up -d --build
    just db-setup
    echo "✅ Production environment ready at http://localhost:9002"

# Stops all running containers
[group("docker")]
@stop:
    echo "🛑 Stopping all containers..."
    docker-compose down

# Tails the logs from the services
[group("docker")]
@logs:
    docker-compose logs -f

# Cleans the environment by stopping and removing containers, volumes, and networks
[group("docker")]
@clean:
    echo "🧹 Cleaning up the environment..."
    docker-compose down -v --remove-orphans
    echo "✅ Environment cleaned."

# ====================
# DATABASE MANAGEMENT
# ====================

# Sets up the database by pushing the schema and seeding data
[group("database")]
@db-setup:
    echo "🛠️ Setting up the database..."
    npx prisma db push
    npm run db:seed
    echo "✅ Database setup complete."

# ====================
# TESTING & CI
# ====================

# Runs the complete test workflow
[group("testing")]
@test:
    echo "🧪 Running test workflow..."
    just prod
    echo "--- Waiting for services to start up (10s)... ---"
    sleep 10
    echo "--- Validating Docker Containers ---"
    docker-compose ps
    echo "--- Validating Database Connection ---"
    docker-compose exec -T db pg_isready -U releaseradar -d releaseradar
    echo "--- Validating Health Check Endpoint ---"
    curl --fail http://localhost:9002/api/health
    echo "--- Validating Frontend ---"
    curl --fail http://localhost:9002
    echo "--- All tests passed! Cleaning up... ---"
    just stop

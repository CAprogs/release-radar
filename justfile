@_default:
    just --list --unsorted

# This task builds and starts the Docker containers in detached mode.
[group("docker")]
@up:
    docker compose up --build -d

# This task stops the Docker containers and removes them.
[group("docker")]
@down:
    docker compose down

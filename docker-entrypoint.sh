#!/bin/sh

# Check if GOOGLE_API_KEY is set
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "ERROR: GOOGLE_API_KEY environment variable is not set"
    echo "Please set your Google AI API key in the .env file"
    echo "Get your API key from: https://ai.google.dev/"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    echo "Please ensure the database is configured properly"
    exit 1
fi

# Wait for database to be ready
echo "Waiting for database to be ready..."
until npx prisma db push --force-reset >/dev/null 2>&1; do
    echo "Database is unavailable - sleeping"
    sleep 2
done

echo "Database is ready - running migrations..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

# Start the Next.js application
echo "Starting Release Radar..."
echo "Application will be available at: http://localhost:$PORT"
exec node server.js

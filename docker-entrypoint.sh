#!/bin/sh

# Check if GOOGLE_API_KEY is set
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "ERROR: GOOGLE_API_KEY environment variable is not set"
    echo "Please set your Google AI API key in the .env file"
    echo "Get your API key from: https://ai.google.dev/"
    exit 1
fi

# Start the Next.js application
echo "Starting Release Radar..."
echo "Application will be available at: http://localhost:$PORT"
exec node server.js

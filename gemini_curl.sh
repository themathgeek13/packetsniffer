#!/bin/bash

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "Error: GEMINI_API_KEY environment variable is not set"
    echo "Please set it first with: export GEMINI_API_KEY='your-api-key'"
    exit 1
fi

# Replace the placeholder with actual API key
CURL_CMD=$(echo "curl \"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY\" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
        \"contents\": [{
            \"parts\":[{\"text\": \"$1\"}]
        }]
    }'")

# Execute the curl command
eval $CURL_CMD | jq '.' 
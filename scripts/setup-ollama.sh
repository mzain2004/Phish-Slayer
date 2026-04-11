#!/bin/bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull base model
ollama pull llama3.1:8b

# Verify
ollama list
echo "Ollama ready"

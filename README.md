# NOVA - Neural Operational Virtual Assistant

![CI/CD](https://github.com/exposedcat/nova/workflows/CI%2FCD/badge.svg)

AI-powered command line assistant that generates and executes shell commands
from natural language.

## Quick Install

Download the latest release for your platform from the
[Releases page](https://github.com/exposedcat/nova/releases).

Setup environment:

```bash
# Use Ollama (default)
export NOVA_LLM_URL="http://your-server:11434/api/chat"
export NOVA_MODEL="gemma3n:e4b"  # optional, model to use

# Use Google Gemini instead
export NOVA_LLM_URL="gemini"
export NOVA_MODEL="gemini-2.0-flash"  # optional, defaults to gemini-2.0-flash
export NOVA_GEMINI_API_KEY="your_api_key"  # required for Gemini
```

```bash
curl -L https://github.com/exposedcat/nova/releases/latest/download/nova-linux-x64 -o nova
chmod +x nova
sudo mv nova /usr/local/bin/
nova install
```

## Build

```bash
deno task build
```

This creates a `nova` binary in the current directory.

## Installation

1. **Build the binary:**
   ```bash
   deno task build
   ```

2. **Move to PATH:**
   ```bash
   sudo mv nova /usr/local/bin/
   # or
   mv nova ~/.local/bin/  # ensure ~/.local/bin is in your PATH
   ```

3. **Set up shortcuts (optional):**
   ```bash
   nova install
   ```
   This creates shell aliases for faster access (default: `nexus`, `orbit`,
   `aurora`).

## Features

- **Command Generation**: `nova command "your request"` - Generate and execute
  shell commands
- **Long Mode**: `nova command -l "your request"` - Continue interaction after
  command execution
- **Chat Mode**: `nova chat` - Interactive conversation with AI
- **Shell Integration**: `nova install` - Set up custom shortcuts for commands

## Examples

```bash
nova command "show all running processes"
nova command -l "list files and analyze disk usage"
nova chat
```

## Requirements

- [Deno v2+](https://deno.land/) runtime
- AI backend: Ollama (local) or Google Gemini API

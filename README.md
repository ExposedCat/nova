# NOVA - Neural Operational Virtual Assistant

AI-powered command line assistant that generates and executes shell commands
from natural language.

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
   mv nova ~/.local/bin/  # if ~/.local/bin is in your PATH
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

- [Deno](https://deno.land/) runtime
- Ollama running locally for AI functionality

#!/usr/bin/env -S deno run --allow-run --allow-env --allow-net --allow-read --allow-write

import { handleCommand, handleCommandLong } from "./subcommands/command.ts";
import { handleChat } from "./subcommands/chat.ts";
import { handleInstall } from "./subcommands/install.ts";

const colors = {
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	reset: "\x1b[0m",
	bold: "\x1b[1m",
};

function showHelp() {
	console.log(`${colors.bold}NOVA${colors.reset} - AI-powered command line assistant

${colors.bold}USAGE:${colors.reset}
    nova <subcommand> [arguments]

${colors.bold}SUBCOMMANDS:${colors.reset}
    ${colors.green}command${colors.reset}  <prompt>            Generate and execute shell commands from natural language
    ${colors.green}command${colors.reset}  -l|--long <prompt>  Long mode - continue after execution, stop only on Esc
    ${colors.green}chat${colors.reset}                        Start an interactive chat session with the AI
    ${colors.green}install${colors.reset}                     Set up shell shortcuts for nova commands
    ${colors.green}install${colors.reset}  -a|--auto          Install with default shortcuts (no prompts)
    ${colors.green}help${colors.reset}                        Show this help message

${colors.bold}EXAMPLES:${colors.reset}
    nova command "show me all running processes"
    nova command --long "create a backup of my home directory"
    nova command -l "list files and then analyze them"
    nova chat
    nova install
    nova install --auto
    nova help`);
}

async function main() {
	const args = Deno.args;

	if (args.length === 0) {
		showHelp();
		Deno.exit(1);
	}

	const subcommand = args[0];
	const subcommandArgs = args.slice(1);

	try {
		switch (subcommand) {
			case "command": {
				if (subcommandArgs.length === 0) {
					console.error("Error: 'command' subcommand requires a prompt");
					console.error("Usage: nova command '<your prompt>'");
					console.error("       nova command -l|--long '<your prompt>'");
					console.error(
						"Example: nova command 'show me all running processes'",
					);
					Deno.exit(1);
				}

				let longMode = false;
				let promptStart = 0;

				if (subcommandArgs[0] === "-l" || subcommandArgs[0] === "--long") {
					longMode = true;
					promptStart = 1;

					if (subcommandArgs.length === 1) {
						console.error(
							"Error: 'command' subcommand with -l/--long requires a prompt",
						);
						console.error("Usage: nova command -l|--long '<your prompt>'");
						console.error(
							"Example: nova command --long 'list files and analyze them'",
						);
						Deno.exit(1);
					}
				}

				const userInput = subcommandArgs.slice(promptStart).join(" ");

				if (longMode) {
					await handleCommandLong(userInput);
				} else {
					await handleCommand(userInput);
				}
				break;
			}
			case "chat": {
				await handleChat();
				break;
			}
			case "install": {
				// Check for auto mode flags
				let autoMode = false;

				if (
					subcommandArgs.length > 0 &&
					(subcommandArgs[0] === "-a" || subcommandArgs[0] === "--auto")
				) {
					autoMode = true;
				}

				await handleInstall(autoMode);
				break;
			}
			case "help":
			case "--help":
			case "-h": {
				showHelp();
				break;
			}
			default: {
				console.error(`Error: Unknown subcommand '${subcommand}'`);
				console.error("Run 'nova help' to see available subcommands");
				Deno.exit(1);
			}
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`nova: error: ${errorMessage}`);
		Deno.exit(1);
	}
}

if (import.meta.main) {
	await main();
}

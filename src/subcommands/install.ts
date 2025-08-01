import { execute } from "../cli.ts";

const colors = {
	green: "\x1b[32m",
	blue: "\x1b[34m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
};

interface ShortcutConfig {
	command: string;
	commandLong: string;
	chat: string;
}

const defaultShortcuts: ShortcutConfig = {
	command: "nexus",
	commandLong: "orbit",
	chat: "aurora",
};

async function readInput(prompt: string): Promise<string | null> {
	await Deno.stdout.write(new TextEncoder().encode(prompt));
	const decoder = new TextDecoder();
	const buffer = new Uint8Array(1024);

	const bytesRead = await Deno.stdin.read(buffer);
	if (bytesRead === null) {
		// EOF encountered (Ctrl+D)
		return null;
	}

	return decoder.decode(buffer.subarray(0, bytesRead)).trim();
}

function validateShortcut(shortcut: string): boolean {
	if (!shortcut) return false;
	if (shortcut.includes(" ")) return false;
	if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(shortcut)) return false;
	return true;
}

async function promptForShortcuts(
	autoMode: boolean = false,
): Promise<ShortcutConfig> {
	if (autoMode) {
		console.log(
			`${colors.bold}${colors.blue}Nova Install (Auto Mode)${colors.reset}\n`,
		);
		console.log("Using default shortcuts:");
		console.log(
			`  ${colors.blue}nova command${colors.reset} → ${colors.green}${defaultShortcuts.command}${colors.reset}`,
		);
		console.log(
			`  ${colors.blue}nova command -l${colors.reset} → ${colors.green}${defaultShortcuts.commandLong}${colors.reset}`,
		);
		console.log(
			`  ${colors.blue}nova chat${colors.reset} → ${colors.green}${defaultShortcuts.chat}${colors.reset}\n`,
		);
		return defaultShortcuts;
	}

	console.log(`${colors.bold}${colors.blue}Nova Install${colors.reset}\n`);
	console.log("Setting up shell shortcuts for Nova commands.");

	let command: string;
	while (true) {
		const input = await readInput(
			`Shortcut for "${colors.blue}nova command${colors.reset}" [${colors.green}${defaultShortcuts.command}${colors.reset}]: `,
		);

		// Handle EOF (Ctrl+D)
		if (input === null) {
			console.log(`\n${colors.dim}Installation cancelled.${colors.reset}`);
			Deno.exit(0);
		}

		command = input || defaultShortcuts.command;

		if (validateShortcut(command)) {
			break;
		} else {
			console.log(
				`${colors.red}Error:${colors.reset} Shortcuts must be single words (alphanumeric, underscore, hyphen only)\n`,
			);
		}
	}

	let commandLong: string;
	while (true) {
		const input = await readInput(
			`Shortcut for "${colors.blue}nova command -l${colors.reset}" [${colors.green}${defaultShortcuts.commandLong}${colors.reset}]: `,
		);

		// Handle EOF (Ctrl+D)
		if (input === null) {
			console.log(`\n${colors.dim}Installation cancelled.${colors.reset}`);
			Deno.exit(0);
		}

		commandLong = input || defaultShortcuts.commandLong;

		if (validateShortcut(commandLong)) {
			break;
		} else {
			console.log(
				`${colors.red}Error:${colors.reset} Shortcuts must be single words (alphanumeric, underscore, hyphen only)\n`,
			);
		}
	}

	let chat: string;
	while (true) {
		const input = await readInput(
			`Shortcut for "${colors.blue}nova chat${colors.reset}" [${colors.green}${defaultShortcuts.chat}${colors.reset}]: `,
		);

		// Handle EOF (Ctrl+D)
		if (input === null) {
			console.log(`\n${colors.dim}Installation cancelled.${colors.reset}`);
			Deno.exit(0);
		}

		chat = input || defaultShortcuts.chat;

		if (validateShortcut(chat)) {
			break;
		} else {
			console.log(
				`${colors.red}Error:${colors.reset} Shortcuts must be single words (alphanumeric, underscore, hyphen only)\n`,
			);
		}
	}

	return { command, commandLong, chat };
}

function detectShell(): { shell: string; rcFile: string } {
	const shell = Deno.env.get("SHELL") || "/bin/bash";
	const home = Deno.env.get("HOME") || "";

	if (shell.includes("zsh")) {
		return { shell: "zsh", rcFile: `${home}/.zshrc` };
	} else if (shell.includes("fish")) {
		return { shell: "fish", rcFile: `${home}/.config/fish/config.fish` };
	} else {
		return { shell: "bash", rcFile: `${home}/.bashrc` };
	}
}

function generateAliases(shortcuts: ShortcutConfig, shell: string): string {
	const timestamp = new Date().toISOString().split("T")[0];

	if (shell === "fish") {
		return `
# __NOVA_START__
# Nova shortcuts - added by nova install (${timestamp})
alias ${shortcuts.command} 'nova command'
alias ${shortcuts.commandLong} 'nova command -l'
alias ${shortcuts.chat} 'nova chat'
# __NOVA_END__
`;
	} else {
		// bash/zsh
		return `
# __NOVA_START__
# Nova shortcuts - added by nova install (${timestamp})
alias ${shortcuts.command}='nova command'
alias ${shortcuts.commandLong}='nova command -l'
alias ${shortcuts.chat}='nova chat'
# __NOVA_END__
`;
	}
}

async function ensureRcFileExists(rcFile: string): Promise<void> {
	try {
		await Deno.stat(rcFile);
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			// Create the file if it doesn't exist
			await Deno.writeTextFile(rcFile, "");
		} else {
			throw error;
		}
	}
}

async function removeOldNovaSection(rcFile: string): Promise<boolean> {
	try {
		const content = await Deno.readTextFile(rcFile);
		const lines = content.split("\n");

		let startIndex = -1;
		let endIndex = -1;

		// Find Nova markers
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].trim() === "# __NOVA_START__") {
				startIndex = i;
			} else if (lines[i].trim() === "# __NOVA_END__") {
				endIndex = i;
				break;
			}
		}

		// If both markers found, remove the section
		if (startIndex !== -1 && endIndex !== -1) {
			const newLines = [
				...lines.slice(0, startIndex),
				...lines.slice(endIndex + 1),
			];

			await Deno.writeTextFile(rcFile, newLines.join("\n"));
			return true; // Removed old section
		}

		return false; // No old section found
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			return false; // File doesn't exist, nothing to remove
		}
		throw error;
	}
}

async function updateRcFile(rcFile: string, content: string): Promise<void> {
	await ensureRcFileExists(rcFile);

	// Remove old Nova installation if it exists
	const removedOld = await removeOldNovaSection(rcFile);

	if (removedOld) {
		console.log(
			`${colors.yellow}↻${colors.reset} Removed previous Nova installation`,
		);
	}

	// Add new Nova installation
	await Deno.writeTextFile(rcFile, content, { append: true });
}

export async function handleInstall(autoMode: boolean = false) {
	try {
		const shortcuts = await promptForShortcuts(autoMode);
		const { shell, rcFile } = detectShell();

		console.log(`\n${colors.bold}Configuration:${colors.reset}`);
		console.log(
			`  ${colors.blue}${shortcuts.command}${colors.reset} → nova command`,
		);
		console.log(
			`  ${colors.blue}${shortcuts.commandLong}${colors.reset} → nova command -l`,
		);
		console.log(`  ${colors.blue}${shortcuts.chat}${colors.reset} → nova chat`);
		console.log(`  Shell: ${colors.green}${shell}${colors.reset}`);
		console.log(`  RC file: ${colors.green}${rcFile}${colors.reset}\n`);

		if (!autoMode) {
			const confirm = await readInput(
				`Proceed with installation? [${colors.green}Y${colors.reset}/n]: `,
			);

			// Handle EOF (Ctrl+D)
			if (confirm === null) {
				console.log(`\n${colors.dim}Installation cancelled.${colors.reset}`);
				return;
			}

			if (confirm.toLowerCase() === "n" || confirm.toLowerCase() === "no") {
				console.log("Installation cancelled.");
				return;
			}
		}

		const aliases = generateAliases(shortcuts, shell);
		await updateRcFile(rcFile, aliases);

		console.log(`${colors.green}✓${colors.reset} Aliases added to ${rcFile}`);
		console.log(
			`${colors.dim}You may need to restart your shell or run:${colors.reset}`,
		);

		if (shell === "fish") {
			console.log(`  ${colors.blue}source ${rcFile}${colors.reset}`);
		} else {
			console.log(`  ${colors.blue}source ${rcFile}${colors.reset}`);
		}

		console.log(`\n${colors.bold}Your new shortcuts:${colors.reset}`);
		console.log(
			`  ${colors.green}${shortcuts.command}${colors.reset} "<prompt>" - Generate and run commands`,
		);
		console.log(
			`  ${colors.green}${shortcuts.commandLong}${colors.reset} "<prompt>" - Long mode commands`,
		);
		console.log(
			`  ${colors.green}${shortcuts.chat}${colors.reset} - Start chat session`,
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`${colors.red}Error:${colors.reset} ${errorMessage}`);
		throw error;
	}
}
